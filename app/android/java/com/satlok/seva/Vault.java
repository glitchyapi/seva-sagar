package com.satlok.seva;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * SV1 vault: deflate(BEST_COMPRESSION) -> AES-256-GCM envelope.
 *
 * A random 256-bit Data Encryption Key (DEK) encrypts every record. The DEK is wrapped
 * either by a hardware-backed AndroidKeyStore key (device bound) or, when the devotee
 * sets a PIN, by a PBKDF2-HMAC-SHA256 key derived from that PIN (200k iterations).
 * Records are written atomically (tmp + fsync + rename) so a crash can never corrupt a diary.
 */
public final class Vault {

    private static final String MAGIC = "SV1";
    private static final String KS = "AndroidKeyStore";
    private static final String KS_ALIAS = "seva.dek.wrap";
    private static final int PBKDF2_ITER = 200000;
    private static final int GCM_TAG_BITS = 128;

    private final Context ctx;
    private final File dir;
    private final SharedPreferences prefs;
    private final SecureRandom rnd = new SecureRandom();
    private byte[] dek;              // unlocked data key (memory only)
    private boolean pinMode;

    public Vault(Context c) {
        ctx = c.getApplicationContext();
        dir = new File(ctx.getFilesDir(), "vault");
        if (!dir.exists()) dir.mkdirs();
        prefs = ctx.getSharedPreferences("seva_vault", Context.MODE_PRIVATE);
        pinMode = prefs.getBoolean("pin_mode", false);
        if (!pinMode) {
            try { dek = loadOrCreateDekKeystore(); } catch (Exception e) { dek = null; }
        }
    }

    public boolean isPinMode() { return pinMode; }
    public boolean isUnlocked() { return dek != null; }

    // ---------------------------------------------------------------- keys
    private SecretKey keystoreKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(KS);
        ks.load(null);
        SecretKey k = (SecretKey) ks.getKey(KS_ALIAS, null);
        if (k != null) return k;
        javax.crypto.KeyGenerator kg = javax.crypto.KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES, KS);
        KeyGenParameterSpec.Builder b = new KeyGenParameterSpec.Builder(KS_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true);
        kg.init(b.build());
        return kg.generateKey();
    }

    private byte[] loadOrCreateDekKeystore() throws Exception {
        File f = new File(dir, "dek.ks");
        if (f.exists()) {
            byte[] blob = read(f);
            byte[] iv = Arrays.copyOfRange(blob, 0, 12);
            byte[] ct = Arrays.copyOfRange(blob, 12, blob.length);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, keystoreKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            return c.doFinal(ct);
        }
        byte[] k = new byte[32];
        rnd.nextBytes(k);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, keystoreKey());
        byte[] ct = c.doFinal(k);
        byte[] iv = c.getIV();
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(iv); bos.write(ct);
        atomicWrite(f, bos.toByteArray());
        return k;
    }

    /** Portable PBKDF2-HMAC-SHA256 (works on every API level, no provider quirks). */
    public static byte[] pbkdf2(char[] pass, byte[] salt, int iter, int bits) {
        try {
            byte[] pw = new String(pass).getBytes(StandardCharsets.UTF_8);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pw, "HmacSHA256"));
            int hLen = mac.getMacLength();
            int blocks = (bits / 8 + hLen - 1) / hLen;
            byte[] out = new byte[blocks * hLen];
            for (int i = 1; i <= blocks; i++) {
                mac.reset();
                mac.update(salt);
                mac.update(new byte[]{(byte) (i >>> 24), (byte) (i >>> 16), (byte) (i >>> 8), (byte) i});
                byte[] u = mac.doFinal();
                byte[] t = u.clone();
                for (int j = 1; j < iter; j++) {
                    mac.reset();
                    u = mac.doFinal(u);
                    for (int x = 0; x < hLen; x++) t[x] ^= u[x];
                }
                System.arraycopy(t, 0, out, (i - 1) * hLen, hLen);
            }
            return Arrays.copyOf(out, bits / 8);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    public synchronized JSONObject setPin(String pin) throws Exception {
        if (dek == null) throw new IllegalStateException("locked");
        if (pin == null || pin.length() < 4) throw new IllegalArgumentException("pin too short");
        byte[] salt = new byte[16];
        rnd.nextBytes(salt);
        byte[] wrap = pbkdf2(pin.toCharArray(), salt, PBKDF2_ITER, 256);
        byte[] iv = new byte[12];
        rnd.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(wrap, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] ct = c.doFinal(dek);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(salt); bos.write(iv); bos.write(ct);
        atomicWrite(new File(dir, "dek.pin"), bos.toByteArray());
        prefs.edit().putBoolean("pin_mode", true).apply();
        pinMode = true;
        JSONObject o = new JSONObject();
        o.put("ok", true); o.put("pin", true); o.put("iterations", PBKDF2_ITER);
        return o;
    }

    public synchronized boolean unlock(String pin) {
        try {
            byte[] blob = read(new File(dir, "dek.pin"));
            byte[] salt = Arrays.copyOfRange(blob, 0, 16);
            byte[] iv = Arrays.copyOfRange(blob, 16, 28);
            byte[] ct = Arrays.copyOfRange(blob, 28, blob.length);
            byte[] wrap = pbkdf2(pin.toCharArray(), salt, PBKDF2_ITER, 256);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(wrap, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
            dek = c.doFinal(ct);
            return true;
        } catch (Exception e) {
            dek = null;
            return false;
        }
    }

    public synchronized void removePin(String pin) throws Exception {
        if (pinMode && !unlock(pin)) throw new IllegalStateException("bad pin");
        // re-wrap current DEK with the hardware key
        byte[] k = dek;
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, keystoreKey());
        byte[] ct = c.doFinal(k);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(c.getIV()); bos.write(ct);
        atomicWrite(new File(dir, "dek.ks"), bos.toByteArray());
        new File(dir, "dek.pin").delete();
        prefs.edit().putBoolean("pin_mode", false).apply();
        pinMode = false;
    }

    public synchronized void lock() { if (pinMode) dek = null; }

    // ---------------------------------------------------------------- records
    public JSONObject write(String key, String data) throws Exception {
        if (dek == null) throw new IllegalStateException("locked");
        byte[] plain = data.getBytes(StandardCharsets.UTF_8);
        byte[] comp = deflate(plain);
        boolean useComp = comp.length < plain.length;
        byte[] body = useComp ? comp : plain;

        byte[] iv = new byte[12];
        rnd.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(dek, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        c.updateAAD(MAGIC.getBytes(StandardCharsets.UTF_8));
        byte[] ct = c.doFinal(body);

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write(MAGIC.getBytes(StandardCharsets.UTF_8));
        bos.write(useComp ? 1 : 0);
        bos.write(iv);
        bos.write(ct);
        byte[] blob = bos.toByteArray();
        atomicWrite(file(key), blob);

        JSONObject o = new JSONObject();
        o.put("ok", true);
        o.put("raw", plain.length);
        o.put("stored", blob.length);
        o.put("deflated", useComp);
        o.put("ratio", plain.length == 0 ? 0 : (1.0 - (double) blob.length / plain.length));
        return o;
    }

    public String read(String key) throws Exception {
        if (dek == null) throw new IllegalStateException("locked");
        File f = file(key);
        if (!f.exists()) return null;
        byte[] blob = read(f);
        if (blob.length < 16) throw new IllegalStateException("corrupt");
        String magic = new String(blob, 0, 3, StandardCharsets.UTF_8);
        if (!MAGIC.equals(magic)) throw new IllegalStateException("bad magic");
        boolean comp = blob[3] == 1;
        byte[] iv = Arrays.copyOfRange(blob, 4, 16);
        byte[] ct = Arrays.copyOfRange(blob, 16, blob.length);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(dek, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        c.updateAAD(MAGIC.getBytes(StandardCharsets.UTF_8));
        byte[] body = c.doFinal(ct);
        byte[] plain = comp ? inflate(body) : body;
        return new String(plain, StandardCharsets.UTF_8);
    }

    public JSONObject stats() throws Exception {
        JSONObject o = new JSONObject();
        long stored = 0;
        int n = 0;
        File[] fs = dir.listFiles();
        if (fs != null) for (File f : fs) {
            if (f.getName().endsWith(".sv")) { stored += f.length(); n++; }
        }
        o.put("records", n);
        o.put("stored", stored);
        o.put("cipher", "AES-256-GCM");
        o.put("kdf", pinMode ? ("PBKDF2-HMAC-SHA256 x" + PBKDF2_ITER) : "AndroidKeyStore (hardware)");
        o.put("compression", "DEFLATE-9");
        o.put("pin", pinMode);
        o.put("unlocked", dek != null);
        return o;
    }

    public JSONObject list() throws Exception {
        JSONObject o = new JSONObject();
        org.json.JSONArray arr = new org.json.JSONArray();
        File[] fs = dir.listFiles();
        if (fs != null) for (File f : fs) {
            if (!f.getName().endsWith(".sv")) continue;
            JSONObject r = new JSONObject();
            r.put("key", f.getName().substring(0, f.getName().length() - 3));
            r.put("size", f.length());
            r.put("modified", f.lastModified());
            arr.put(r);
        }
        o.put("ok", true);
        o.put("items", arr);
        return o;
    }

    public boolean delete(String key) { return file(key).delete(); }

    public File file(String key) {
        String safe = key.replaceAll("[^A-Za-z0-9._-]", "_");
        return new File(dir, safe + ".sv");
    }

    /** Export the whole vault as one encrypted+compressed container (portable backup). */
    public byte[] exportAll(String passphrase) throws Exception {
        org.json.JSONObject all = new org.json.JSONObject();
        File[] fs = dir.listFiles();
        if (fs != null) for (File f : fs) {
            if (!f.getName().endsWith(".sv")) continue;
            String k = f.getName().substring(0, f.getName().length() - 3);
            String v = read(k);
            if (v != null) all.put(k, v);
        }
        byte[] plain = all.toString().getBytes(StandardCharsets.UTF_8);
        byte[] comp = deflate(plain);
        byte[] salt = new byte[16], iv = new byte[12];
        rnd.nextBytes(salt); rnd.nextBytes(iv);
        byte[] key = pbkdf2(passphrase.toCharArray(), salt, PBKDF2_ITER, 256);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        c.updateAAD(MAGIC.getBytes(StandardCharsets.UTF_8));
        byte[] ct = c.doFinal(comp);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bos.write("SVBAK1".getBytes(StandardCharsets.UTF_8));
        bos.write(salt); bos.write(iv); bos.write(ct);
        return bos.toByteArray();
    }

    public int importAll(byte[] blob, String passphrase) throws Exception {
        String magic = new String(blob, 0, 6, StandardCharsets.UTF_8);
        if (!"SVBAK1".equals(magic)) throw new IllegalStateException("not a Seva Sagar backup");
        byte[] salt = Arrays.copyOfRange(blob, 6, 22);
        byte[] iv = Arrays.copyOfRange(blob, 22, 34);
        byte[] ct = Arrays.copyOfRange(blob, 34, blob.length);
        byte[] key = pbkdf2(passphrase.toCharArray(), salt, PBKDF2_ITER, 256);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(GCM_TAG_BITS, iv));
        c.updateAAD(MAGIC.getBytes(StandardCharsets.UTF_8));
        byte[] comp = c.doFinal(ct);
        String json = new String(inflate(comp), StandardCharsets.UTF_8);
        JSONObject all = new JSONObject(json);
        java.util.Iterator<String> it = all.keys();
        int n = 0;
        while (it.hasNext()) { String k = it.next(); write(k, all.getString(k)); n++; }
        return n;
    }

    // ---------------------------------------------------------------- helpers
    static byte[] deflate(byte[] in) throws Exception {
        Deflater d = new Deflater(Deflater.BEST_COMPRESSION, true);
        ByteArrayOutputStream bos = new ByteArrayOutputStream(Math.max(64, in.length / 3));
        DeflaterOutputStream dos = new DeflaterOutputStream(bos, d, 16384);
        dos.write(in);
        dos.finish();
        dos.close();
        d.end();
        return bos.toByteArray();
    }

    static byte[] inflate(byte[] in) throws Exception {
        Inflater inf = new Inflater(true);
        InflaterInputStream iis = new InflaterInputStream(new java.io.ByteArrayInputStream(in), inf, 16384);
        byte[] out = Net.readAll(iis);
        inf.end();
        return out;
    }

    static void atomicWrite(File f, byte[] data) throws Exception {
        File tmp = new File(f.getParentFile(), f.getName() + ".tmp");
        FileOutputStream fos = new FileOutputStream(tmp);
        fos.write(data);
        fos.flush();
        fos.getFD().sync();
        fos.close();
        if (f.exists() && !f.delete()) throw new IllegalStateException("replace failed");
        if (!tmp.renameTo(f)) throw new IllegalStateException("rename failed");
    }

    static byte[] read(File f) throws Exception {
        FileInputStream fis = new FileInputStream(f);
        byte[] b = Net.readAll(fis);
        fis.close();
        return b;
    }
}
