package com.lucascunha.panelinha.teste;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // O HTML original usa viewport-fit=cover sem CSS de safe-area.
        // Reservar barras/recorte no host nativo mantém a mesma interface web,
        // inclusive no Android 16 e em WebViews novos, sem sobrepor os controles.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            int types = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            Insets bars = insets.getInsets(types);
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            return new WindowInsetsCompat.Builder(insets).setInsets(types, Insets.NONE).build();
        });
        ViewCompat.requestApplyInsets(decor);
    }
}
