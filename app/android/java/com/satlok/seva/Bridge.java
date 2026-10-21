package com.satlok.seva;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.util.Locale;

/** The single JS &lt;-&gt; native surface. Every method returns a JSON string. */
public final class Bridge {

    private final WeakReference<MainActivity> ref;
    private final Context app;
    private final Vault vault;
    private final Notify notify;
    private final Updater updater;
    private final SharedPreferences kv;

    Bridge(MainActivity a, Vault v, Notify n, Updater u) {
        ref = new WeakReference<MainActivity>(a);
        app = a.getApplicationContext();
        vault = v; notify = n; updater = u;
        kv = app.getSharedPreferences("seva_prefs", Context.MODE_PRIVATE);
    }

    private MainActivity act() { return ref.get(); }

    private static String ok() { return "{\"ok\":true}"; }
    private static String err(Exception e) {
        return JSONObject.quote(String.valueOf(e.getClass().getSimpleName() + ": " + e.getMessage()))
                .replaceFirst("^\"", "{\"ok\":false,\"error\":\"").replaceFirst("\"$", "\"}");
    }
    private static String fail(String msg) {
        JSONObject o = new JSONObject();
        try { o.put("ok", false); o.put("error", msg); } catch (Exception ignored) { }
        return o.toString();
    }

    // ------------------------------------------------------------------ info
    @JavascriptInterface public String info() {
        try {
            JSONObject o = new JSONObject();
            PackageInfo pi = app.getPackageManager().getPackageInfo(app.getPackageName(), 0);
            o.put("ok", true);
            o.put("app", "Seva Sagar");
            o.put("package", app.getPackageName());
            o.put("versionName", pi.versionName);
            o.put("versionCode", Build.VERSION.SDK_INT >= 28
                    ? (int) pi.getLongVersionCode() : pi.versionCode);
            o.put("webVersion", updater.activeVersion());
            o.put("baseWebVersion", updater.baseVersion());
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("release", Build.VERSION.RELEASE);
            o.put("device", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("brand", Build.BRAND);
            o.put("abis", Build.VERSION.SDK_INT >= 21 ? Build.SUPPORTED_ABIS[0] : Build.CPU_ABI);
            o.put("locale", Locale.getDefault().toString());
            o.put("language", Locale.getDefault().getLanguage());
            o.put("dark", isSystemDark());
            o.put("channel", "stable");
            o.put("firstRun", kv.getBoolean("first_run", true));
            o.put("notifications", notify.enabled());
            o.put("canInstall", updater.canInstall());
            o.put("vaultPin", vault.isPinMode());
            o.put("vaultUnlocked", vault.isUnlocked());
            o.put("runtime", "native");
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    private boolean isSystemDark() {
        int mode = app.getResources().getConfiguration().uiMode
                & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        return mode == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    }

    @JavascriptInterface public String markFirstRunDone() {
        kv.edit().putBoolean("first_run", false).apply();
        return ok();
    }

    // -------------------------------------------------------------------- kv
    @JavascriptInterface public String kvGet(String key) {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("value", kv.getString(key, null));
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String kvSet(String key, String value) {
        kv.edit().putString(key, value).apply();
        return ok();
    }

    @JavascriptInterface public String kvRemove(String key) {
        kv.edit().remove(key).apply();
        return ok();
    }

    // ----------------------------------------------------------------- vault
    @JavascriptInterface public String vaultWrite(String key, String data) {
        try { return vault.write(key, data).toString(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String vaultRead(String key) {
        try {
            String s = vault.read(key);
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("found", s != null);
            if (s != null) o.put("data", s);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String vaultDelete(String key) {
        vault.delete(key);
        return ok();
    }

    @JavascriptInterface public String vaultList() {
        try { return vault.list().toString(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String vaultStats() {
        try { return vault.stats().toString(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String pinStatus() {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", true); o.put("pin", vault.isPinMode()); o.put("unlocked", vault.isUnlocked());
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String pinSet(String pin) {
        try { return vault.setPin(pin).toString(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String pinUnlock(String pin) {
        boolean okb = vault.unlock(pin);
        JSONObject o = new JSONObject();
        try { o.put("ok", okb); if (!okb) o.put("error", "wrong pin"); } catch (Exception ignored) { }
        return o.toString();
    }

    @JavascriptInterface public String pinRemove(String pin) {
        try { vault.removePin(pin); return ok(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String vaultLock() { vault.lock(); return ok(); }

    @JavascriptInterface public String backupExport(String passphrase) {
        try {
            byte[] blob = vault.exportAll(passphrase);
            File f = new File(app.getCacheDir(), "seva-backup-" + System.currentTimeMillis() + ".svbak");
            Updater.writeFile(f, blob);
            JSONObject o = new JSONObject();
            o.put("ok", true); o.put("path", f.getAbsolutePath()); o.put("bytes", blob.length);
            o.put("name", f.getName());
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String backupImport(String pathOrBase64, String passphrase, boolean isBase64) {
        try {
            byte[] blob = isBase64 ? Net.unb64(pathOrBase64) : Vault.read(new File(pathOrBase64));
            int n = vault.importAll(blob, passphrase);
            JSONObject o = new JSONObject();
            o.put("ok", true); o.put("records", n);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    // ------------------------------------------------------------------ http
    /** json: {url|urls[], method, headers{}, body, timeout, base64} */
    @JavascriptInterface public String http(String json) {
        try {
            JSONObject req = new JSONObject(json);
            int timeout = req.optInt("timeout", 20000);
            JSONObject headers = req.optJSONObject("headers");
            byte[] body = req.has("body")
                    ? req.getString("body").getBytes(java.nio.charset.StandardCharsets.UTF_8) : null;
            String method = req.optString("method", "GET");
            Net.Result r;
            if (req.has("urls")) r = Net.requestMirrors(req.getJSONArray("urls"), method, headers, body, timeout);
            else r = Net.request(req.getString("url"), method, headers, body, timeout, req.optInt("retries", 1));
            JSONObject o = new JSONObject();
            o.put("ok", r.ok);
            o.put("status", r.status);
            o.put("ms", r.ms);
            o.put("url", r.url);
            o.put("bytes", r.body == null ? 0 : r.body.length);
            if (r.error != null) o.put("error", r.error);
            if (r.body != null) {
                if (req.optBoolean("base64", false)) o.put("base64", Net.b64(r.body));
                else o.put("text", new String(r.body, java.nio.charset.StandardCharsets.UTF_8));
            }
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    // --------------------------------------------------------- notifications
    @JavascriptInterface public String notify(String json) {
        try {
            int id = notify.show(new JSONObject(json));
            JSONObject o = new JSONObject();
            o.put("ok", true); o.put("id", id);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String notifyCancel(int id) { notify.cancel(id); return ok(); }

    @JavascriptInterface public String notifyState() {
        try {
            JSONObject o = notify.channelState();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String reminderUpsert(String json) {
        try { notify.upsert(new JSONObject(json)); return ok(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String reminderCancel(String id) {
        try { notify.cancel(id); return ok(); } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String reminders() {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", true); o.put("items", notify.reminders());
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    // ----------------------------------------------------------- permissions
    @JavascriptInterface public String permissions() {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("notifications", notify.enabled());
            o.put("install", updater.canInstall());
            boolean storage = Build.VERSION.SDK_INT < 23 || app.checkSelfPermission(
                    Build.VERSION.SDK_INT >= 33 ? "android.permission.READ_MEDIA_IMAGES"
                            : "android.permission.READ_EXTERNAL_STORAGE") == PackageManager.PERMISSION_GRANTED;
            o.put("storage", storage);
            boolean allFiles = Build.VERSION.SDK_INT < 30 || Environment.isExternalStorageManager();
            o.put("allFiles", allFiles);
            boolean exact = true;
            if (Build.VERSION.SDK_INT >= 31) {
                android.app.AlarmManager am = (android.app.AlarmManager)
                        app.getSystemService(Context.ALARM_SERVICE);
                exact = am.canScheduleExactAlarms();
            }
            o.put("exactAlarm", exact);
            o.put("battery", isIgnoringBattery());
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    private boolean isIgnoringBattery() {
        try {
            android.os.PowerManager pm = (android.os.PowerManager) app.getSystemService(Context.POWER_SERVICE);
            return pm.isIgnoringBatteryOptimizations(app.getPackageName());
        } catch (Exception e) { return false; }
    }

    @JavascriptInterface public String requestPermissions(String json) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        try {
            JSONArray arr = new JSONArray(json);
            final String[] perms = new String[arr.length()];
            for (int i = 0; i < arr.length(); i++) perms[i] = arr.getString(i);
            a.runOnUiThread(new Runnable() {
                @Override public void run() { a.requestPerms(perms); }
            });
            return ok();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String openSettings(String what) {
        notify.openSettings(what);
        return ok();
    }

    // ----------------------------------------------------------- files/share
    /** json: {name, mime, base64|text, title} */
    @JavascriptInterface public String share(String json) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        try {
            JSONObject o = new JSONObject(json);
            String name = o.optString("name", "seva.png");
            byte[] data = o.has("base64") ? Net.unb64(o.getString("base64"))
                    : o.optString("text", "").getBytes(java.nio.charset.StandardCharsets.UTF_8);
            final File f = new File(app.getCacheDir(), "share/" + name);
            Updater.writeFile(f, data);
            final Uri uri = ShareProvider.uriFor(app, f);
            final String mime = o.optString("mime", "application/octet-stream");
            final String title = o.optString("title", "Share");
            a.runOnUiThread(new Runnable() {
                @Override public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType(mime);
                    i.putExtra(Intent.EXTRA_STREAM, uri);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    a.startActivity(Intent.createChooser(i, title));
                }
            });
            JSONObject r = new JSONObject();
            r.put("ok", true); r.put("path", f.getAbsolutePath()); r.put("bytes", data.length);
            return r.toString();
        } catch (Exception e) { return err(e); }
    }

    /** json: {name, base64, album} -> MediaStore Pictures (scoped-storage safe). */
    @JavascriptInterface public String saveImage(String json) {
        try {
            JSONObject o = new JSONObject(json);
            String name = o.optString("name", "seva-" + System.currentTimeMillis() + ".png");
            String album = o.optString("album", "Seva Sagar");
            byte[] data = Net.unb64(o.getString("base64"));
            String where;
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                cv.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + album);
                cv.put(MediaStore.Images.Media.IS_PENDING, 1);
                Uri uri = app.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) return fail("MediaStore insert failed");
                OutputStream os = app.getContentResolver().openOutputStream(uri);
                os.write(data); os.flush(); os.close();
                cv.clear();
                cv.put(MediaStore.Images.Media.IS_PENDING, 0);
                app.getContentResolver().update(uri, cv, null, null);
                where = "Pictures/" + album + "/" + name;
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_PICTURES), album);
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, name);
                FileOutputStream fos = new FileOutputStream(f);
                fos.write(data); fos.flush(); fos.close();
                Intent scan = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(f));
                app.sendBroadcast(scan);
                where = f.getAbsolutePath();
            }
            JSONObject r = new JSONObject();
            r.put("ok", true); r.put("path", where); r.put("bytes", data.length);
            return r.toString();
        } catch (Exception e) { return err(e); }
    }

    /** json: {id, mime, encoding:"text"|"base64"} */
    @JavascriptInterface public String pickFile(String json) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        try {
            final JSONObject o = new JSONObject(json);
            a.runOnUiThread(new Runnable() {
                @Override public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(o.optString("mime", "*/*"));
                    a.pickIntent = i;
                    a.pickId = o.optString("id", "pick");
                    a.pickEncoding = o.optString("encoding", "text");
                    a.startActivityForResult(i, MainActivity.REQ_PICK);
                }
            });
            return ok();
        } catch (Exception e) { return err(e); }
    }

    /** json: {id, name, mime, text|base64} */
    @JavascriptInterface public String saveFileAs(String json) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        try {
            final JSONObject o = new JSONObject(json);
            a.pendingSave = o;
            a.runOnUiThread(new Runnable() {
                @Override public void run() {
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType(o.optString("mime", "application/octet-stream"));
                    i.putExtra(Intent.EXTRA_TITLE, o.optString("name", "seva.svbak"));
                    a.startActivityForResult(i, MainActivity.REQ_SAVE);
                }
            });
            return ok();
        } catch (Exception e) { return err(e); }
    }

    /** Read a file the app itself produced (cache/files only) as base64. */
    @JavascriptInterface public String fileReadB64(String path) {
        try {
            File f = new File(path);
            String canon = f.getCanonicalPath();
            String cache = app.getCacheDir().getCanonicalPath();
            String files = app.getFilesDir().getCanonicalPath();
            if (!canon.startsWith(cache) && !canon.startsWith(files)) return fail("path not allowed");
            if (!f.exists()) return fail("missing");
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("base64", Net.b64(Vault.read(f)));
            o.put("bytes", f.length());
            o.put("name", f.getName());
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    // ---------------------------------------------------------------- update
    @JavascriptInterface public String updateState() {
        try {
            JSONObject o = updater.state();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String updateCheck(String json) {
        try {
            JSONObject req = new JSONObject(json);
            return updater.fetchManifest(req.getJSONArray("urls"), req.optInt("timeout", 15000)).toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String updatePlan(String manifestJson) {
        try {
            JSONObject o = updater.plan(new JSONObject(manifestJson));
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String updateApply(String json) {
        try {
            JSONObject req = new JSONObject(json);
            updater.apply(req.getJSONObject("plan"), req.getJSONObject("manifest"),
                    req.optBoolean("notify", true));
            return ok();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String updateCancel() { updater.cancel(); return ok(); }

    @JavascriptInterface public String updateRollback() {
        boolean okb = updater.rollback();
        JSONObject o = new JSONObject();
        try { o.put("ok", okb); o.put("active", updater.activeVersion()); } catch (Exception ignored) { }
        return o.toString();
    }

    @JavascriptInterface public String updateReset() {
        updater.resetToBase();
        return ok();
    }

    @JavascriptInterface public String apkState() {
        try {
            JSONObject o = updater.apkState();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String apkDownload(String json) {
        try {
            JSONObject req = new JSONObject(json);
            updater.downloadApk(req.getJSONArray("urls"), req.optString("sha256", ""),
                    req.optString("version", ""), req.optBoolean("notify", true));
            return ok();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String apkInstall() {
        try { return updater.installApk().toString(); } catch (Exception e) { return err(e); }
    }

    // ------------------------------------------------------------------- ui
    @JavascriptInterface public String setBars(final String json) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        a.runOnUiThread(new Runnable() {
            @Override public void run() { a.applyBars(json); }
        });
        return ok();
    }

    @JavascriptInterface public String haptic(String kind) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        a.runOnUiThread(new Runnable() {
            @Override public void run() { a.haptic(kind); }
        });
        return ok();
    }

    @JavascriptInterface public String toast(final String msg) {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        a.runOnUiThread(new Runnable() {
            @Override public void run() {
                android.widget.Toast.makeText(app, msg, android.widget.Toast.LENGTH_SHORT).show();
            }
        });
        return ok();
    }

    @JavascriptInterface public String restart() {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        a.runOnUiThread(new Runnable() {
            @Override public void run() { a.reloadApp(true); }
        });
        return ok();
    }

    @JavascriptInterface public String openUrl(String url) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            app.startActivity(i);
            return ok();
        } catch (Exception e) { return err(e); }
    }

    @JavascriptInterface public String exit() {
        final MainActivity a = act();
        if (a == null) return fail("no activity");
        a.runOnUiThread(new Runnable() {
            @Override public void run() { a.moveTaskToBack(true); }
        });
        return ok();
    }

    @JavascriptInterface public String log(String msg) {
        android.util.Log.i("SevaSagar", msg);
        return ok();
    }
}
