package com.lucascunha.panelinha.teste;

import static org.junit.Assert.*;
import android.content.Context;
import android.net.ConnectivityManager;
import android.content.pm.ActivityInfo;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.webkit.WebView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.junit.*;
import org.junit.runner.RunWith;
import org.junit.runners.MethodSorters;

/** Instrumentação apenas no APK de testes; não é incluída no jogo release. */
@RunWith(AndroidJUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class OfflineGameTest {
    @Rule public ActivityTestRule<MainActivity> activity = new ActivityTestRule<>(MainActivity.class);
    WebView web;
    @Before public void ready() throws Exception {
        web = activity.getActivity().getBridge().getWebView();
        waitFor("typeof CartasTest === 'object' && !!document.getElementById('startBtn')", 120000);
    }
    String js(String code) throws Exception {
        AtomicReference<String> result = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.evaluateJavascript(code, value -> {result.set(value);latch.countDown();}));
        assertTrue("Callback JS", latch.await(60, TimeUnit.SECONDS));
        return result.get();
    }
    void waitFor(String expression, int timeout) throws Exception {
        long end = SystemClock.uptimeMillis() + timeout;
        while (SystemClock.uptimeMillis() < end) {
            if ("true".equals(js("Boolean(" + expression + ")"))) return;
            SystemClock.sleep(200);
        }
        fail("Não ocorreu: " + expression + " / " + js("document.body.innerText.slice(0,1500)"));
    }
    void tap(String selector) throws Exception {
        long focusDeadline = SystemClock.uptimeMillis() + 30000;
        while (!web.hasWindowFocus() && SystemClock.uptimeMillis() < focusDeadline) SystemClock.sleep(200);
        assertTrue("A janela do jogo precisa ter foco para receber o toque", web.hasWindowFocus());
        String quoted = org.json.JSONObject.quote(selector);
        js("document.querySelector(" + quoted + ").scrollIntoView({block:'center',inline:'center'})");
        waitFor("(()=>{const e=document.querySelector("+quoted+");return e&&!e.disabled&&e.getBoundingClientRect().height>5&&[...e.querySelectorAll('img')].every(im=>im.complete&&im.naturalWidth>0)})()", 60000);
        js("document.querySelector(" + quoted + ").scrollIntoView({block:'center',inline:'center'})");
        waitFor("(()=>{const e=document.querySelector("+quoted+"),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&e.contains(hit)})()", 60000);
        JSONArray point = new JSONArray(js("(()=>{const r=document.querySelector(" + quoted + ").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,innerWidth]})()"));
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.getLocationOnScreen(origin));
        float scale = web.getWidth() / (float) point.getDouble(2);
        float x = origin[0] + (float) point.getDouble(0)*scale;
        float y = origin[1] + (float) point.getDouble(1)*scale;
        long now = SystemClock.uptimeMillis();
        for (int action : new int[]{MotionEvent.ACTION_DOWN,MotionEvent.ACTION_UP}) {
            MotionEvent event = MotionEvent.obtain(now, SystemClock.uptimeMillis(), action, x, y, 0);
            InstrumentationRegistry.getInstrumentation().sendPointerSync(event);event.recycle();
            SystemClock.sleep(80);
        }
    }
    void startControlled() throws Exception {
        js("document.getElementById('startBtn').click();(()=>{const s=CartasTest.getState();Object.assign(s,{current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'red',direction:1,token:s.token+1});s.o.timeout=0;s.o.cut=true;s.o.infinite=false;s.discard=[{id:80000,type:'num',color:'red',num:7}];s.deck=Array.from({length:80},(_,i)=>({id:81000+i,type:'num',color:'red',num:3}));s.players.forEach((p,i)=>p.hand=[{id:82000+i,type:'num',color:'red',num:1},{id:83000+i,type:'num',color:'blue',num:2}]);document.getElementById('useCardArt').onchange()})()");
    }
    @Test public void a_imagesAndThreeBotsOffline() throws Exception {
        // navigator.onLine é heurístico no WebView sem ACCESS_NETWORK_STATE.
        // Confere a conexão real do SO usando a permissão temporária da instrumentação.
        android.app.UiAutomation automation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
        automation.adoptShellPermissionIdentity("android.permission.ACCESS_NETWORK_STATE");
        try {
            ConnectivityManager network = (ConnectivityManager) InstrumentationRegistry.getInstrumentation().getTargetContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            assertNull("Android deve estar sem rede ativa", network.getActiveNetwork());
        } finally { automation.dropShellPermissionIdentity(); }
        assertEquals("\"function\"", js("typeof String.prototype.replaceAll"));
        assertEquals("\"function\"", js("typeof Element.prototype.getAnimations"));
        js("document.getElementById('startBtn').click()");
        js("window.__pngCheck=null;(async()=>{try{const colors=['vermelho','azul','amarelo','verde'];const faces=[...Array.from({length:10},(_,i)=>String(i)),'mais_2','bloqueio','inverter'];await Promise.all(colors.flatMap(c=>faces.map(async f=>{const im=new Image();im.src='assets/cartas/'+c+'/'+f+'.png';await im.decode();if(im.naturalWidth===0)throw Error('PNG');})));window.__pngCheck=52;}catch(e){window.__pngCheck=String(e);}})()");
        waitFor("window.__pngCheck===52", 120000);
        assertEquals("4", js("CartasTest.getState().players.length"));
        assertEquals("3", js("[1,2,3].filter(i=>document.getElementById('player'+i).innerText.includes('bot')).length"));
    }
    @Test public void b_touchCutAndBuy() throws Exception {
        startControlled();
        js("(()=>{const s=CartasTest.getState();s.players[0].hand=[{id:84000,type:'draw2',color:'red',num:null},{id:84001,type:'draw2',color:'red',num:null},{id:84002,type:'num',color:'blue',num:9}];document.getElementById('useCardArt').onchange()})()");
        // Pausa controlada só na fixture: o emulador sem KVM demora mais que a
        // janela humana de 2,8s. Os handlers de carta/corte continuam originais.
        js("window.__holdCutTurn=()=>{CartasTest.getState().unlockAt=Date.now()+120000;document.getElementById('useCardArt').onchange()};document.querySelector('[data-card=\"84000\"]').addEventListener('click',window.__holdCutTurn,{once:true})");
        tap("[data-card='84000']");
        waitFor("!CartasTest.getState().players[0].hand.some(c=>c.id===84000)", 60000);
        assertEquals("2", js("CartasTest.getState().penalty"));
        // Anunciar antes do corte de 2 para 1 evita a denúncia legítima dos bots.
        tap("#unoBtn");
        waitFor("CartasTest.getState().preUno===true", 60000);
        js("document.getElementById('cutBtn').addEventListener('click',window.__holdCutTurn,{once:true})");
        tap("#cutBtn");
        waitFor("!CartasTest.getState().players[0].hand.some(c=>c.id===84001)", 60000);
        assertEquals("2", js("CartasTest.getState().penalty"));
        assertEquals("1", js("CartasTest.getState().players[0].hand.length"));
        // Laboratório força a punição ao humano; a compra é por toque real.
        js("document.getElementById('testPenalty').click()");
        tap("#buyBtn");
        waitFor("CartasTest.getState().players[0].hand.length===21&&CartasTest.getState().penalty===0", 60000);
        assertEquals("21", js("CartasTest.getState().players[0].hand.length"));
        assertEquals("0", js("CartasTest.getState().penalty"));
        waitFor("CartasTest.getState().log.some(x=>/Bot [123] (jogou|comprou)/.test(x))", 60000);
    }
    @Test public void c_portraitAndLandscape() throws Exception {
        startControlled();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        waitFor("innerWidth>innerHeight", 15000);
        assertEquals("true", js("document.documentElement.scrollWidth<=innerWidth"));
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitFor("innerHeight>innerWidth", 15000);
        assertEquals("true", js("document.documentElement.scrollWidth<=innerWidth"));
        assertEquals("4", js("CartasTest.getState().players.length"));
    }
    @Test public void d_writeUpdateSentinels() throws Exception {
        js("localStorage.setItem('panelinha-upgrade-check','preservado-v0.1')");
        assertEquals("\"preservado-v0.1\"", js("localStorage.getItem('panelinha-upgrade-check')"));
        InstrumentationRegistry.getInstrumentation().getTargetContext().getSharedPreferences("upgrade-check", Context.MODE_PRIVATE).edit().putString("sentinel","preservado-v0.1").commit();
    }
}
