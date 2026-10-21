package com.satlok.seva;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

/**
 * Content-addressed OTA engine.
 *
 * The app ships a baseline web bundle in assets/web plus a manifest of sha256 hashes.
 * A remote manifest lists the same paths with new hashes; only files whose hash changed
 * are downloaded. Files are staged, verified, then the active pointer is flipped in one
 * atomic step, so an interrupted update can never leave a half-patched app. The previous
 * version is kept for one-tap rollback. Native shell upgrades are delivered as a signed
 * APK which is hash-verified before the system installer is invoked.
 */
public final class Updater {

    public interface Events {
        void emit(String type, String json);
        int notification(JSONObject o);
        void cancelNotification(int id);
    }

    public static final int NID_UPDATE = 4700;
    public static final int NID_DOWNLOAD = 4701;

    private final Context ctx;
    private final Events ev;
    private final SharedPreferences sp;
    private final File webRoot;
    private volatile boolean busy;
    private volatile boolean cancelFlag;

    public Updater(Context c, Events e) {
        ctx = c.getApplicationContext();
        ev = e;
        sp = ctx.getSharedPreferences("seva_web", Context.MODE_PRIVATE);
        webRoot = new File(ctx.getFilesDir(), "web");
        if (!webRoot.exists()) webRoot.mkdirs();
    }

    // ------------------------------------------------------------ locations
    public int baseVersion() {
        try {
            JSONObject o = new JSONObject(readAsset("web/version.json"));
            return o.optInt("web", 1);
        } catch (Exception e) { return 1; }
    }

    public int activeVersion() { return sp.getInt("active", baseVersion()); }
    public int prevVersion() { return sp.getInt("prev", -1); }

    /** Directory the WebView serves from; null means "serve from assets". */
    public File activeDir() {
        int v = activeVersion();
        File d = new File(webRoot, "v" + v);
        return (v > baseVersion() && d.exists()) ? d : null;
    }

    public JSONObject state() throws Exception {
        JSONObject o = new JSONObject();
        o.put("active", activeVersion());
        o.put("base", baseVersion());
        o.put("prev", prevVersion());
        o.put("dir", activeDir() == null ? "assets" : activeDir().getAbsolutePath());
        JSONArray vers = new JSONArray();
        File[] fs = webRoot.listFiles();
        long bytes = 0;
        if (fs != null) for (File f : fs) {
            if (!f.isDirectory()) continue;
            JSONObject v = new JSONObject();
            v.put("name", f.getName());
            long sz = dirSize(f);
            bytes += sz;
            v.put("bytes", sz);
            vers.put(v);
        }
        o.put("versions", vers);
        o.put("bytes", bytes);
        o.put("busy", busy);
        return o;
    }

    // ------------------------------------------------------------ manifest
    public JSONObject fetchManifest(JSONArray urls, int timeout) throws Exception {
        Net.Result r = Net.requestMirrors(urls, "GET", null, null, timeout);
        JSONObject o = new JSONObject();
        o.put("ok", r.ok);
        o.put("status", r.status);
        o.put("url", r.url);
        o.put("ms", r.ms);
        if (r.ok) {
            String txt = new String(r.body, java.nio.charset.StandardCharsets.UTF_8);
            o.put("manifest", new JSONObject(txt));
        } else {
            o.put("error", r.error == null ? ("HTTP " + r.status) : r.error);
        }
        return o;
    }

    /** Map<path, sha256> of what is currently installed. */
    private JSONObject currentHashes() throws Exception {
        File d = activeDir();
        String txt = (d == null)
                ? readAsset("web/manifest.json")
                : new String(Vault.read(new File(d, "manifest.json")), java.nio.charset.StandardCharsets.UTF_8);
        JSONObject m = new JSONObject(txt);
        JSONObject out = new JSONObject();
        JSONArray files = m.optJSONArray("files");
        if (files != null) for (int i = 0; i < files.length(); i++) {
            JSONObject f = files.getJSONObject(i);
            out.put(f.getString("path"), f.getString("sha256"));
        }
        return out;
    }

    /** Compute the minimal download set for a target manifest. */
    public JSONObject plan(JSONObject manifest) throws Exception {
        JSONObject web = manifest.getJSONObject("web");
        int target = web.getInt("version");
        JSONObject cur = currentHashes();
        JSONArray files = web.getJSONArray("files");
        JSONArray changed = new JSONArray();
        JSONArray all = new JSONArray();
        long bytes = 0;
        int same = 0;
        Set<String> keep = new HashSet<String>();
        String base = web.optString("base", "");
        for (int i = 0; i < files.length(); i++) {
            JSONObject f = files.getJSONObject(i);
            String path = f.getString("path");
            String sha = f.getString("sha256");
            keep.add(path);
            all.put(f);
            String have = cur.optString(path, "");
            if (sha.equals(have)) { same++; continue; }
            JSONObject c = new JSONObject(f.toString());
            JSONArray mirrors = new JSONArray();
            String url = f.optString("url", "");
            if (url.startsWith("http")) mirrors.put(url);
            else if (!url.isEmpty()) mirrors.put(joinUrl(base, url));
            JSONArray extra = f.optJSONArray("mirrors");
            if (extra != null) for (int j = 0; j < extra.length(); j++) mirrors.put(extra.getString(j));
            c.put("mirrors", mirrors);
            bytes += f.optLong("size", 0);
            changed.put(c);
        }
        JSONArray deleted = new JSONArray();
        Iterator<String> it = cur.keys();
        while (it.hasNext()) { String p = it.next(); if (!keep.contains(p)) deleted.put(p); }
        JSONArray explicitDeleted = web.optJSONArray("deleted");
        if (explicitDeleted != null) for (int i = 0; i < explicitDeleted.length(); i++) {
            String p = explicitDeleted.getString(i);
            boolean present = false;
            for (int j = 0; j < deleted.length(); j++) if (deleted.getString(j).equals(p)) present = true;
            if (!present) deleted.put(p);
        }

        JSONObject o = new JSONObject();
        o.put("target", target);
        o.put("current", activeVersion());
        o.put("changed", changed);
        o.put("deleted", deleted);
        o.put("all", all);
        o.put("bytes", bytes);
        o.put("unchanged", same);
        o.put("total", files.length());
        o.put("upToDate", target <= activeVersion() && changed.length() == 0);
        return o;
    }

    public void cancel() { cancelFlag = true; }
    public boolean isBusy() { return busy; }

    /** Download only changed files, verify, stage, then atomically activate. */
    public void apply(final JSONObject plan, final JSONObject manifest, final boolean notify) {
        if (busy) return;
        busy = true;
        cancelFlag = false;
        new Thread(new Runnable() {
            @Override public void run() {
                int target = plan.optInt("target");
                File stage = new File(webRoot, ".stage-v" + target);
                try {
                    deleteRec(stage);
                    if (!stage.mkdirs()) throw new IllegalStateException("stage mkdir failed");
                    JSONArray changed = plan.getJSONArray("changed");
                    JSONArray all = plan.getJSONArray("all");
                    long totalBytes = plan.optLong("bytes", 0);
                    long doneBytes = 0;
                    int n = changed.length();

                    emit("patch_start", new JSONObject()
                            .put("target", target).put("files", n).put("bytes", totalBytes).toString());

                    // 1. copy unchanged files from the running version (zero network)
                    File from = activeDir();
                    for (int i = 0; i < all.length(); i++) {
                        JSONObject f = all.getJSONObject(i);
                        String path = f.getString("path");
                        boolean isChanged = false;
                        for (int j = 0; j < changed.length(); j++)
                            if (changed.getJSONObject(j).getString("path").equals(path)) isChanged = true;
                        if (isChanged) continue;
                        byte[] data = readInstalled(path, from);
                        if (data == null) throw new IllegalStateException("missing local file " + path);
                        writeFile(new File(stage, path), data);
                    }

                    // 2. fetch only what changed
                    for (int i = 0; i < n; i++) {
                        if (cancelFlag) throw new InterruptedException("cancelled");
                        JSONObject f = changed.getJSONObject(i);
                        String path = f.getString("path");
                        String sha = f.getString("sha256");
                        File tmp = new File(ctx.getCacheDir(), "patch_" + Net.sha256(path.getBytes()).substring(0, 16));
                        String got = null;
                        JSONArray mirrors = f.getJSONArray("mirrors");
                        Exception last = null;
                        for (int m = 0; m < mirrors.length(); m++) {
                            try {
                                final long baseDone = doneBytes;
                                final int idx = i;
                                got = Net.download(mirrors.getString(m), tmp, 30000, new Net.Progress() {
                                    @Override public void onProgress(long d, long t) {
                                        try {
                                            JSONObject p = new JSONObject()
                                                    .put("target", target)
                                                    .put("index", idx).put("files", n)
                                                    .put("path", (String) null)
                                                    .put("bytes", baseDone + d)
                                                    .put("total", totalBytes);
                                            emit("patch_progress", p.toString());
                                        } catch (Exception ignored) { }
                                    }
                                });
                                if (sha.equalsIgnoreCase(got)) { last = null; break; }
                                last = new IllegalStateException("hash mismatch " + path);
                            } catch (Exception e) { last = e; }
                        }
                        if (last != null) throw last;
                        if (!sha.equalsIgnoreCase(got)) throw new IllegalStateException("hash mismatch " + path);
                        byte[] data = Vault.read(tmp);
                        writeFile(new File(stage, path), data);
                        tmp.delete();
                        doneBytes += data.length;
                        JSONObject p = new JSONObject()
                                .put("target", target).put("index", i + 1).put("files", n)
                                .put("path", path).put("bytes", doneBytes).put("total", totalBytes);
                        emit("patch_file", p.toString());
                        if (notify) {
                            ev.notification(new JSONObject()
                                    .put("id", NID_DOWNLOAD).put("channel", Notify.CH_UPDATE)
                                    .put("title", "Updating Seva Sagar")
                                    .put("body", (i + 1) + " / " + n + " files")
                                    .put("progress", (int) ((i + 1) * 100L / Math.max(1, n)))
                                    .put("ongoing", true).put("silent", true).put("route", "update"));
                        }
                    }

                    // 3. write the new manifest + version marker, then flip the pointer
                    JSONObject newManifest = new JSONObject();
                    newManifest.put("version", target);
                    newManifest.put("files", all);
                    newManifest.put("installedAt", System.currentTimeMillis());
                    writeFile(new File(stage, "manifest.json"),
                            newManifest.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    writeFile(new File(stage, "version.json"),
                            new JSONObject().put("web", target).toString()
                                    .getBytes(java.nio.charset.StandardCharsets.UTF_8));

                    File finalDir = new File(webRoot, "v" + target);
                    deleteRec(finalDir);
                    if (!stage.renameTo(finalDir)) throw new IllegalStateException("activate failed");

                    int old = activeVersion();
                    sp.edit().putInt("prev", old).putInt("active", target)
                            .putString("notes", manifest.optJSONObject("latest") == null ? "" :
                                    manifest.optJSONObject("latest").toString())
                            .apply();
                    prune(target, old);
                    ev.cancelNotification(NID_DOWNLOAD);
                    busy = false;
                    emit("patch_done", new JSONObject()
                            .put("target", target).put("from", old)
                            .put("files", n).put("bytes", doneBytes).toString());
                    if (notify) {
                        ev.notification(new JSONObject()
                                .put("id", NID_UPDATE).put("channel", Notify.CH_UPDATE)
                                .put("title", "Seva Sagar updated")
                                .put("body", "Version " + target + " installed — tap to restart")
                                .put("route", "update")
                                .put("actions", new JSONArray()
                                        .put(new JSONObject().put("id", "restart").put("title", "Restart"))));
                    }
                } catch (Exception e) {
                    busy = false;
                    deleteRec(stage);
                    ev.cancelNotification(NID_DOWNLOAD);
                    try {
                        emit("patch_error", new JSONObject()
                                .put("target", target)
                                .put("error", String.valueOf(e.getMessage())).toString());
                    } catch (Exception ignored) { }
                }
            }
        }, "seva-patch").start();
    }

    public boolean rollback() {
        int prev = prevVersion();
        if (prev < 0) return false;
        File d = new File(webRoot, "v" + prev);
        if (prev > baseVersion() && !d.exists()) return false;
        int cur = activeVersion();
        sp.edit().putInt("active", prev).putInt("prev", cur).apply();
        return true;
    }

    public void resetToBase() {
        int cur = activeVersion();
        sp.edit().putInt("active", baseVersion()).putInt("prev", cur).apply();
    }

    private void prune(int keep, int prev) {
        File[] fs = webRoot.listFiles();
        if (fs == null) return;
        for (File f : fs) {
            if (!f.isDirectory()) continue;
            String n = f.getName();
            if (n.equals("v" + keep) || n.equals("v" + prev)) continue;
            if (n.startsWith(".stage-") || n.startsWith("v")) deleteRec(f);
        }
    }

    // ------------------------------------------------------------ APK
    public JSONObject apkState() throws Exception {
        JSONObject o = new JSONObject();
        o.put("canInstall", canInstall());
        File f = apkFile();
        o.put("downloaded", f.exists());
        o.put("path", f.getAbsolutePath());
        o.put("bytes", f.exists() ? f.length() : 0);
        return o;
    }

    public File apkFile() { return new File(ctx.getCacheDir(), "sevasagar-update.apk"); }

    public boolean canInstall() {
        if (Build.VERSION.SDK_INT >= 26)
            return ctx.getPackageManager().canRequestPackageInstalls();
        return true;
    }

    public void downloadApk(final JSONArray urls, final String sha256, final String versionName,
                            final boolean notify) {
        if (busy) return;
        busy = true;
        cancelFlag = false;
        new Thread(new Runnable() {
            @Override public void run() {
                File out = apkFile();
                try {
                    emit("apk_start", new JSONObject().put("version", versionName).toString());
                    String got = null;
                    Exception last = null;
                    for (int i = 0; i < urls.length(); i++) {
                        try {
                            got = Net.download(urls.getString(i), out, 60000, new Net.Progress() {
                                @Override public void onProgress(long d, long t) {
                                    try {
                                        int pct = t > 0 ? (int) (d * 100 / t) : 0;
                                        emit("apk_progress", new JSONObject()
                                                .put("bytes", d).put("total", t).put("percent", pct).toString());
                                        if (notify && t > 0) {
                                            ev.notification(new JSONObject()
                                                    .put("id", NID_DOWNLOAD).put("channel", Notify.CH_UPDATE)
                                                    .put("title", "Downloading Seva Sagar " + versionName)
                                                    .put("body", pct + "%")
                                                    .put("progress", pct).put("ongoing", true)
                                                    .put("silent", true).put("route", "update"));
                                        }
                                    } catch (Exception ignored) { }
                                }
                            });
                            if (sha256 == null || sha256.isEmpty() || sha256.equalsIgnoreCase(got)) {
                                last = null; break;
                            }
                            last = new IllegalStateException("APK hash mismatch");
                        } catch (Exception e) { last = e; }
                    }
                    if (last != null) throw last;
                    busy = false;
                    ev.cancelNotification(NID_DOWNLOAD);
                    emit("apk_done", new JSONObject()
                            .put("path", out.getAbsolutePath()).put("bytes", out.length())
                            .put("version", versionName).put("sha256", got).toString());
                    if (notify) {
                        ev.notification(new JSONObject()
                                .put("id", NID_UPDATE).put("channel", Notify.CH_UPDATE)
                                .put("title", "Seva Sagar " + versionName + " ready")
                                .put("body", "Tap to install the new version")
                                .put("route", "update")
                                .put("actions", new JSONArray()
                                        .put(new JSONObject().put("id", "install").put("title", "Install"))));
                    }
                } catch (Exception e) {
                    busy = false;
                    ev.cancelNotification(NID_DOWNLOAD);
                    try {
                        emit("apk_error", new JSONObject().put("error", String.valueOf(e.getMessage())).toString());
                    } catch (Exception ignored) { }
                }
            }
        }, "seva-apk").start();
    }

    public JSONObject installApk() throws Exception {
        JSONObject o = new JSONObject();
        File f = apkFile();
        if (!f.exists()) { o.put("ok", false).put("error", "no apk"); return o; }
        if (!canInstall()) {
            o.put("ok", false).put("error", "permission");
            o.put("needSettings", true);
            return o;
        }
        Uri uri = ShareProvider.uriFor(ctx, f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(i);
        o.put("ok", true);
        return o;
    }

    // ------------------------------------------------------------ io helpers
    private byte[] readInstalled(String path, File from) throws Exception {
        if (from != null) {
            File f = new File(from, path);
            if (f.exists()) return Vault.read(f);
        }
        InputStream is = ctx.getAssets().open("web/" + path);
        byte[] b = Net.readAll(is);
        is.close();
        return b;
    }

    private String readAsset(String path) throws Exception {
        InputStream is = ctx.getAssets().open(path);
        byte[] b = Net.readAll(is);
        is.close();
        return new String(b, java.nio.charset.StandardCharsets.UTF_8);
    }

    static void writeFile(File f, byte[] data) throws Exception {
        File p = f.getParentFile();
        if (p != null && !p.exists()) p.mkdirs();
        FileOutputStream fos = new FileOutputStream(f);
        fos.write(data);
        fos.flush();
        fos.getFD().sync();
        fos.close();
    }

    static void deleteRec(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] cs = f.listFiles();
            if (cs != null) for (File c : cs) deleteRec(c);
        }
        f.delete();
    }

    static long dirSize(File f) {
        long n = 0;
        File[] cs = f.listFiles();
        if (cs == null) return f.length();
        for (File c : cs) n += c.isDirectory() ? dirSize(c) : c.length();
        return n;
    }

    static String joinUrl(String base, String path) {
        if (base.isEmpty()) return path;
        if (base.endsWith("/") && path.startsWith("/")) return base + path.substring(1);
        if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
        return base + path;
    }

    private void emit(String type, String json) { ev.emit(type, json); }
}
