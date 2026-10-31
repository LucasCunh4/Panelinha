// Verifica a apresentação sem substituir ações reais por uma segunda lógica de jogo.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const evidence=process.env.PANELAS_SCREENSHOTS||'/workspace/work/refinamentos-evidence';
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=()=>page.evaluate(()=>{
  const s=CartasTest.getState();Object.assign(s,{current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,pendingAction:null,cutOpen:false,activeColor:'red',direction:1,phase:'playing',lastActor:null,unoWindow:null,preUno:false,token:s.token+1});
  Object.assign(s.o,{timeout:0,cut:true,duo:true,single:false});
  s.discard=[{id:70000,type:'num',color:'red',num:0}];s.deck=Array.from({length:80},(_,i)=>({id:71000+i,type:'num',color:'green',num:5}));
  s.players.forEach((p,i)=>p.hand=[{id:70100+i,type:'num',color:'red',num:i+1},{id:70200+i,type:'num',color:'blue',num:9}]);
  document.querySelector('#useCardArt').onchange();
 });
 const finishFlights=()=>page.locator('.played-card').evaluateAll(nodes=>Promise.all(nodes.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
 try{
  await page.clock.install();await page.goto(base);await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();await fixture();
  for(const [width,height] of [[320,568],[390,844],[568,320],[844,390],[1280,800]]){
   await page.setViewportSize({width,height});await fixture();
   const layout=await page.evaluate(()=>{
    const pile=document.getElementById('buyBtn').getBoundingClientRect(),discard=document.getElementById('discard').getBoundingClientRect();
    const m=id=>getComputedStyle(document.querySelector(`#${id} .back`)).transform;
    return {vertical:document.getElementById('pile').getBoundingClientRect().height>document.getElementById('pile').getBoundingClientRect().width*1.8,left:pile.right<discard.left-8&&discard.left-pile.right<innerWidth*.46,
     panels:[1,2,3].every(i=>{const st=getComputedStyle(document.getElementById('player'+i));return st.backgroundColor==='rgba(0, 0, 0, 0)'&&st.boxShadow==='none'}),
     leftAngle:m('player3'),rightAngle:m('player1')};
   });
   assert.ok(layout.vertical&&layout.left&&layout.panels,JSON.stringify(layout));
   if(height>width){assert.match(layout.leftAngle,/matrix\(1, 0, 0, 1,/);assert.match(layout.rightAngle,/matrix\(1, 0, 0, 1,/);}
   else{assert.match(layout.leftAngle,/matrix\(0, 1, -1, 0,/);assert.match(layout.rightAngle,/matrix\(0, -1, 1, 0,/);}
  }
  console.log('PASS monte vertical na lateral esquerda, mãos sobre a mesa sem painéis e orientação coerente nas laterais');
  await page.setViewportSize({width:390,height:844});await fixture();
  const flame=await page.locator('.flame-red').evaluate(el=>({mask:getComputedStyle(el).webkitMaskImage,iterations:el.getAnimations().filter(a=>a.effect.getTiming().iterations===Infinity).length}));
  assert.match(flame.mask,/radial-gradient/);assert.equal(flame.iterations,2);
  await page.locator('.flame-red').evaluate(el=>Promise.all(el.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished)));
  assert.equal(await page.locator('.flame-red').evaluate(el=>getComputedStyle(el).opacity),'0.74');
  console.log('PASS encurtamento radial das pontas, intensidade menor e duas oscilações contínuas suaves por CSS');
  await page.locator('#unoBtn').tap();
  await page.locator('[data-card="70100"]').evaluate(button=>button.addEventListener('click',()=>{const r=button.querySelector('.card').getBoundingClientRect();window.expectedFlightOrigin={x:r.x+r.width/2,y:r.y+r.height/2}},{once:true,capture:true}));
  await page.locator('[data-card="70100"]').tap();
  assert.equal(await page.locator('#table').evaluate(el=>el.scrollLeft+el.scrollTop),0);
  const human=page.locator('.played-card[data-card-id="70100"]');await human.waitFor();
  const coordinates=await human.evaluate(el=>({...el.dataset}));
  const origin=await page.evaluate(()=>window.expectedFlightOrigin);
  assert.ok(Math.abs(Number(coordinates.originX)-origin.x)<1,JSON.stringify({coordinates,origin}));
  assert.ok(Math.abs(Number(coordinates.originY)-origin.y)<1,JSON.stringify({coordinates,origin}));
  assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),1);
  assert.ok(await page.locator('#discard').evaluate(el=>el.classList.contains('receiving-card')));
  assert.equal(await human.evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  assert.ok(await page.evaluate(()=>CartasTest.getState().unlockAt-Date.now()>2000));
  await human.evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=180});
  const midway=await human.boundingBox();const mx=midway.x+midway.width/2,my=midway.y+midway.height/2;
  assert.ok(Math.hypot(mx-origin.x,my-origin.y)>20&&Math.hypot(mx-Number(coordinates.targetX),my-Number(coordinates.targetY))>20);
  await page.screenshot({path:path.join(evidence,'voo-humano-meio.png')});
  await human.evaluate(el=>el.getAnimations()[0].play());await finishFlights();
  assert.equal(await page.locator('.played-card').count(),0);assert.ok(await page.locator('#discard .discard-top .card').isVisible());
  console.log('PASS carta humana parte da posição real da mão, voa em arco e pousa; motor/pausa continuam independentes');
  for(const actor of [1,2,3]){
   await page.clock.runFor(2240);
   const flight=page.locator(`.played-card[data-actor="${actor}"]`);await flight.waitFor();
   const actual=await flight.evaluate(el=>({...el.dataset}));
   assert.equal(Number(actual.cardId),70100+actor);
   assert.equal(await flight.locator('.flight-back').count(),actor===2?0:1);
   assert.equal(await flight.locator('.flight-front .card-image').count(),1);
   assert.ok(await page.evaluate(actor=>actor===2||!document.querySelector(`#player${actor} .card-image`),actor));
   await flight.evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=180});
   await page.screenshot({path:path.join(evidence,`voo-bot-${actor}-meio.png`)});
   await flight.evaluate(el=>el.getAnimations()[0].play());await finishFlights();
  }
  console.log('PASS três bots: origem em cada assento, verso nas mãos ocultas e somente a carta jogada revelada no trajeto');
  await fixture();await page.evaluate(()=>{CartasTest.getState().o.duo=false;document.querySelector('#useCardArt').onchange()});
  assert.match(await page.locator('#player2 .back').evaluate(el=>getComputedStyle(el).transform),/matrix\(-1, 0, 0, -1,/);
  await page.locator('#unoBtn').tap();await page.locator('[data-card="70100"]').tap();await finishFlights();
  for(const actor of [1,2]){await page.clock.runFor(2240);const f=page.locator(`.played-card[data-actor="${actor}"]`);await f.waitFor();assert.equal(await f.locator('.flight-back').count(),1);await finishFlights();}
  console.log('PASS individual: mão superior fechada, orientada a 180 graus, com verso até a carta sair da mão');
  await fixture();await page.locator('#unoBtn').tap();await page.locator('[data-card="70100"]').tap();
  assert.equal(await page.locator('.played-card').count(),1);
  const before=await page.evaluate(()=>JSON.stringify(CartasTest.getState()));
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>document.querySelectorAll('.played-card').length===0);
  assert.equal(await page.evaluate(()=>JSON.stringify(CartasTest.getState())),before);assert.ok(await page.locator('#discard .discard-top .card').isVisible());
  console.log('PASS rotação encerra somente o efeito visual e conserva o estado/descartes');
  // Reproduz a rolagem de foco de WebViews que ainda não suportam overflow:clip.
  await page.setViewportSize({width:390,height:844});await page.addStyleTag({content:'.table{overflow:hidden}'});await fixture();
  await page.locator('#unoBtn').tap();await page.locator('[data-card="70100"]').tap();
  await page.waitForFunction(()=>{const t=document.getElementById('table');return t.scrollLeft===0&&t.scrollTop===0});
  await finishFlights();
  assert.ok(await page.locator('#player2').evaluate(el=>{const r=el.getBoundingClientRect();return Math.abs(r.x+r.width/2-innerWidth/2)<1}));
  console.log('PASS foco/toque não desloca a mesa, inclusive no fallback sem overflow:clip');
  await page.emulateMedia({reducedMotion:'reduce'});await fixture();
  await page.waitForFunction(()=>document.querySelector('.flame-red').getAnimations().length===0);
  await page.locator('[data-card="70100"]').tap();assert.equal(await page.locator('.played-card').count(),0);assert.ok(await page.locator('#discard .discard-top .card').isVisible());
  assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),1);
  assert.deepEqual(errors,[]);console.log('PASS movimento reduzido: chama estática e jogadas imediatas visíveis, sem exceções JS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
