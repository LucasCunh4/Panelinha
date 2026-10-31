package com.lucascunha.panelinha.teste;

import android.os.Bundle;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final Runnable restoreImmersive = this::applyImmersive;

    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TableWindowPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            int types = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            // Barras transitórias sobrepõem a cena; recortes físicos e teclado
            // continuam reservados tanto no menu quanto durante a partida.
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, keyboard.bottom));
            view.removeCallbacks(restoreImmersive);
            if (insets.isVisible(WindowInsetsCompat.Type.statusBars()) ||
                    insets.isVisible(WindowInsetsCompat.Type.navigationBars())) {
                view.postDelayed(restoreImmersive, 1800);
            }
            return new WindowInsetsCompat.Builder(insets).setInsets(types, Insets.NONE).build();
        });
        applyImmersive();
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
                if (insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())) {
                    WindowCompat.getInsetsController(getWindow(), decor).hide(WindowInsetsCompat.Type.ime());
                    return;
                }
                if (getBridge() == null || getBridge().getWebView() == null) { moveTaskToBack(true); return; }
                getBridge().getWebView().evaluateJavascript(
                    "Boolean(window.PanelinhaNavigation && window.PanelinhaNavigation.back({native:true}))",
                    handled -> { if (!"true".equals(handled)) moveTaskToBack(true); });
            }
        });
    }

    // Compatibilidade com a ponte web existente: a imersão agora vale sempre.
    public void setGamePlaying(boolean playing) { applyImmersive(); }

    private void applyImmersive() {
        if (isFinishing() || isDestroyed()) return;
        View decor = getWindow().getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), decor);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
        ViewCompat.requestApplyInsets(decor);
    }

    @Override public void onResume() {
        super.onResume();
        applyImmersive();
    }

    @Override public void onPause() {
        getWindow().getDecorView().removeCallbacks(restoreImmersive);
        super.onPause();
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) applyImmersive();
    }

    @Override public void onDestroy() {
        getWindow().getDecorView().removeCallbacks(restoreImmersive);
        super.onDestroy();
    }
}
