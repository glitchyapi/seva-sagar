package com.satlok.seva;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Native shell: a hardened WebView that serves the (hot-updatable) web bundle from a
 * private origin, plus the bridge that gives it storage, crypto, notifications and OTA.
 */
public final class MainActivity extends Activity implements Updater.Events {

    public static final String HOST = "app.sevasagar.local";
    public static final String ORIGIN = "https://" + HOST;
    public static final int REQ_PICK = 4101;
    public static final int REQ_SAVE = 4102;
    public static final int REQ_PERMS = 4103;

    WebView web;
    Vault vault;
    Notify notify;
    Updater updater;
    Bridge bridge;

    Intent pickIntent;
    String pickId = "pick";
    String pickEncoding = "text";
    JSONObject pendingSave;
    private String pendingRoute = "home";
    private boolean pageReady;
    private String[] lastPermRequest;

    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        vault = new Vault(this);
        notify = new Notify(this);
        updater = new Updater(this, this);
        bridge = new Bridge(this, vault, notify, updater);

        edgeToEdge();

        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setGeolocationEnabled(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " SevaSagarApp/1.0");
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(bridge, "SevaNative");
        WebView.setWebContentsDebuggingEnabled(
                "1".equals(getSharedPreferences("seva_prefs", MODE_PRIVATE).getString("debug_webview", "0")));

        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                String scheme = u.getScheme();
                if ("sevasagar".equals(scheme)) { route(u.getLastPathSegment()); return true; }
                if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)
                        || "tel".equals(scheme)) {
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, u);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                    } catch (Exception ignored) { }
                    return true;
                }
                return true;
            }

            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                return serve(req.getUrl());
            }

            @Override public void onPageFinished(WebView v, String url) {
                pageReady = true;
                getWindow().setBackgroundDrawableResource(android.R.color.transparent);
                if (pendingRoute != null && !pendingRoute.isEmpty()) {
                    route(pendingRoute);
                    pendingRoute = null;
                }
            }
        });

        // real system-bar insets -> CSS variables (edge-to-edge on every API)
        final View content = findViewById(android.R.id.content);
        content.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public android.view.WindowInsets onApplyWindowInsets(View v, android.view.WindowInsets insets) {
                try {
                    float d = getResources().getDisplayMetrics().density;
                    int top, bottom, left, right;
                    if (Build.VERSION.SDK_INT >= 30) {
                        android.graphics.Insets i = insets.getInsets(
                                android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                        top = i.top; bottom = i.bottom; left = i.left; right = i.right;
                    } else {
                        top = insets.getSystemWindowInsetTop(); bottom = insets.getSystemWindowInsetBottom();
                        left = insets.getSystemWindowInsetLeft(); right = insets.getSystemWindowInsetRight();
                    }
                    emit("insets", new JSONObject()
                            .put("top", Math.round(top / d)).put("bottom", Math.round(bottom / d))
                            .put("left", Math.round(left / d)).put("right", Math.round(right / d)).toString());
                } catch (Exception ignored) { }
                return insets;
            }
        });

        handleIntent(getIntent());
        web.loadUrl(ORIGIN + "/index.html");
        try { notify.scheduleAll(); } catch (Exception ignored) { }
    }

    // ------------------------------------------------------------- serving
    private WebResourceResponse serve(Uri u) {
        if (!HOST.equals(u.getHost())) return null;
        String path = u.getPath();
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        if (path.contains("..")) return notFound();
        String rel = path.startsWith("/") ? path.substring(1) : path;
        byte[] data = null;
        File dir = updater.activeDir();
        if (dir != null) {
            File f = new File(dir, rel);
            if (f.isFile()) {
                try { data = Vault.read(f); } catch (Exception ignored) { }
            }
        }
        if (data == null) {
            try {
                InputStream is = getAssets().open("web/" + rel);
                data = Net.readAll(is);
                is.close();
            } catch (Exception ignored) { }
        }
        if (data == null) return notFound();
        Map<String, String> h = new HashMap<String, String>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Cache-Control", "no-cache");
        return new WebResourceResponse(mime(rel), "utf-8", 200, "OK", h, new ByteArrayInputStream(data));
    }

    private WebResourceResponse notFound() {
        Map<String, String> h = new HashMap<String, String>();
        h.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", h,
                new ByteArrayInputStream("not found".getBytes()));
    }

    private static String mime(String p) {
        String n = p.toLowerCase();
        if (n.endsWith(".html")) return "text/html";
        if (n.endsWith(".js") || n.endsWith(".mjs")) return "application/javascript";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".json") || n.endsWith(".webmanifest")) return "application/json";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".gif")) return "image/gif";
        if (n.endsWith(".woff2")) return "font/woff2";
        if (n.endsWith(".woff")) return "font/woff";
        if (n.endsWith(".ttf")) return "font/ttf";
        if (n.endsWith(".ico")) return "image/x-icon";
        if (n.endsWith(".txt")) return "text/plain";
        if (n.endsWith(".wasm")) return "application/wasm";
        return "application/octet-stream";
    }

    // -------------------------------------------------------------- events
    @Override public void emit(final String type, final String json) {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                if (web == null) return;
                String js = "window.SevaEvents&&window.SevaEvents.emit(" + JSONObject.quote(type)
                        + "," + JSONObject.quote(json) + ")";
                web.evaluateJavascript(js, null);
            }
        });
    }

    @Override public int notification(JSONObject o) { return notify.show(o); }
    @Override public void cancelNotification(int id) { notify.cancel(id); }

    public void route(final String r) {
        if (r == null || r.isEmpty()) return;
        if (!pageReady) { pendingRoute = r; return; }
        web.evaluateJavascript("window.__sevaRoute&&window.__sevaRoute(" + JSONObject.quote(r) + ")", null);
    }

    private void handleIntent(Intent i) {
        if (i == null) return;
        String r = i.getStringExtra("route");
        if (r == null && i.getData() != null) r = i.getData().getLastPathSegment();
        if (r != null) pendingRoute = r;
        if (i.getBooleanExtra("restart", false)) pendingRoute = "home";
    }

    @Override protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        handleIntent(i);
        if (i.getBooleanExtra("restart", false)) { reloadApp(true); return; }
        if (pendingRoute != null) { route(pendingRoute); pendingRoute = null; }
    }

    public void reloadApp(boolean hard) {
        pageReady = false;
        if (hard) {
            web.clearCache(false);
            web.loadUrl(ORIGIN + "/index.html?v=" + System.currentTimeMillis());
        } else {
            web.reload();
        }
    }

    // ------------------------------------------------------------ system ui
    private void edgeToEdge() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            View d = getWindow().getDecorView();
            d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    public void applyBars(String json) {
        try {
            JSONObject o = new JSONObject(json);
            boolean light = o.optBoolean("lightContent", false); // true => light icons (dark bg)
            String status = o.optString("statusColor", null);
            String nav = o.optString("navColor", null);
            if (status != null && !"null".equals(status)) getWindow().setStatusBarColor(parse(status));
            if (nav != null && !"null".equals(nav)) getWindow().setNavigationBarColor(parse(nav));
            if (Build.VERSION.SDK_INT >= 30) {
                android.view.WindowInsetsController c = getWindow().getInsetsController();
                if (c != null) {
                    int mask = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                            | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    c.setSystemBarsAppearance(light ? 0 : mask, mask);
                }
            } else if (Build.VERSION.SDK_INT >= 26) {
                View d = getWindow().getDecorView();
                int flags = d.getSystemUiVisibility();
                if (light) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= 27) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= 27) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                d.setSystemUiVisibility(flags);
            }
        } catch (Exception ignored) { }
    }

    private static int parse(String c) {
        try { return Color.parseColor(c); } catch (Exception e) { return Color.TRANSPARENT; }
    }

    public void haptic(String kind) {
        try {
            View v = web;
            if ("light".equals(kind)) { v.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); return; }
            if ("success".equals(kind) || "error".equals(kind) || "heavy".equals(kind)) {
                Vibrator vib = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (vib == null || !vib.hasVibrator()) return;
                long ms = "heavy".equals(kind) ? 40 : 18;
                if (Build.VERSION.SDK_INT >= 26) {
                    vib.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                    if ("success".equals(kind)) {
                        vib.vibrate(VibrationEffect.createWaveform(new long[]{0, 14, 70, 20}, -1));
                    }
                } else vib.vibrate(ms);
                return;
            }
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
        } catch (Exception ignored) { }
    }

    // ------------------------------------------------------------ lifecycle
    @Override protected void onResume() {
        super.onResume();
        web.onResume();
        emit("resume", "{}");
    }

    @Override protected void onPause() {
        web.onPause();
        emit("pause", "{}");
        super.onPause();
    }

    @Override public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        boolean dark = (newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        try { emit("theme", new JSONObject().put("dark", dark).toString()); } catch (Exception ignored) { }
    }

    @Override public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("!!(window.__sevaBack&&window.__sevaBack())", new ValueCallback<String>() {
            @Override public void onReceiveValue(String value) {
                if (!"true".equals(value)) moveTaskToBack(true);
            }
        });
    }

    @Override protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    // ---------------------------------------------------------- permissions
    public void requestPerms(String[] perms) {
        lastPermRequest = perms;
        if (Build.VERSION.SDK_INT >= 23) requestPermissions(perms, REQ_PERMS);
    }

    @Override public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code != REQ_PERMS) return;
        try {
            JSONObject o = new JSONObject();
            JSONObject map = new JSONObject();
            for (int i = 0; i < perms.length; i++)
                map.put(perms[i], results[i] == PackageManager.PERMISSION_GRANTED);
            o.put("permissions", map);
            emit("permission", o.toString());
        } catch (Exception ignored) { }
    }

    // -------------------------------------------------------- activity data
    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        try {
            if (req == REQ_PICK) {
                JSONObject o = new JSONObject();
                o.put("id", pickId);
                if (res != RESULT_OK || data == null || data.getData() == null) {
                    o.put("ok", false); o.put("error", "cancelled");
                } else {
                    Uri uri = data.getData();
                    InputStream is = getContentResolver().openInputStream(uri);
                    byte[] bytes = Net.readAll(is);
                    is.close();
                    o.put("ok", true);
                    o.put("name", uri.getLastPathSegment());
                    o.put("bytes", bytes.length);
                    if ("base64".equals(pickEncoding)) o.put("base64", Net.b64(bytes));
                    else o.put("text", new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
                }
                emit("file", o.toString());
            } else if (req == REQ_SAVE) {
                JSONObject o = new JSONObject();
                o.put("id", pendingSave == null ? "save" : pendingSave.optString("id", "save"));
                if (res != RESULT_OK || data == null || data.getData() == null) {
                    o.put("ok", false); o.put("error", "cancelled");
                } else {
                    byte[] bytes = pendingSave.has("base64")
                            ? Net.unb64(pendingSave.getString("base64"))
                            : pendingSave.optString("text", "").getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    java.io.OutputStream os = getContentResolver().openOutputStream(data.getData());
                    os.write(bytes); os.flush(); os.close();
                    o.put("ok", true); o.put("bytes", bytes.length);
                    o.put("uri", data.getData().toString());
                }
                pendingSave = null;
                emit("saved", o.toString());
            }
        } catch (Exception e) {
            try { emit("file", new JSONObject().put("ok", false)
                    .put("error", String.valueOf(e.getMessage())).toString()); } catch (Exception ignored) { }
        }
    }
}
