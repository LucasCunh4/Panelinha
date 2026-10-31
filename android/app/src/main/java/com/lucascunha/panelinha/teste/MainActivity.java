package com.lucascunha.panelinha.teste;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean gamePlaying;

    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TableWindowPlugin.class);
        super.onCreate(savedInstanceState);
        gamePlaying = savedInstanceState != null && savedInstanceState.getBoolean("gamePlaying", false);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            int types = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            // Durante a partida as barras transitórias sobrepõem a cena, sem
            // reposicionar a mesa. Recortes físicos e teclado continuam reservados.
            Insets safe = insets.getInsets(gamePlaying ? WindowInsetsCompat.Type.displayCutout() : types);
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, keyboard.bottom));
            return new WindowInsetsCompat.Builder(insets).setInsets(types, Insets.NONE).build();
        });
        applyImmersive();
    }

    public void setGamePlaying(boolean playing) {
        gamePlaying = playing;
        applyImmersive();
    }

    private void applyImmersive() {
        View decor = getWindow().getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), decor);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        if (gamePlaying) controller.hide(WindowInsetsCompat.Type.systemBars());
        else controller.show(WindowInsetsCompat.Type.systemBars());
        ViewCompat.requestApplyInsets(decor);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && gamePlaying) applyImmersive();
    }

    @Override public void onSaveInstanceState(Bundle state) {
        state.putBoolean("gamePlaying", gamePlaying);
        super.onSaveInstanceState(state);
    }
}
