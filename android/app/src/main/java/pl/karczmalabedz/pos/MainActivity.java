package pl.karczmalabedz.pos;

import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        view.loadUrl("file:///android_asset/offline.html");
                    }
                }
                
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    view.loadUrl("file:///android_asset/offline.html");
                }
            });
        }
    }
}
