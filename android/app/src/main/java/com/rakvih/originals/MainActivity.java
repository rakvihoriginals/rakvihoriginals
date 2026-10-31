package com.rakvih.originals;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private OfflineOverlay offlineOverlay;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The bridge is missing if the device has no working WebView.
        if (bridge != null) {
            offlineOverlay = new OfflineOverlay(this, bridge);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (offlineOverlay != null) {
            offlineOverlay.start();
        }
    }

    @Override
    public void onStop() {
        if (offlineOverlay != null) {
            offlineOverlay.stop();
        }
        super.onStop();
    }

    @Override
    public void onDestroy() {
        if (offlineOverlay != null) {
            offlineOverlay.destroy();
        }
        super.onDestroy();
    }
}
