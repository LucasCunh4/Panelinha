// Verificação direcionada de apresentação. Executa somente Chromium, sem Android.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/refino-compras-sem-emulador';
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function fixture(){await page.evaluate(()=>{
    const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
    Object.assign(s,{online:false,paused:false,phase:'playing',current:0,activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,blockedPlayer:null,unlockAt:0,presentationUntil:0,cutAnnounceUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastPenaltyPurchase:null,lastActor:null,unoWindow:null,preUno:false,pastWinners:[],teams:[0,0],summary:[],finalStandings:null,winner:null});
    Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo:false,single:true,goal:10});
    let id=80000;const c=(type='num',color='red',num=7)=>({id:++id,type,color,num});
    s.players.forEach(p=>{p.hand=Array.from({length:7},()=>c());p.score=0});s.deck=Array.from({length:40},()=>c('num','blue',2));s.discard=[c()];PanelinhaTableBridge.render();
    window.drawLog=[];window.drawObserver?.disconnect();
    window.drawObserver=new MutationObserver(records=>{
      for(const r of records)for(const n of r.addedNodes)if(n.dataset?.effect==='draw')drawLog.push({id:+n.dataset.cardId,time:performance.now(),duration:+n.dataset.duration,delay:+n.dataset.delay});
      const active=document.querySelectorAll('[data-effect=draw][data-presentation=preview],.draw-choice').length;
      if(active>1)drawLog.push({overlap:active});
    });drawObserver.observe(document.getElementById('playAnimations'),{childList:true});
  });}
  const visibleHand=()=>page.locator('#hand>[data-card]:not(.drawing-card)').count();
  const head=()=>page.locator('#cometHead').evaluate(n=>{const m=n.transform.baseVal.consolidate().matrix;return{x:m.e,y:m.f}});
  const delta=(a,b)=>Math.atan2((a.x-245)*(b.y-245)-(a.y-245)*(b.x-245),(a.x-245)*(b.x-245)+(a.y-245)*(b.y-245));
  try{
    await page.goto('http://127.0.0.1:8000');await page.locator('#singlePlayerBtn').tap();await page.locator('#profileContinueBtn').tap();await page.locator('#startBtn').tap();await page.waitForTimeout(600);
    if(!process.argv.includes('--result-only')){
    for(const [width,height]of[[844,390],[1280,800]]){
      await page.setViewportSize({width,height});await fixture();
      const layout=await page.evaluate(()=>{const r=document.getElementById('stoveDirection').getBoundingClientRect(),b=document.getElementById('burner').getBoundingClientRect();return{dx:r.x+r.width/2-b.x-b.width/2,dy:r.y+r.height/2-b.y-b.height/2,layers:document.querySelectorAll('#cometTail>path').length,sparks:document.querySelectorAll('#stoveDirection .comet-spark').length,pointer:getComputedStyle(document.getElementById('stoveDirection')).pointerEvents};});
      assert.ok(Math.abs(layout.dx+4)<.02&&Math.abs(layout.dy-2)<.02,JSON.stringify(layout));assert.equal(layout.layers,3);assert.equal(layout.sparks,5);assert.equal(layout.pointer,'none');
      let a=await head();await page.waitForTimeout(150);let b=await head();assert.ok(delta(a,b)>0);
      await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand[0]={id:91000,type:'reverse',color:'red'};PanelinhaTableBridge.render();document.querySelector('[data-card="91000"]').click();PanelinhaTableBridge.setOnline(s);});
      assert.equal(await page.evaluate(()=>CartasTest.getState().direction),1);a=await head();await page.waitForTimeout(150);b=await head();assert.ok(delta(a,b)<0);
      await page.screenshot({path:out+'/mesa-'+width+'.png'});
    }
    const loop=await page.evaluate(()=>new Promise(resolve=>{const n=document.getElementById('cometHead'),p=()=>{const m=n.transform.baseVal.consolidate().matrix;return{x:(m.e-245)/220,y:(m.f-245)/194}},start=performance.now();let last=p(),turn=0,maxStep=0;function sample(t){const next=p();const d=Math.atan2(last.x*next.y-last.y*next.x,last.x*next.x+last.y*next.y);turn+=d;maxStep=Math.max(maxStep,Math.abs(d));last=next;if(t-start>=3650)resolve({period:(t-start)*Math.PI*2/Math.abs(turn),maxStep});else requestAnimationFrame(sample)}requestAnimationFrame(sample)}));
    assert.ok(loop.period>3450&&loop.period<3750,JSON.stringify(loop));assert.ok(loop.maxStep<.4,JSON.stringify(loop));
    await page.emulateMedia({reducedMotion:'reduce'});const still=await head();await page.waitForTimeout(100);assert.deepEqual(await head(),still);await page.emulateMedia({reducedMotion:'no-preference'});
    console.log('PASS cometa em três camadas, partículas, alinhamento preservado, duas direções/Inverter real, movimento reduzido; período '+Math.round(loop.period)+'ms');
    await page.setViewportSize({width:844,height:390});await fixture();
    await page.evaluate(()=>{const s=CartasTest.getState();s.o.infinite=true;s.deck.push({id:90003,type:'wild',color:null},{id:90002,type:'num',color:'blue',num:2},{id:90001,type:'num',color:'blue',num:1})});
    await page.locator('#buyBtn').tap();assert.equal(await visibleHand(),7);
    assert.equal(await page.locator('[data-effect=draw]').count(),1);
    await page.waitForTimeout(1400);assert.equal(await visibleHand(),7);assert.equal(await page.locator('[data-effect=draw]').getAttribute('data-card-id'),'90001');
    await page.screenshot({path:out+'/compra-destaque.png'});
    await page.waitForFunction(()=>document.querySelector('[data-card-id="90002"][data-effect=draw]'));assert.equal(await visibleHand(),8);
    await page.waitForFunction(()=>document.querySelector('[data-card-id="90003"][data-effect=draw]'));assert.equal(await visibleHand(),9);
    await page.locator('.draw-choice').waitFor({state:'visible'});assert.equal(await visibleHand(),9);
    await page.waitForTimeout(300);assert.equal(await page.locator('[data-effect=draw]').count(),0);assert.equal(await page.locator('.draw-choice').count(),1);
    assert.deepEqual(await page.locator('.draw-choice-actions button').allTextContents(),['Jogar','Guardar']);
    const log=await page.evaluate(()=>drawLog);assert.equal(log.filter(e=>e.overlap).length,0,JSON.stringify(log));assert.deepEqual(log.map(e=>[e.id,e.duration,e.delay]),[[90001,2400,0],[90002,2400,2460],[90003,960,4920]]);assert.ok(log[1].time-log[0].time>=2400&&log[2].time-log[1].time>=2400,JSON.stringify(log));
    await page.locator('.draw-choice-actions button').filter({hasText:'Guardar'}).tap();assert.equal(await visibleHand(),9);await page.waitForTimeout(580);assert.equal(await visibleHand(),10);assert.equal(await page.locator('.table-flight').count(),0);
    const ids=await page.evaluate(()=>CartasTest.getState().players[0].hand.map(c=>c.id));assert.equal(ids.length,new Set(ids).size);assert.ok([90001,90002,90003].every(id=>ids.includes(id)));
    console.log('PASS compra infinita sequencial: apenas uma carta em destaque, ritmo fixo lento, leque 7→8→9→10 por chegada, escolha persistente e Guardar sem duplicação');
    await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=s.players[0].hand.slice(0,1);s.deck.push({id:91001,type:'num',color:'red',num:5});PanelinhaTableBridge.render()});await page.locator('#buyBtn').tap();
    await page.locator('.draw-choice').waitFor({state:'visible'});assert.deepEqual(await page.locator('.draw-choice-actions button').allTextContents(),['Jogar','Guardar','Última Carta']);assert.equal(await page.locator('#unoBtn,#passBtn').count(),0);await page.locator('#drawUnoBtn').tap();await page.locator('.draw-choice-actions button').filter({hasText:'Jogar',exact:true}).tap();assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),1);
    console.log('PASS escolha disponível ao chegar ao destaque, Jogar/Guardar/Última Carta sem controles duplicados');
    await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.penalty=2;s.highest=2;PanelinhaTableBridge.render()});await page.locator('#buyBtn').tap();
    const hold=await page.evaluate(()=>{const s=CartasTest.getState();return{duration:s.lastPenaltyPurchase.duration,until:s.presentationUntil,current:s.current}});assert.equal(hold.duration,2260);assert.notEqual(hold.current,0);assert.equal(await page.locator('[data-effect=draw]').count(),1);
    assert.ok(await page.locator('.penalty-purchase-transition').count());await page.waitForFunction(()=>document.querySelectorAll('#hand>[data-card]:not(.drawing-card)').length===8);assert.ok(Date.now()<hold.until);await page.waitForTimeout(Math.max(0,hold.until-Date.now()+100));
    assert.equal(await visibleHand(),9);assert.equal(await page.locator('.penalty-purchase-transition,[data-effect=draw],.draw-choice').count(),0);const penaltyLog=await page.evaluate(()=>drawLog);assert.equal(penaltyLog.filter(e=>e.overlap).length,0);assert.deepEqual(penaltyLog.map(e=>[e.duration,e.delay]),[[1000,0],[1000,1060]]);
    console.log('PASS punição sequencial mais rápida/fixa, sem escolhas proibidas, bloqueio até prazo compartilhado de 2260ms');
    await fixture();await page.evaluate(()=>{const s=CartasTest.getState(),card={id:95001,type:'wild6',color:null};s.players[1].hand.push(card);PanelasMesa.recordDraw(s,1,card);PanelinhaTableBridge.render()});
    assert.equal(await page.locator('[data-card-id="95001"]').getAttribute('data-presentation'),'direct');assert.equal(await page.locator('[data-card-id="95001"] img').getAttribute('src'),'assets/padronizadas/verso_oficial_400x850.png');assert.equal(await page.locator('.draw-choice,[data-presentation=preview]').count(),0);await page.waitForTimeout(950);assert.equal(await page.locator('[data-card-id="95001"]').count(),0);
    console.log('PASS compra alheia direta e fechada; nenhuma prévia privada é mostrada');
    }
    for(const [width,height]of[[844,390],[1280,800]]){
      await page.setViewportSize({width,height});await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.o.single=false;s.o.goal=10;s.players.forEach((p,i)=>{p.score=[1,9,7,8][i]});s.players[0].hand=[];s.finisher=0;PanelinhaRules.create({getState:()=>s,name:PanelinhaTableBridge.names,render:PanelinhaTableBridge.render,clearJobs(){},sound(){},round(){}}).finishRound()});await page.waitForTimeout(1100);
      const layout=await page.evaluate(()=>{const controls=document.querySelector('#controls>.controls'),r=controls.getBoundingClientRect(),prev=controls.previousElementSibling.getBoundingClientRect(),panel=document.getElementById('controls');return{gap:r.top-prev.bottom,top:r.top,bottom:r.bottom,scroll:panel.scrollHeight-panel.clientHeight,labels:[...controls.children].map(n=>n.textContent)}});
      assert.ok(layout.gap>=(height<=420?10:14)-.1,JSON.stringify(layout));assert.ok(layout.top>=0&&layout.bottom<=height,JSON.stringify(layout));assert.ok(layout.scroll<=1,JSON.stringify(layout));assert.deepEqual(layout.labels,['Nova partida','Voltar às configurações']);await page.screenshot({path:out+'/resultado-'+width+'.png'});
    }
    console.log('PASS espaçamento dos botões finais em celular/tablet, pódio e ações preservados, sem rolagem adicional');
    assert.deepEqual(errors,[]);console.log('PASS nenhum erro JavaScript; nenhum emulador ou teste Android executado');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
