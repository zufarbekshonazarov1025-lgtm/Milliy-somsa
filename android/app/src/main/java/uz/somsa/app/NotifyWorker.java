package uz.somsa.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

/**
 * Har 15 daqiqada bazadan yangi xabarlarni so'raydi va telefonda ko'rsatadi.
 * Qaysi xabar kimga va qachon kelishi bazadagi notify_feed() funksiyasida hisoblanadi.
 */
public class NotifyWorker extends Worker {
    static final String URL = "https://xxddllenrcflwjjejqvo.supabase.co/rest/v1/rpc/notify_feed";
    static final String KEY = "sb_publishable_GvvlFAzl6FtHsTwMH5Qo7g_Rj6n1_Y5";
    static final String CHANNEL = "somsa";
    static final String PREFS = "notify";
    static final String WORK = "somsa-notify";

    public NotifyWorker(@NonNull Context c, @NonNull WorkerParameters p) { super(c, p); }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Milliy somsa", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Qarz, masalliq, yetkazish va kunlik hisobot");
            c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    /** Kalitni saqlab, davriy tekshiruvni yoqadi va darhol bir marta tekshiradi. */
    static void start(Context c, String key) {
        prefs(c).edit().putString("key", key).apply();
        schedule(c);
        Constraints net = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        WorkManager.getInstance(c).enqueue(new OneTimeWorkRequest.Builder(NotifyWorker.class).setConstraints(net).build());
    }

    static void schedule(Context c) {
        if (prefs(c).getString("key", null) == null) return;
        Constraints net = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(NotifyWorker.class, 15, TimeUnit.MINUTES).setConstraints(net).build();
        WorkManager.getInstance(c).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.KEEP, req);
    }

    static void stop(Context c) {
        prefs(c).edit().remove("key").remove("seen").apply();
        WorkManager.getInstance(c).cancelUniqueWork(WORK);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context c = getApplicationContext();
        String key = prefs(c).getString("key", null);
        if (key == null) return Result.success();
        try {
            HttpURLConnection h = (HttpURLConnection) new URL(URL).openConnection();
            h.setRequestMethod("POST");
            h.setConnectTimeout(15000);
            h.setReadTimeout(20000);
            h.setDoOutput(true);
            h.setRequestProperty("apikey", KEY);
            h.setRequestProperty("Content-Type", "application/json");
            try (OutputStream o = h.getOutputStream()) {
                o.write(new JSONObject().put("dkey", key).toString().getBytes(StandardCharsets.UTF_8));
            }
            int code = h.getResponseCode();
            if (code != 200) return Result.retry();
            String body;
            try (InputStream in = h.getInputStream(); ByteArrayOutputStream b = new ByteArrayOutputStream()) {
                byte[] buf = new byte[4096]; int n;
                while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
                body = b.toString("UTF-8").trim();
            }
            if (body.isEmpty() || body.equals("null")) { stop(c); return Result.success(); } // kalit o'chirilgan
            JSONArray arr = new JSONArray(body);
            Set<String> seen = new HashSet<>(prefs(c).getStringSet("seen", new HashSet<>()));
            createChannel(c);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject x = arr.getJSONObject(i);
                String k = x.optString("k");
                if (k.isEmpty() || seen.contains(k)) continue;
                show(c, k, x.optString("t"), x.optString("b"));
                seen.add(k);
            }
            prefs(c).edit().putStringSet("seen", prune(seen)).apply();
            return Result.success();
        } catch (Exception e) {
            return Result.retry();
        }
    }

    /** Faqat oxirgi 3 kunning xabar kalitlarini saqlab qolamiz. */
    private static Set<String> prune(Set<String> seen) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("Asia/Tashkent"));
        long now = System.currentTimeMillis();
        Set<String> days = new HashSet<>();
        for (int i = 0; i < 3; i++) days.add(f.format(new Date(now - i * 86400000L)));
        Set<String> keep = new HashSet<>();
        for (String s : seen) for (String d : days) if (s.contains(d)) { keep.add(s); break; }
        return keep;
    }

    private static void show(Context c, String k, String title, String text) {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder nb = new NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setColor(Color.parseColor("#FFA22A"))
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(pi)
            .setAutoCancel(true);
        try { NotificationManagerCompat.from(c).notify(k.hashCode(), nb.build()); } catch (SecurityException ignored) {}
    }
}
