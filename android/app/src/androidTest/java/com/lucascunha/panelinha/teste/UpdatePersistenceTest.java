package com.lucascunha.panelinha.teste;

import static org.junit.Assert.*;
import android.content.Context;
import android.os.SystemClock;
import android.webkit.WebView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.*;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class UpdatePersistenceTest {
    @Rule public ActivityTestRule<MainActivity> activity = new ActivityTestRule<>(MainActivity.class);
    @Test public void localDataSurvivesReplacement() throws Exception {
        assertEquals("preservado-v0.1", InstrumentationRegistry.getInstrumentation().getTargetContext().getSharedPreferences("upgrade-check", Context.MODE_PRIVATE).getString("sentinel",null));
        WebView web = activity.getActivity().getBridge().getWebView();
        long end=SystemClock.uptimeMillis()+45000;
        while(SystemClock.uptimeMillis()<end){
            AtomicReference<String> result=new AtomicReference<>();CountDownLatch latch=new CountDownLatch(1);
            InstrumentationRegistry.getInstrumentation().runOnMainSync(()->web.evaluateJavascript("location.origin==='https://localhost' && localStorage.getItem('panelinha-upgrade-check')==='preservado-v0.1'",v->{result.set(v);latch.countDown();}));
            assertTrue(latch.await(15,TimeUnit.SECONDS));
            if("true".equals(result.get()))return;
            SystemClock.sleep(200);
        }
        fail("localStorage não preservado na mesma origem após atualizar");
    }
}
