package com.satlok.seva;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

/** Handles notification action buttons (restart / install / open a screen). */
public final class ActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String action = intent.getStringExtra("action");
        String route = intent.getStringExtra("route");
        int nid = intent.getIntExtra("nid", -1);
        try {
            new Notify(context).cancel(nid);
        } catch (Exception ignored) { }

        if ("install".equals(action)) {
            try {
                Updater u = new Updater(context, new Updater.Events() {
                    @Override public void emit(String t, String j) { }
                    @Override public int notification(org.json.JSONObject o) { return 0; }
                    @Override public void cancelNotification(int id) { }
                });
                org.json.JSONObject r = u.installApk();
                if (!r.optBoolean("ok") && r.optBoolean("needSettings")) {
                    new Notify(context).openSettings("install");
                }
                return;
            } catch (Exception ignored) { }
        }
        Intent i = new Intent(context, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.setData(Uri.parse("sevasagar://open/" + (route == null || route.isEmpty() ? "update" : route)));
        i.putExtra("route", route == null || route.isEmpty() ? "update" : route);
        if ("restart".equals(action)) i.putExtra("restart", true);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        context.startActivity(i);
    }
}
