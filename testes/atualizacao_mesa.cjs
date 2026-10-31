const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/atualizacao-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=(n=7)=>page.evaluate(n=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'blue',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,round:s.round+1,token:s.token+1});Object.assign(s.o,{duo:true,single:false,timeout:0,cut:true,infinite:false});
  s.discard=[{id:600000,type:'num',color:'blue',num:2}];s.deck=Array.from({length:100},(_,i)=>({id:610000+i,type:'num',color:'green',num:7}));
  s.players.forEach((p,actor)=>p.hand=Array.from({length:n},(_,i)=>({id:620000+actor*1000+i,type:'num',color:'blue',num:i%10})));
  document.getElementById('useCardArt').onchange();
 },n);
 const finish=async()=>{await page.locator('.flying-card,.block-effect').evaluateAll(nodes=>{nodes.forEach(n=>n.getAnimations().forEach(a=>a.finish()))});await page.waitForFunction(()=>!document.querySelector('.flying-card,.block-effect'));};
 const refresh=()=>page.evaluate(()=>document.getElementById('useCardArt').onchange());
 try{
  await page.clock.install();await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();
  for(const [width,height] of [[320,568],[390,844],[412,915],[568,320],[844,390],[1280,800]]){
   await page.setViewportSize({width,height});
   for(const n of [7,15,20,30,60,100]){
    await fixture(n);await page.clock.runFor(240);await page.locator('#hand>button,.subhand>.card,.back>.hidden-card').evaluateAll(nodes=>Promise.all(nodes.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
    const metrics=await page.evaluate(n=>{
     const r=id=>document.getElementById(id).getBoundingClientRect();const buy=r('buyBtn'),discard=r('discard'),hand=document.getElementById('hand');
     const hands=[1,2,3].map(i=>{const cards=[...document.querySelectorAll(`#player${i} .hidden-card,#player${i} .subhand>.card`)];return {count:cards.length,inside:cards.every(c=>{const t=c.getBoundingClientRect();return t.left>=-1&&t.top>=-1&&t.right<=innerWidth+1&&t.bottom<=innerHeight+1}),faces:document.querySelectorAll(`#player${i} .card-image`).length};});
     return {hands,scroll:Math.abs(hand.scrollLeft-(hand.scrollWidth-hand.clientWidth)/2),noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&r('table').x===0&&document.getElementById('table').scrollLeft===0,buyLeft:buy.right<discard.left-8,buyNear:discard.left-buy.right<innerWidth*.46&&Math.abs((buy.y+buy.height/2)-(discard.y+discard.height/2))<Math.max(120,innerHeight*.2),buyVertical:r('pile').height>r('pile').width*1.8,hit:document.getElementById('buyBtn').contains(document.elementFromPoint(buy.x+buy.width/2,buy.y+buy.height/2)),topClear:r('player2').bottom<discard.top+1};
    },n);
    assert.ok(metrics.noScroll&&metrics.buyLeft&&metrics.buyNear&&metrics.buyVertical&&metrics.hit&&metrics.topClear,`${width}x${height}/${n}: ${JSON.stringify(metrics)}`);
    assert.ok(metrics.hands.every(h=>h.count===n&&h.inside),`leque ${width}x${height}/${n}: ${JSON.stringify(metrics)}`);
    assert.equal(metrics.hands[0].faces+metrics.hands[2].faces,0);assert.equal(metrics.hands[1].faces,n);
    assert.ok(metrics.scroll<=2,`mão não centrada ${width}/${n}: ${metrics.scroll}`);
    if([7,30].includes(n))await page.screenshot({path:path.join(out,`${width}x${height}-${n}-cartas.png`)});
   }
  }
  console.log('PASS 36 layouts: leques completos 7/15/20/30/60/100, sigilo/parceiro, mão centralizada e monte junto ao descarte');
  await page.setViewportSize({width:390,height:844});await fixture(30);
  // Toda carta continua acessível pela rolagem, com toque no botão real.
  for(const i of [0,15,29]){const card=page.locator(`[data-card="${620000+i}"]`);await card.scrollIntoViewIfNeeded();assert.ok(await card.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}));}
  await fixture();let lastScale=1,lastOpacity=.73;
  for(const n of [0,2,6,12,20,40]){
   await page.evaluate(n=>{const s=CartasTest.getState();s.penalty=n;s.highest=n?2:0;document.getElementById('useCardArt').onchange()},n);
   await page.locator('#burner').evaluate(el=>Promise.all(el.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished)));
   const heat=await page.locator('#burner').evaluate(el=>({scale:Number(el.style.getPropertyValue('--heat-scale')),opacity:Number(el.style.getPropertyValue('--heat-opacity'))}));
   assert.ok(heat.scale>=lastScale&&heat.scale<=1.16&&heat.opacity>=lastOpacity&&heat.opacity<=.92);lastScale=heat.scale;lastOpacity=heat.opacity;if(n===20)await page.screenshot({path:path.join(out,'penalidade-20.png')});
  }
  await page.evaluate(()=>{CartasTest.getState().penalty=0;document.getElementById('useCardArt').onchange()});
  assert.equal(await page.locator('#burner').evaluate(el=>el.style.getPropertyValue('--heat-scale')),'1');
  console.log('PASS chama cresce gradualmente até +20 e limita em +40; volta a .74/escala 1 ao encerrar penalidade');
  await fixture();await page.evaluate(()=>document.getElementById('testPenalty').click());const before=await page.evaluate(()=>CartasTest.getState().players[0].hand.length);
  await page.locator('#buyBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),before+20);
  assert.equal(await page.locator('.drawn-card').count(),20);
  const timing=await page.locator('.drawn-card').evaluateAll(nodes=>nodes.map(n=>({delay:Number(n.dataset.delay),duration:Number(n.dataset.duration)})));
  assert.ok(timing.every((t,i)=>i===0||t.delay>timing[i-1].delay));assert.ok(timing.at(-1).delay+timing.at(-1).duration<1850);
  assert.ok(timing[2].delay-timing[1].delay>timing.at(-1).delay-timing.at(-2).delay);
  await page.screenshot({path:path.join(out,'compra-20.png')});await finish();assert.equal(await page.locator('.drawing-card').count(),0);
  console.log('PASS +20: vinte cartas individuais, sequência progressivamente acelerada <1.85s; lógica registra imediatamente e sem fantasmas');
  for(const count of [40,80,100]){
   await fixture();await page.evaluate(count=>{const s=CartasTest.getState();s.penalty=count;s.highest=6;window.allIds=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join();document.getElementById('useCardArt').onchange()},count);
   await page.locator('#buyBtn').tap();assert.equal(await page.locator('.drawn-card').count(),count);
   assert.equal(await page.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()),await page.evaluate(()=>window.allIds));
   assert.ok(await page.locator('.drawn-card').evaluateAll(nodes=>nodes.every(n=>Number(n.dataset.delay)+Number(n.dataset.duration)<1850)));await finish();
  }
  console.log('PASS compras +40/+80/+100: conservação exata e todas as cartas individuais em menos de 1.85s');
  // Bot sem jogada paga +20 pelo fluxo real, mantendo os versos ocultos.
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=[{id:630001,type:'num',color:'blue',num:1},{id:630002,type:'num',color:'green',num:9},{id:630003,type:'num',color:'green',num:6}];document.getElementById('useCardArt').onchange();document.querySelector('[data-card="630001"]').click();s.penalty=20;s.highest=6;s.lastPenalty=null;document.getElementById('useCardArt').onchange()});
  await page.clock.runFor(2250);assert.equal(await page.locator('.drawn-card[data-actor="1"]').count(),20);assert.equal(await page.locator('.drawn-card[data-actor="1"] .card-image').count(),0);await finish();
  console.log('PASS compra de bot também anima vinte versos, sem revelar a mão');
  // Pilha com três cartas e pouso com posição própria, inclusive efeitos consecutivos.
  await fixture();
  const history=[];
  for(let i=0;i<4;i++){
   const id=620000+i;await page.evaluate(id=>{const s=CartasTest.getState();s.current=0;s.unlockAt=0;s.cutOpen=false;s.penalty=0;s.token++;document.getElementById('useCardArt').onchange();document.querySelector(`[data-card="${id}"]`).click()},id);history.push(id);
   assert.equal(await page.locator('.played-card').count(),1);assert.equal(await page.locator('.discard-layer').count(),Math.min(3,i+2));
   const ids=await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.discardId)));
   assert.equal(ids[0],id);assert.deepEqual(ids.slice(0,Math.min(3,i+1)),history.slice(-3).reverse());
   assert.ok(await page.locator('.discard-top').evaluate(el=>el.classList.contains('in-flight')));
   await finish();assert.ok(await page.locator('.discard-top .card').isVisible());
  }
  const transforms=await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>n.style.transform));assert.equal(new Set(transforms).size,3);await page.screenshot({path:path.join(out,'pilha-tres-cartas.png')});
  console.log('PASS histórico visual limitado às três últimas, ordem correta, poses variadas e integração do voo/pouso');
  const oldVisual=await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>n.dataset.visualKey));
  await page.evaluate(()=>{const s=CartasTest.getState();s.players[3].hand.push(...s.deck);s.deck=[];s.current=0;s.unlockAt=0;s.cutOpen=false;s.token++;document.getElementById('useCardArt').onchange()});
  await page.locator('#buyBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().discard.length),1);
  assert.deepEqual(await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>n.dataset.visualKey)),oldVisual);await finish();
  const drawn=await page.evaluate(()=>CartasTest.getState().drawn);await page.locator(`[data-card="${drawn}"]`).tap();await finish();
  assert.equal(await page.locator('.discard-layer').count(),3);assert.equal(new Set(await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>n.dataset.visualKey))).size,3);
  console.log('PASS reciclagem do descarte mantém três representações históricas com identidades visuais distintas');
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=[{id:635001,type:'draw2',color:'blue'},{id:635002,type:'draw2',color:'blue'},{id:635003,type:'num',color:'blue',num:9}];document.getElementById('useCardArt').onchange()});
  await page.locator('[data-card="635001"]').tap();await page.locator('#cutBtn .cut-bubble').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().penalty),2);assert.equal(await page.locator('.played-card').count(),2);
  assert.equal(new Set(await page.locator('.played-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.cardId))).size,2);
  await finish();assert.equal(await page.locator('.discard-layer.in-flight').count(),0);assert.equal(await page.locator('.flying-card').count(),0);
  console.log('PASS corte durante o voo: dois descartes únicos, um efeito +2 e nenhuma carta fantasma');
  // Bloqueio evidencia o próximo participante nas duas direções sem mudar a regra.
  for(const direction of [1,-1]){
   await fixture();await page.evaluate(direction=>{const s=CartasTest.getState();s.direction=direction;s.players[0].hand.push({id:640001,type:'skip',color:'blue'});document.getElementById('useCardArt').onchange();document.querySelector('[data-card="640001"]').click()},direction);
   assert.equal(await page.locator('.block-effect').getAttribute('data-blocked'),String(direction===1?1:3));assert.equal(await page.evaluate(()=>CartasTest.getState().current),2);await page.locator('.block-effect').evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=650});await page.screenshot({path:path.join(out,`bloqueio-${direction}.png`)});await finish();
  }
  console.log('PASS efeito Bloqueio aponta para o jogador correto nos dois sentidos; regra preservada');
  // O ticker existente alimenta 5..0; sem segundo relógio de jogo.
  for(const actor of [0,1,2,3]){
   await fixture();await page.evaluate(actor=>{const s=CartasTest.getState();s.current=actor;s.o.timeout=15;s.deadline=Date.now()+5500;s.token++;document.getElementById('useCardArt').onchange();window.timerValues=[];const original=PanelasMesa.updateClock;PanelasMesa.updateClock=(state,now)=>{original(state,now);const b=document.querySelector('.turn-clock');if(b)window.timerValues.push(b.textContent)}},actor);
   assert.equal(await page.locator('.turn-clock').count(),0);await page.clock.runFor(600);assert.equal(await page.locator('.turn-clock').textContent(),'5');assert.equal(await page.locator('.turn-clock').getAttribute('data-actor'),String(actor));
   const badge=await page.locator('.turn-clock').boundingBox();assert.ok(badge.x>=0&&badge.y>=0&&badge.x+badge.width<=390&&badge.y+badge.height<=844);
   assert.ok(await page.locator('.turn-clock').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.getElementById('buyBtn').getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom}));
   await page.setViewportSize({width:844,height:390});
   assert.ok(await page.locator('.turn-clock').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.getElementById('buyBtn').getBoundingClientRect();return a.left>=0&&a.top>=0&&a.right<=innerWidth&&a.bottom<=innerHeight&&(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom)}));
   await page.setViewportSize({width:390,height:844});
   await page.clock.runFor(5000);const values=await page.evaluate(()=>window.timerValues);for(const n of ['5','4','3','2','1','0'])assert.ok(values.includes(n),`${actor}: ${values}`);
   assert.equal(await page.locator(`#player${actor} .turn-clock`).count(),0);
  }
  await fixture();assert.equal(await page.locator('.turn-clock').count(),0);
  console.log('PASS cronômetro 5/4/3/2/1/0 humano e três bots, some após turno e não aparece sem limite habilitado');
  // Cancelamento das camadas visuais não muda o estado das cartas.
  await fixture();await page.locator('[data-card="620000"]').tap();const state=await page.evaluate(()=>JSON.stringify(CartasTest.getState()));
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>!document.querySelector('.flying-card'));assert.equal(await page.evaluate(()=>JSON.stringify(CartasTest.getState())),state);
  await page.emulateMedia({reducedMotion:'reduce'});await fixture();await page.locator('[data-card="620000"]').tap();assert.equal(await page.locator('.flying-card').count(),0);assert.ok(await page.locator('.discard-top .card').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS rotação e movimento reduzido sem mutação, bloqueio de toque ou cartas fantasmas');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
