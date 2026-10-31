package com.rakvih.originals;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.WebViewListener;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Covers the site with the offline screen while it can't be reached. The site stays loaded
 * underneath, so what the user was doing is still there when the connection returns.
 */
final class OfflineOverlay {

    private static final String PAGE_URL = "file:///android_asset/public/offline.html";
    private static final long CHANGE_DELAY_MS = 800;
    private static final long RECHECK_DELAY_MS = 4000;
    private static final long RETRY_DELAY_MS = 700;
    private static final int PROBE_TIMEOUT_MS = 5000;
    private static final int PROBE_ATTEMPTS = 2;
    private static final int FADE_MS = 220;

    private final Activity activity;
    private final Bridge bridge;
    private final ConnectivityManager connectivity;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService probes = Executors.newSingleThreadExecutor();
    private final WebView overlay;
    private final Runnable check = this::runCheck;

    private final ConnectivityManager.NetworkCallback networkCallback = new ConnectivityManager.NetworkCallback() {
        @Override
        public void onAvailable(Network network) {
            main.post(() -> scheduleCheck(CHANGE_DELAY_MS));
        }

        @Override
        public void onLost(Network network) {
            main.post(() -> {
                lastValidated = null;
                scheduleCheck(CHANGE_DELAY_MS);
            });
        }

        @Override
        public void onCapabilitiesChanged(Network network, NetworkCapabilities capabilities) {
            boolean validated = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
            main.post(() -> {
                // This also fires for changes like signal strength, which shouldn't cost a probe.
                if (lastValidated == null || lastValidated != validated) {
                    lastValidated = validated;
                    scheduleCheck(CHANGE_DELAY_MS);
                }
            });
        }
    };

    private boolean started;
    private boolean offline;
    private boolean retrying;
    private boolean probeRunning;
    private boolean checkAgain;
    private Boolean lastValidated;

    OfflineOverlay(Activity activity, Bridge bridge) {
        this.activity = activity;
        this.bridge = bridge;
        this.connectivity = (ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.overlay = createOverlay();

        // A failed request can mean Wi-Fi is connected but has no internet, which Android may not report.
        bridge.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onReceivedError(WebView webView) {
                    scheduleCheck(CHANGE_DELAY_MS);
                }
            }
        );
    }

    void start() {
        started = true;
        connectivity.registerDefaultNetworkCallback(networkCallback);
        // The callback stays silent if there is no network at all, so check once now.
        scheduleCheck(0);
    }

    void stop() {
        started = false;
        retrying = false;
        checkAgain = false;
        lastValidated = null;
        main.removeCallbacks(check);
        connectivity.unregisterNetworkCallback(networkCallback);
    }

    void destroy() {
        probes.shutdownNow();
        overlay.destroy();
    }

    private WebView createOverlay() {
        WebView view = new WebView(activity);
        view.setBackgroundColor(Color.BLACK);
        view.getSettings().setJavaScriptEnabled(true);
        view.addJavascriptInterface(new PageBridge(), "RakvihNetwork");
        view.setWebViewClient(
            new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest request) {
                    return true;
                }
            }
        );
        view.setVisibility(View.GONE);
        view.loadUrl(PAGE_URL);
        activity.addContentView(
            view,
            new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
        return view;
    }

    private void scheduleCheck(long delayMs) {
        if (!started) {
            return;
        }
        main.removeCallbacks(check);
        main.postDelayed(check, delayMs);
    }

    private void runCheck() {
        if (connectivity.getActiveNetwork() == null) {
            onCheckFinished(false);
            return;
        }
        if (probeRunning) {
            checkAgain = true;
            return;
        }
        probeRunning = true;
        String url = bridge.getServerUrl();
        probes.execute(() -> {
            boolean reachable = isReachable(url);
            main.post(() -> {
                probeRunning = false;
                if (checkAgain) {
                    checkAgain = false;
                    runCheck();
                } else {
                    onCheckFinished(reachable);
                }
            });
        });
    }

    private static boolean isReachable(String url) {
        for (int attempt = 0; attempt < PROBE_ATTEMPTS; attempt++) {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setRequestMethod("HEAD");
                connection.setConnectTimeout(PROBE_TIMEOUT_MS);
                connection.setReadTimeout(PROBE_TIMEOUT_MS);
                connection.setUseCaches(false);
                // Any response at all proves the connection works.
                connection.getResponseCode();
                return true;
            } catch (IOException e) {
                // Try again, so one slow request doesn't lock the user out of the app.
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }
        return false;
    }

    private void onCheckFinished(boolean online) {
        if (!started) {
            return;
        }
        if (online) {
            hide();
        } else {
            show();
            if (retrying) {
                overlay.evaluateJavascript("window.onStillOffline && window.onStillOffline()", null);
            }
            scheduleCheck(RECHECK_DELAY_MS);
        }
        retrying = false;
    }

    private void show() {
        if (offline) {
            return;
        }
        offline = true;
        hideKeyboard();
        overlay.evaluateJavascript("window.onOfflineShown && window.onOfflineShown()", null);
        overlay.animate().cancel();
        overlay.setAlpha(0f);
        overlay.setVisibility(View.VISIBLE);
        overlay.bringToFront();
        overlay.animate().alpha(1f).setDuration(FADE_MS).start();
    }

    private void hide() {
        if (!offline) {
            return;
        }
        offline = false;
        overlay.animate().cancel();
        overlay.animate().alpha(0f).setDuration(FADE_MS).withEndAction(() -> overlay.setVisibility(View.GONE)).start();

        // Only reload if the site failed to load, so forms the user was filling in aren't lost.
        WebView site = bridge.getWebView();
        String current = site.getUrl();
        if (current == null || current.startsWith(bridge.getErrorUrl())) {
            site.loadUrl(bridge.getServerUrl());
        }
    }

    private void hideKeyboard() {
        InputMethodManager keyboard = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
        keyboard.hideSoftInputFromWindow(bridge.getWebView().getWindowToken(), 0);
    }

    private final class PageBridge {

        @JavascriptInterface
        public void retry() {
            main.post(() -> {
                retrying = true;
                // With no network the check is instant, so leave time to show that it's checking.
                scheduleCheck(RETRY_DELAY_MS);
            });
        }
    }
}
