package com.satlok.seva;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/** Notification channels, rich notifications and exact daily seva reminders. */
public final class Notify {

    public static final String CH_SEVA = "seva";
    public static final String CH_UPDATE = "updates";
    public static final String CH_BANDARA = "bhandara";

    private final Context ctx;
    private final NotificationManager nm;
    private final SharedPreferences prefs;

    public Notify(Context c) {
        ctx = c.getApplicationContext();
        nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        prefs = ctx.getSharedPreferences("seva_reminders", Context.MODE_PRIVATE);
        createChannels();
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        mk(CH_SEVA, ctx.getString(R.string.ch_seva_name), ctx.getString(R.string.ch_seva_desc),
                NotificationManager.IMPORTANCE_DEFAULT, true);
        mk(CH_UPDATE, ctx.getString(R.string.ch_update_name), ctx.getString(R.string.ch_update_desc),
                NotificationManager.IMPORTANCE_LOW, false);
        mk(CH_BANDARA, ctx.getString(R.string.ch_bhandara_name), ctx.getString(R.string.ch_bhandara_desc),
                NotificationManager.IMPORTANCE_HIGH, true);
    }

    private void mk(String id, String name, String desc, int imp, boolean vibrate) {
        NotificationChannel ch = new NotificationChannel(id, name, imp);
        ch.setDescription(desc);
        ch.enableLights(true);
        ch.setLightColor(Color.parseColor("#22C55E"));
        ch.enableVibration(vibrate);
        nm.createNotificationChannel(ch);
    }

    public static int flags() {
        return PendingIntent.FLAG_UPDATE_CURRENT |
                (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
    }

    public static PendingIntent open(Context c, String route, int code) {
        Intent i = new Intent(c, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.setData(Uri.parse("sevasagar://open/" + (route == null ? "home" : route)));
        i.putExtra("route", route == null ? "home" : route);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, code, i, flags());
    }

    /**
     * json: {id,title,body,channel,big,route,progress,ongoing,silent,
     *        actions:[{id,title,route}]}
     */
    public int show(JSONObject o) {
        int id = o.optInt("id", (int) (System.currentTimeMillis() % 100000));
        String channel = o.optString("channel", CH_SEVA);
        String title = o.optString("title", ctx.getString(R.string.app_name));
        String body = o.optString("body", "");
        String big = o.optString("big", body);
        int progress = o.optInt("progress", -1);
        boolean ongoing = o.optBoolean("ongoing", false);
        boolean silent = o.optBoolean("silent", false);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(ctx, channel)
                : new Notification.Builder(ctx);
        b.setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.drawable.ic_stat_seva)
                .setColor(Color.parseColor("#16A34A"))
                .setAutoCancel(!ongoing)
                .setOngoing(ongoing)
                .setContentIntent(open(ctx, o.optString("route", "home"), id));
        if (big != null && !big.isEmpty() && !big.equals(body)) {
            b.setStyle(new Notification.BigTextStyle().bigText(big));
        }
        if (progress >= 0) {
            b.setProgress(100, progress, progress == 0);
            b.setOngoing(true);
        }
        if (Build.VERSION.SDK_INT >= 26) {
            b.setShowWhen(true);
        }
        if (silent && Build.VERSION.SDK_INT >= 26) {
            // low channel already silent; nothing else needed
        }
        JSONArray actions = o.optJSONArray("actions");
        if (actions != null) {
            for (int i = 0; i < actions.length() && i < 3; i++) {
                JSONObject a = actions.optJSONObject(i);
                if (a == null) continue;
                Intent ai = new Intent(ctx, ActionReceiver.class);
                ai.setAction("com.satlok.seva.ACTION");
                ai.putExtra("action", a.optString("id"));
                ai.putExtra("route", a.optString("route", ""));
                ai.putExtra("nid", id);
                PendingIntent pi = PendingIntent.getBroadcast(ctx, id * 10 + i, ai, flags());
                if (Build.VERSION.SDK_INT >= 23) {
                    b.addAction(new Notification.Action.Builder(
                            R.drawable.ic_stat_seva, a.optString("title", "Open"), pi).build());
                } else {
                    b.addAction(R.drawable.ic_stat_seva, a.optString("title", "Open"), pi);
                }
            }
        }
        try {
            nm.notify(id, b.build());
        } catch (SecurityException ignored) { }
        return id;
    }

    public void cancel(int id) { nm.cancel(id); }
    public void cancelAll() { nm.cancelAll(); }

    public boolean enabled() {
        if (Build.VERSION.SDK_INT >= 24) return nm.areNotificationsEnabled();
        return true;
    }

    public JSONObject channelState() throws Exception {
        JSONObject o = new JSONObject();
        o.put("enabled", enabled());
        if (Build.VERSION.SDK_INT >= 26) {
            JSONObject chs = new JSONObject();
            String[] ids = {CH_SEVA, CH_UPDATE, CH_BANDARA};
            for (String id : ids) {
                NotificationChannel c = nm.getNotificationChannel(id);
                chs.put(id, c == null ? -1 : c.getImportance());
            }
            o.put("channels", chs);
        }
        return o;
    }

    // ------------------------------------------------------------ reminders
    public JSONArray reminders() throws Exception {
        return new JSONArray(prefs.getString("list", "[]"));
    }

    public void saveReminders(JSONArray arr) {
        prefs.edit().putString("list", arr.toString()).apply();
    }

    public void scheduleAll() throws Exception {
        JSONArray arr = reminders();
        for (int i = 0; i < arr.length(); i++) schedule(arr.getJSONObject(i));
    }

    public void cancel(String id) throws Exception {
        JSONArray arr = reminders();
        JSONArray keep = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject r = arr.getJSONObject(i);
            if (id.equals(r.optString("id"))) {
                alarm().cancel(pi(r.optString("id"), r));
            } else keep.put(r);
        }
        saveReminders(keep);
    }

    public void upsert(JSONObject r) throws Exception {
        String id = r.optString("id");
        JSONArray arr = reminders();
        JSONArray out = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject x = arr.getJSONObject(i);
            if (!id.equals(x.optString("id"))) out.put(x);
        }
        out.put(r);
        saveReminders(out);
        schedule(r);
    }

    private AlarmManager alarm() { return (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE); }

    private PendingIntent pi(String id, JSONObject r) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        i.setAction("com.satlok.seva.REMIND");
        i.putExtra("id", id);
        i.putExtra("title", r.optString("title", "Seva reminder"));
        i.putExtra("body", r.optString("body", ""));
        i.putExtra("route", r.optString("route", "seva"));
        i.putExtra("channel", r.optString("channel", CH_SEVA));
        return PendingIntent.getBroadcast(ctx, id.hashCode(), i, flags());
    }

    public void schedule(JSONObject r) {
        int hour = r.optInt("hour", 6);
        int minute = r.optInt("minute", 0);
        JSONArray days = r.optJSONArray("days");
        long now = System.currentTimeMillis();
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, minute);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= now + 1000) c.add(Calendar.DAY_OF_YEAR, 1);
        if (days != null && days.length() > 0 && days.length() < 7) {
            for (int step = 0; step < 8; step++) {
                int dow = c.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun
                boolean hit = false;
                for (int i = 0; i < days.length(); i++) if (days.optInt(i) == dow) hit = true;
                if (hit) break;
                c.add(Calendar.DAY_OF_YEAR, 1);
            }
        }
        long at = c.getTimeInMillis();
        PendingIntent p = pi(r.optString("id"), r);
        AlarmManager am = alarm();
        try {
            boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
        } catch (SecurityException se) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p);
        }
    }

    public void openSettings(String what) {
        Intent i;
        if ("notifications".equals(what) && Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
        } else if ("install".equals(what) && Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + ctx.getPackageName()));
        } else if ("battery".equals(what) && Build.VERSION.SDK_INT >= 23) {
            i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } else if ("alarm".equals(what) && Build.VERSION.SDK_INT >= 31) {
            i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + ctx.getPackageName()));
        } else if ("files".equals(what) && Build.VERSION.SDK_INT >= 30) {
            i = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:" + ctx.getPackageName()));
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:" + ctx.getPackageName()));
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { ctx.startActivity(i); } catch (Exception ignored) { }
    }
}
