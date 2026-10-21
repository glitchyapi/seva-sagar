package com.satlok.seva;

import android.util.Base64;
import org.json.JSONObject;
import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;

/** Small, dependency-free HTTP client with mirrors, retries, gzip and streaming progress. */
public final class Net {

    public interface Progress { void onProgress(long done, long total); }

    public static final class Result {
        public boolean ok;
        public int status;
        public byte[] body;
        public String error;
        public long ms;
        public String url;
        public String contentType;
        public Map<String, List<String>> headers;
    }

    private static final String UA = "SevaSagar/1.0 (Android; +https://satlok.app)";

    public static Result request(String urlStr, String method, JSONObject headers,
                                 byte[] payload, int timeoutMs, int retries) {
        long t0 = System.currentTimeMillis();
        Result r = new Result();
        r.url = urlStr;
        Exception last = null;
        for (int attempt = 0; attempt <= retries; attempt++) {
            HttpURLConnection c = null;
            try {
                URL u = new URL(urlStr);
                c = (HttpURLConnection) u.openConnection();
                c.setInstanceFollowRedirects(true);
                c.setConnectTimeout(timeoutMs);
                c.setReadTimeout(timeoutMs);
                c.setRequestMethod(method == null ? "GET" : method);
                c.setRequestProperty("User-Agent", UA);
                c.setRequestProperty("Accept-Encoding", "gzip");
                c.setRequestProperty("Cache-Control", "no-cache");
                if (headers != null) {
                    Iterator<String> it = headers.keys();
                    while (it.hasNext()) {
                        String k = it.next();
                        c.setRequestProperty(k, headers.optString(k));
                    }
                }
                if (payload != null) {
                    c.setDoOutput(true);
                    c.setFixedLengthStreamingMode(payload.length);
                    OutputStream os = c.getOutputStream();
                    os.write(payload);
                    os.flush();
                    os.close();
                }
                r.status = c.getResponseCode();
                r.contentType = c.getContentType();
                r.headers = c.getHeaderFields();
                InputStream is = (r.status >= 400) ? c.getErrorStream() : c.getInputStream();
                if (is == null) is = c.getInputStream();
                String enc = c.getContentEncoding();
                if (enc != null && enc.toLowerCase().contains("gzip")) is = new GZIPInputStream(is);
                r.body = readAll(is);
                r.ok = r.status >= 200 && r.status < 300;
                r.ms = System.currentTimeMillis() - t0;
                if (r.ok || r.status == 404 || r.status == 401 || r.status == 403) return r;
                last = new IOException("HTTP " + r.status);
            } catch (Exception e) {
                last = e;
                r.error = e.getClass().getSimpleName() + ": " + e.getMessage();
            } finally {
                if (c != null) c.disconnect();
            }
            sleep(300L * (attempt + 1));
        }
        r.ok = false;
        r.ms = System.currentTimeMillis() - t0;
        if (r.error == null && last != null) r.error = String.valueOf(last.getMessage());
        return r;
    }

    /** Try each mirror in order until one succeeds. */
    public static Result requestMirrors(JSONArray urls, String method, JSONObject headers,
                                        byte[] payload, int timeoutMs) {
        Result r = new Result();
        for (int i = 0; i < urls.length(); i++) {
            String u = urls.optString(i);
            if (u == null || u.isEmpty()) continue;
            r = request(u, method, headers, payload, timeoutMs, 1);
            if (r.ok) return r;
        }
        if (r.error == null) r.error = "no mirror reachable";
        return r;
    }

    /** Stream a URL to a file, reporting progress; returns sha256 hex of the written bytes. */
    public static String download(String urlStr, File dest, int timeoutMs, Progress p) throws Exception {
        HttpURLConnection c = null;
        try {
            URL u = new URL(urlStr);
            c = (HttpURLConnection) u.openConnection();
            c.setInstanceFollowRedirects(true);
            c.setConnectTimeout(timeoutMs);
            c.setReadTimeout(timeoutMs);
            c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Accept-Encoding", "identity");
            int code = c.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            long total = c.getContentLengthLong();
            File parent = dest.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            InputStream is = c.getInputStream();
            FileOutputStream fos = new FileOutputStream(dest);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] buf = new byte[64 * 1024];
            long done = 0;
            int n;
            long lastTick = 0;
            while ((n = is.read(buf)) > 0) {
                fos.write(buf, 0, n);
                md.update(buf, 0, n);
                done += n;
                long now = System.currentTimeMillis();
                if (p != null && (now - lastTick > 120 || done == total)) {
                    p.onProgress(done, total);
                    lastTick = now;
                }
            }
            fos.flush();
            fos.getFD().sync();
            fos.close();
            is.close();
            if (p != null) p.onProgress(done, total > 0 ? total : done);
            return hex(md.digest());
        } finally {
            if (c != null) c.disconnect();
        }
    }

    public static byte[] readAll(InputStream is) throws IOException {
        if (is == null) return new byte[0];
        ByteArrayOutputStream bos = new ByteArrayOutputStream(8192);
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) > 0) bos.write(buf, 0, n);
        is.close();
        return bos.toByteArray();
    }

    public static String sha256(byte[] data) {
        try {
            return hex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (Exception e) { return ""; }
    }

    public static String sha256File(File f) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            InputStream is = new java.io.FileInputStream(f);
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = is.read(buf)) > 0) md.update(buf, 0, n);
            is.close();
            return hex(md.digest());
        } catch (Exception e) { return ""; }
    }

    public static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder(b.length * 2);
        for (byte v : b) sb.append(Character.forDigit((v >> 4) & 0xF, 16)).append(Character.forDigit(v & 0xF, 16));
        return sb.toString();
    }

    public static String b64(byte[] b) { return Base64.encodeToString(b, Base64.NO_WRAP); }
    public static byte[] unb64(String s) { return Base64.decode(s, Base64.DEFAULT); }

    public static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { }
    }
}
