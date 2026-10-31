package com.lucascunha.panelinha.teste;

import static org.junit.Assert.*;
import android.content.Context;
import android.graphics.Bitmap;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import android.os.ParcelFileDescriptor;
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
    void awaitVisualFrame() throws Exception {
        CountDownLatch frame = new CountDownLatch(1);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.postVisualStateCallback(0, new WebView.VisualStateCallback() {
            @Override public void onComplete(long requestId) { frame.countDown(); }
        }));
        assertTrue("Quadro visual atual do WebView", frame.await(15, TimeUnit.SECONDS));
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
        awaitVisualFrame();
        JSONArray point = new JSONArray(js("(()=>{const r=document.querySelector(" + quoted + ").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,innerWidth]})()"));
        int[] origin = new int[2];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> web.getLocationOnScreen(origin));
        float scale = web.getWidth() / (float) point.getDouble(2);
        float x = origin[0] + (float) point.getDouble(0)*scale;
        float y = origin[1] + (float) point.getDouble(1)*scale;
        long now = SystemClock.uptimeMillis();
        for (int action : new int[]{MotionEvent.ACTION_DOWN,MotionEvent.ACTION_UP}) {
            MotionEvent event = MotionEvent.obtain(now, SystemClock.uptimeMillis(), action, x, y, 0);
            event.setSource(android.view.InputDevice.SOURCE_TOUCHSCREEN);
            InstrumentationRegistry.getInstrumentation().sendPointerSync(event);event.recycle();
            SystemClock.sleep(80);
        }
    }
    void startControlled() throws Exception {
        js("if(PanelinhaNavigation.current!=='solo')PanelinhaNavigation.go('solo');document.getElementById('startBtn').click();(()=>{const s=CartasTest.getState();Object.assign(s,{current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'red',direction:1,token:s.token+1});s.o.timeout=0;s.o.cut=true;s.o.infinite=false;s.discard=[{id:80000,type:'num',color:'red',num:7}];s.deck=Array.from({length:80},(_,i)=>({id:81000+i,type:'num',color:'red',num:3}));s.players.forEach((p,i)=>p.hand=[{id:82000+i,type:'num',color:'red',num:1},{id:83000+i,type:'num',color:'blue',num:2}]);document.getElementById('useCardArt').onchange()})()");
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
        tap("#singlePlayerBtn");tap("#startBtn");
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
        js("window.__playedCards=[];new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n.classList&&n.classList.contains('played-card'))window.__playedCards.push({id:n.dataset.cardId,actor:n.dataset.actor,x:Number(n.dataset.originX),y:Number(n.dataset.originY)});}))).observe(document.getElementById('playAnimations'),{childList:true})");
        tap("[data-card='84000']");
        waitFor("!CartasTest.getState().players[0].hand.some(c=>c.id===84000)", 60000);
        assertEquals("2", js("CartasTest.getState().penalty"));
        if ("false".equals(js("matchMedia('(prefers-reduced-motion: reduce)').matches"))) {
            assertEquals("true", js("window.__playedCards.some(c=>c.id==='84000'&&c.actor==='0'&&c.x>0&&c.y>0)"));
        }
        // Anunciar antes do corte de 2 para 1 evita a denúncia legítima dos bots.
        tap("#unoBtn");
        waitFor("CartasTest.getState().preUno===true", 60000);
        js("document.getElementById('cutBtn').addEventListener('click',window.__holdCutTurn,{once:true})");
        tap("#cutBtn .cut-bubble");
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
    void captureTable(String orientation) throws Exception {
        // innerWidth muda antes de o SurfaceFlinger terminar a rotação nativa.
        AtomicReference<Boolean> oriented = new AtomicReference<>(false);
        long deadline = SystemClock.uptimeMillis() + 15000;
        while (!oriented.get() && SystemClock.uptimeMillis() < deadline) {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> oriented.set(
                (web.getWidth() > web.getHeight()) == orientation.equals("landscape")));
            if (!oriented.get()) SystemClock.sleep(100);
        }
        assertTrue("WebView na orientação nativa esperada", oriented.get());
        awaitVisualFrame();
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        InstrumentationRegistry.getInstrumentation().getUiAutomation().waitForIdle(300, 5000);
        assertEquals("true", js("document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight"));
        assertEquals("true", js("document.getElementById('table').scrollLeft===0 && document.getElementById('table').scrollTop===0"));
        assertEquals("true", js("(()=>{const r=document.getElementById('pile').getBoundingClientRect(),d=document.getElementById('discard').getBoundingClientRect(),b=document.getElementById('buyBtn').getBoundingClientRect();return b.right<d.left-8&&d.left-b.right<innerWidth*.46&&r.height>r.width*1.8&&b.width>=44})()"));
        assertEquals("true", js("(()=>{const bg=document.getElementById('stoveScene').getBoundingClientRect(),f=document.getElementById('burner').getBoundingClientRect();return Math.abs(f.x+f.width/2-(bg.x+bg.width*836/1672))<1&&Math.abs(f.y+f.height/2-(bg.y+bg.height*451/941))<1&&Math.abs(f.width-f.height)<1})()"));
        Bitmap bitmap = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull("Captura Android da mesa", bitmap);
        File folder = InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null);
        try (FileOutputStream file = new FileOutputStream(new File(folder, "mesa-v1-" + orientation + "-uiautomation.png"))) {
            assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, file));
        } finally { bitmap.recycle(); }
        // screencap fornece uma segunda leitura do display físico, independente
        // da transformação usada por UiAutomation durante rotações do emulador.
        ParcelFileDescriptor screen = InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand("screencap -p");
        File target = new File(folder, "mesa-v1-" + orientation + ".png");
        try (java.io.InputStream input = new ParcelFileDescriptor.AutoCloseInputStream(screen);
             FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
        assertTrue("Captura física PNG", target.length() > 8);
        String details = new JSONArray("[" + js("JSON.stringify({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,motionReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,landscape:matchMedia('(orientation:landscape)').matches,table:document.getElementById('table').getBoundingClientRect().toJSON(),hand:document.getElementById('hand').getBoundingClientRect().toJSON()})") + "]").getString(0);
        org.json.JSONObject geometry = new org.json.JSONObject(details);
        geometry.put("nativeWidth", web.getWidth()); geometry.put("nativeHeight", web.getHeight());
        try (FileOutputStream output = new FileOutputStream(new File(folder, "mesa-v1-" + orientation + ".json"))) {
            output.write(geometry.toString(2).getBytes(StandardCharsets.UTF_8));
        }
        assertEquals("true", js("(()=>{const r=document.getElementById('table').getBoundingClientRect();return Math.abs(r.width-innerWidth)<1&&Math.abs(r.height-innerHeight)<1})()"));
    }
    @Test public void c_portraitAndLandscape() throws Exception {
        startControlled();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        waitFor("innerWidth>innerHeight", 15000);
        captureTable("landscape");
        assertEquals("true", js("document.documentElement.scrollWidth<=innerWidth"));
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitFor("innerHeight>innerWidth", 15000);
        captureTable("portrait");
        assertEquals("true", js("document.documentElement.scrollWidth<=innerWidth"));
        assertEquals("4", js("CartasTest.getState().players.length"));
    }
    boolean barsVisible() {
        AtomicReference<Boolean> visible = new AtomicReference<>(true);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            android.view.View decor = activity.getActivity().getWindow().getDecorView();
            androidx.core.view.WindowInsetsCompat insets = androidx.core.view.ViewCompat.getRootWindowInsets(decor);
            assertNotNull("Insets nativos", insets);
            visible.set(insets.isVisible(androidx.core.view.WindowInsetsCompat.Type.statusBars()) || insets.isVisible(androidx.core.view.WindowInsetsCompat.Type.navigationBars()));
        });
        return visible.get();
    }
    void waitBars(boolean expected) {
        long until = SystemClock.uptimeMillis() + 15000;
        while (barsVisible() != expected && SystemClock.uptimeMillis() < until) SystemClock.sleep(150);
        assertEquals("Visibilidade das barras do sistema", expected, barsVisible());
    }
    @Test public void e_immersiveAndReturnToMenu() throws Exception {
        waitBars(false); // Menu inicial também é imersivo.
        startControlled(); waitBars(false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            android.view.View decor = activity.getActivity().getWindow().getDecorView();
            androidx.core.view.WindowInsetsControllerCompat control = androidx.core.view.WindowCompat.getInsetsController(activity.getActivity().getWindow(), decor);
            assertEquals(androidx.core.view.WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE, control.getSystemBarsBehavior());
            androidx.core.graphics.Insets cutout = androidx.core.view.ViewCompat.getRootWindowInsets(decor).getInsets(androidx.core.view.WindowInsetsCompat.Type.displayCutout());
            assertTrue(decor.getPaddingLeft() >= cutout.left && decor.getPaddingTop() >= cutout.top && decor.getPaddingRight() >= cutout.right && decor.getPaddingBottom() >= cutout.bottom);
            control.show(androidx.core.view.WindowInsetsCompat.Type.systemBars());
        });
        waitBars(true);
        waitBars(false); // Retorno automático, sem chamada da ponte web.
        tap("#tableMenuBtn");tap("#backBtn");tap("#confirmLeaveBtn");waitFor("document.getElementById('menu').getClientRects().length>0",15000);waitBars(false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        waitFor("innerWidth>innerHeight",15000);waitBars(false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        waitFor("innerHeight>innerWidth",15000);waitBars(false);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getActivity().moveTaskToBack(true));
        android.content.Context target = InstrumentationRegistry.getInstrumentation().getTargetContext();
        android.content.Intent launch = target.getPackageManager().getLaunchIntentForPackage(target.getPackageName());
        assertNotNull(launch);launch.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        target.startActivity(launch);waitFor("document.getElementById('menu').getClientRects().length>0",15000);waitBars(false);
    }
    @Test public void f_pressureBlenderAndClock() throws Exception {
        startControlled();
        js("(()=>{const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,penalty:20,highest:6,finisher:null,unlockAt:0,cutOpen:false,pendingAction:null,activeColor:'blue',deadline:0,token:s.token+1});s.o.duo=false;s.o.timeout=0;s.players.forEach((p,a)=>p.hand=Array.from({length:10},(_,i)=>({id:87000+a*100+i,type:'num',color:'green',num:7})));s.players[0].hand.push({id:87900,type:'dist',color:null});s.discard=[{id:87901,type:'num',color:'blue',num:2}];s.deck=Array.from({length:60},(_,i)=>({id:88000+i,type:'num',color:'red',num:1}));window.originalIds=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join();document.getElementById('useCardArt').onchange()})()");
        tap("[data-card='87900']");
        if (js("!!document.querySelector('#hand[data-expanded-color=wild]')&&!CartasTest.getState().pendingAction").equals("true")) tap("[data-card='87900']");
        js("document.querySelector('[data-color=blue]').addEventListener('click',()=>CartasTest.getState().token++,{once:true})");
        tap("[data-color='blue']");
        assertEquals("true",js("(()=>{const s=CartasTest.getState();return s.players.every(p=>p.hand.length>=1)&&s.players[0].hand.length>=7&&s.players[0].hand.length<=9&&Math.max(...s.players.slice(1).map(p=>p.hand.length))-Math.min(...s.players.slice(1).map(p=>p.hand.length))<=2&&s.players.flatMap(p=>p.hand).length===60&&s.penalty===0&&[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()===window.originalIds})()"));
        js("(()=>{const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,penalty:0,finisher:null,unlockAt:0,cutOpen:false,pendingAction:null,activeColor:'blue',deadline:0,token:s.token+1});s.players.forEach((p,a)=>p.hand=[{id:89000+a,type:'num',color:'green',num:7}]);s.players[0].hand.push({id:89900,type:'rotate',color:null});document.getElementById('useCardArt').onchange();document.querySelector('[data-card=\"89900\"]').addEventListener('click',()=>s.token++,{once:true})})()");
        tap("[data-card='89900']");assertEquals("true",js("CartasTest.getState().activeColor==='blue'&&!CartasTest.getState().pendingAction&&document.querySelectorAll('.colorbtn').length===0"));
        js("(()=>{const s=CartasTest.getState();s.current=0;s.token++;s.unlockAt=0;s.cutOpen=false;s.o.timeout=15;s.deadline=Date.now()+4000;document.getElementById('useCardArt').onchange()})()");
        waitFor("document.querySelector('#turnClock:not([hidden])')!==null",15000);
        waitFor("CartasTest.getState().current!==0",15000);
        assertEquals("true",js("document.querySelector('#turnClock:not([hidden])')===null"));
    }
    @Test public void g_continuousFanTouch() throws Exception {
        startControlled();
        js("(()=>{const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,penalty:0,highest:0,finisher:null,unlockAt:0,cutOpen:false,pendingAction:null,activeColor:'blue',deadline:0,token:s.token+1});s.o.timeout=0;s.players[0].hand=Array.from({length:40},(_,i)=>({id:980000+i,type:'num',color:'blue',num:i%8}));s.discard=[{id:989000,type:'num',color:'blue',num:9}];document.getElementById('useCardArt').onchange();s.token++})()");
        assertEquals("40",js("document.querySelectorAll('#hand>button').length"));
        assertEquals("true",js("document.getElementById('hand').classList.contains('grouped-hand')"));
        tap("[data-card='980039']");
        assertEquals("40",js("CartasTest.getState().players[0].hand.length"));
        assertEquals("blue",js("document.getElementById('hand').dataset.expandedColor"));
        SystemClock.sleep(350);
        tap("#turnCue");
        assertEquals("true",js("!document.getElementById('hand').dataset.expandedColor"));
        tap("[data-card='980039']");SystemClock.sleep(350);tap("[data-card='980039']");
        assertEquals("39",js("CartasTest.getState().players[0].hand.length"));
        assertEquals("980039",js("CartasTest.getState().discard[CartasTest.getState().discard.length-1].id"));
        assertEquals("true",js("document.getElementById('table').scrollLeft===0&&document.getElementById('table').scrollTop===0"));
    }
    void systemBack() { InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK); }
    void shell(String command) throws Exception {
        try (java.io.InputStream input = new ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand(command))) {
            byte[] buffer = new byte[4096];while (input.read(buffer) != -1) { }
        }
    }
    @Test public void h_homeNavigationAndSystemBack() throws Exception {
        waitFor("PanelinhaNavigation.current==='home'",15000);waitBars(false);
        assertEquals("2",js("document.querySelectorAll('#home button').length"));
        assertEquals("true",js("[...document.fonts].some(f=>f.family==='PanelinhaDisplay'&&f.status==='loaded')"));
        tap("#multiplayerBtn");tap("#createRoomBtn");waitFor("PanelinhaNavigation.current==='create'",15000);
        systemBack();waitFor("PanelinhaNavigation.current==='multiplayer'",15000);
        tap("#joinRoomBtn");assertEquals("true",js("document.getElementById('roomCode').disabled&&document.getElementById('roomCode').value.length===0"));
        // Somente o emulador/dispositivo de instrumentação: gesto real pela borda.
        int modeId = activity.getActivity().getResources().getIdentifier("config_navBarInteractionMode", "integer", "android");
        int previousMode = activity.getActivity().getResources().getInteger(modeId);
        try {
            shell("cmd overlay enable --user 0 com.android.internal.systemui.navbar.gestural");SystemClock.sleep(1200);
            assertEquals("Navegação gestual habilitada no dispositivo de teste",2,activity.getActivity().getResources().getInteger(modeId));
            android.util.DisplayMetrics metrics = new android.util.DisplayMetrics();
            activity.getActivity().getWindowManager().getDefaultDisplay().getRealMetrics(metrics);
            shell("input swipe 1 "+(metrics.heightPixels/2)+" "+(metrics.widthPixels/3)+" "+(metrics.heightPixels/2)+" 350");
            waitFor("PanelinhaNavigation.current==='multiplayer'",15000);
        } finally {
            if(previousMode!=2)shell("cmd overlay enable --user 0 com.android.internal.systemui.navbar.threebutton");
        }
        systemBack();waitFor("PanelinhaNavigation.current==='home'",15000);
        tap("#singlePlayerBtn");waitFor("PanelinhaNavigation.current==='solo'",15000);tap("#startBtn");
        js("(()=>{const s=CartasTest.getState();s.current=0;s.deadline=0;s.o.timeout=0;s.token++})()");
        assertEquals("4",js("CartasTest.getState().players.length"));
        systemBack();waitFor("!document.getElementById('navDialog').hidden",15000);tap("#cancelLeaveBtn");
        assertEquals("true",js("PanelinhaNavigation.current==='game'&&CartasTest.getState()!==null"));
        tap("#tableMenuBtn");systemBack();waitFor("document.getElementById('tableMenu').classList.contains('hide')",15000);
        systemBack();tap("#confirmLeaveBtn");waitFor("PanelinhaNavigation.current==='solo'&&CartasTest.getState()===null",15000);
        systemBack();waitFor("PanelinhaNavigation.current==='home'",15000);systemBack();tap("#cancelLeaveBtn");waitBars(false);
    }
    @Test public void d_writeUpdateSentinels() throws Exception {
        js("localStorage.setItem('panelinha-upgrade-check','preservado-v0.1')");
        assertEquals("\"preservado-v0.1\"", js("localStorage.getItem('panelinha-upgrade-check')"));
        InstrumentationRegistry.getInstrumentation().getTargetContext().getSharedPreferences("upgrade-check", Context.MODE_PRIVATE).edit().putString("sentinel","preservado-v0.1").commit();
        // Chromium 124 agrupa commits de localStorage com atraso de 5 s. A fixture
        // precisa existir no disco antes de forçar o encerramento do processo.
        // O roteiro também verifica um reinício a frio ANTES de instalar outro APK.
        SystemClock.sleep(7000);
    }
}
