package com.satlok.seva;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

/** Fires a daily seva reminder, shows the notification, then re-arms the next occurrence. */
public final class ReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        try {
            Notify n = new Notify(context);
            String id = intent.getStringExtra("id");
            n.show(new JSONObject()
                    .put("id", id == null ? 1 : Math.abs(id.hashCode()) % 100000)
                    .put("channel", intent.getStringExtra("channel") == null
                            ? Notify.CH_SEVA : intent.getStringExtra("channel"))
                    .put("title", intent.getStringExtra("title"))
                    .put("body", intent.getStringExtra("body"))
                    .put("route", intent.getStringExtra("route")));
            // re-arm repeating reminders; one-shot event reminders retire themselves
            org.json.JSONArray arr = n.reminders();
            org.json.JSONArray keep = new org.json.JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject r = arr.getJSONObject(i);
                if (id != null && id.equals(r.optString("id"))) {
                    if (r.optBoolean("once", false)) continue;
                    n.schedule(r);
                }
                keep.put(r);
            }
            if (keep.length() != arr.length()) n.saveReminders(keep);
        } catch (Exception ignored) { }
    }
}
