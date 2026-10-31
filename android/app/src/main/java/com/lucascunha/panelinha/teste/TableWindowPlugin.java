package com.lucascunha.panelinha.teste;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TableWindow")
public class TableWindowPlugin extends Plugin {
    @PluginMethod
    public void backgroundApp(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().moveTaskToBack(true);
            call.resolve();
        });
    }

    @PluginMethod
    public void setPlaying(PluginCall call) {
        boolean playing = Boolean.TRUE.equals(call.getBoolean("playing", false));
        getActivity().runOnUiThread(() -> {
            ((MainActivity) getActivity()).setGamePlaying(playing);
            call.resolve();
        });
    }
}
