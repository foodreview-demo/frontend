package com.matjalal.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "onCreate called");
        createNotificationChannel();
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "onNewIntent called");
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) {
            Log.d(TAG, "Intent is null");
            return;
        }

        Log.d(TAG, "Intent action: " + intent.getAction());
        Log.d(TAG, "Intent data: " + intent.getDataString());
        
        Bundle extras = intent.getExtras();
        if (extras != null) {
            Log.d(TAG, "Intent extras:");
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                Log.d(TAG, "  " + key + " = " + (value != null ? value.toString() : "null"));
            }
        } else {
            Log.d(TAG, "No extras in intent");
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "default",
                "기본 알림",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("맛잘알 푸시 알림");
            channel.enableVibration(true);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel created");
            }
        }
    }
}
