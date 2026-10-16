package uz.somsa.app;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

/** Somsa qobig'i: dastur ekranlarini internetdan yuklaydi, shuning uchun yangilanish qayta o'rnatishni talab qilmaydi. */
public class MainActivity extends AppCompatActivity {
    private static final String HOME = "https://zufarbekshonazarov1025-lgtm.github.io/Milliy-somsa/";
    private static final String HOST = "zufarbekshonazarov1025-lgtm.github.io";
    private static final String BG = "#F3EFE9";

    private WebView web;
    private LinearLayout offline;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.parseColor("#9A3412"));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor(BG));
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        offline = buildOffline();
        root.addView(offline, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setSupportZoom(false);
        s.setUserAgentString(s.getUserAgentString() + " SomsaApp/1");
        CookieManager.getInstance().setAcceptCookie(true);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Native(), "SomsaNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                openOutside(uri);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) { web.setVisibility(View.INVISIBLE); offline.setVisibility(View.VISIBLE); }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (offline.getVisibility() != View.VISIBLE) web.setVisibility(View.VISIBLE);
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (offline.getVisibility() == View.VISIBLE) { finish(); return; }
                // Ochiq oyna bo'lsa avval uni yopamiz
                web.evaluateJavascript("window.somsaBack ? window.somsaBack() : false", v -> {
                    if (!"true".equals(v)) moveTaskToBack(true);
                });
            }
        });

        if (state != null) web.restoreState(state); else web.loadUrl(HOME);
    }

    /** Dasturdan fayl (masalan Excel) saqlash: Yuklanmalar papkasiga yozadi va "Ulashish" oynasini ochadi. */
    private class Native {
        @JavascriptInterface
        public String saveFile(String name, String mime, String b64) {
            try {
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                String safe = name.replaceAll("[^A-Za-z0-9._'-]", "_");
                Uri uri;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Milliy somsa");
                    uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new Exception("insert");
                    try (OutputStream o = getContentResolver().openOutputStream(uri)) { o.write(data); }
                } else {
                    File dir = new File(getCacheDir(), "export");
                    dir.mkdirs();
                    File f = new File(dir, safe);
                    try (FileOutputStream o = new FileOutputStream(f)) { o.write(data); }
                    uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".files", f);
                }
                final Uri u = uri;
                runOnUiThread(() -> {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType(mime);
                    send.putExtra(Intent.EXTRA_STREAM, u);
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    try { startActivity(Intent.createChooser(send, "Faylni yuborish yoki ochish")); } catch (Exception ignored) {}
                });
                return Build.VERSION.SDK_INT >= 29 ? "Saqlandi: Yuklanmalar / Milliy somsa" : "Fayl tayyor";
            } catch (Exception e) {
                return "Faylni saqlab bo'lmadi";
            }
        }
    }

    private void openOutside(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException e) { Toast.makeText(this, "Havolani ochadigan ilova topilmadi", Toast.LENGTH_LONG).show(); }
    }

    private LinearLayout buildOffline() {
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(pad, pad, pad, pad);
        box.setBackgroundColor(Color.parseColor(BG));
        box.setVisibility(View.GONE);
        TextView title = new TextView(this);
        title.setText("Internetga ulanib bo'lmadi");
        title.setTextSize(20);
        title.setTextColor(Color.parseColor("#1E1A17"));
        title.setGravity(Gravity.CENTER);
        TextView text = new TextView(this);
        text.setText("Aloqani tekshirib, qayta urinib ko'ring.");
        text.setTextSize(15);
        text.setTextColor(Color.parseColor("#5E5650"));
        text.setGravity(Gravity.CENTER);
        text.setPadding(0, pad / 3, 0, pad);
        Button retry = new Button(this);
        retry.setText("Qayta urinish");
        retry.setAllCaps(false);
        retry.setOnClickListener(v -> { box.setVisibility(View.GONE); web.setVisibility(View.VISIBLE); web.loadUrl(HOME); });
        box.addView(title); box.addView(text); box.addView(retry);
        return box;
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    protected void onPause() { web.onPause(); super.onPause(); }

    @Override
    protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}
