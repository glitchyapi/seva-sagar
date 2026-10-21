package com.satlok.seva;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restores reminder alarms after reboot, app upgrade, time or timezone change. */
public final class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        try { new Notify(context).scheduleAll(); } catch (Exception ignored) { }
    }
}
