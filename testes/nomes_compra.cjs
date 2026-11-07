const {chromium}=require('playwright');const assert=require('node:assert/strict');
const out='/workspace/work/nomes-compra';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 async function fixture(){return page.evaluate(()=>{
  const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
  Object.assign(s,{phase:'playing',current:0,activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,unlockAt:0,presentationUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastActor:null,unoWindow:null,preUno:false});Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo:false});let id=70000;
  const c=(type='num',color='red',num=7)=>({id:++id,type,color,num});s.players.forEach(p=>p.hand=Array.from({length:7},()=>c()));s.deck=Array.from({length:30},()=>c('num','blue',2));s.discard=[c()];PanelinhaTableBridge.render();
 });}
 async function layout(){return page.evaluate(()=>{
  const box=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
  const obstacles=[...document.querySelectorAll('#hand .card,.seat .card,.seat .hidden-card,.seat .pan-avatar,#buyBtn,#discard,#tableMenuBtn')].map(box).filter(r=>r.w&&r.h);
  const names=[...document.querySelectorAll('.opponent-name')];return names.map(n=>{const r=box(n);return{text:n.textContent,id:+n.dataset.player,font:parseFloat(getComputedStyle(n).fontSize),inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overlap:obstacles.some(o=>Math.min(r.right,o.right)-Math.max(r.x,o.x)>1&&Math.min(r.bottom,o.bottom)-Math.max(r.y,o.y)>1)}});
 });}
 try{
  await page.goto('http://127.0.0.1:8000');await page.locator('#singlePlayerBtn').tap();assert.ok(await page.locator('#avatarGallery button').evaluateAll(ns=>ns.every(n=>!n.innerText.trim())));await page.locator('#profileContinueBtn').tap();await page.locator('#startBtn').tap();await page.waitForTimeout(650);await fixture();
  for(const [width,height] of [[844,390],[1280,800]]){await page.setViewportSize({width,height});await page.waitForTimeout(300);const names=await layout();assert.equal(names.length,3);assert.deepEqual(names.map(n=>n.text).sort(),['Bot 1','Bot 2','Bot 3']);assert.ok(names.every(n=>n.id!==0&&n.font>=18&&n.inside&&!n.overlap),JSON.stringify(names));await page.screenshot({path:out+'/bots-'+width+'.png'});}
  console.log('PASS três nomes de bots com fonte ampliada, sem nome próprio/sobreposições, celular/tablet; seleção de avatar sem textos');
  if(!process.argv.includes('--names-only')){
  await page.setViewportSize({width:844,height:390});await fixture();
  await page.evaluate(()=>CartasTest.getState().deck.push({id:80001,type:'wild',color:null}));await page.locator('#buyBtn').tap();const draw=page.locator('[data-card-id="80001"][data-effect=draw]');assert.equal(await draw.getAttribute('data-duration'),'960');
  const timing=await draw.evaluate(n=>{const a=n.getAnimations()[0];return{easing:a.effect.getTiming().easing,offsets:a.effect.getKeyframes().map(f=>f.offset)}});assert.equal(timing.easing,'linear');assert.ok(timing.offsets.includes(.15)&&timing.offsets.includes(.5));await page.waitForTimeout(450);assert.ok(await draw.isVisible());assert.equal(await page.locator('.draw-choice').count(),0);await page.waitForTimeout(650);assert.ok(await page.locator('.draw-choice').isVisible());await page.locator('.draw-choice button').filter({hasText:'Guardar'}).tap();
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.o.infinite=true;s.deck.push({id:80004,type:'wild',color:null},{id:80003,type:'num',color:'blue',num:2},{id:80002,type:'num',color:'blue',num:1});});await page.locator('#buyBtn').tap();
  const delays=await page.locator('[data-effect=draw]').evaluateAll(ns=>ns.map(n=>n.getAnimations()[0].effect.getTiming().delay));assert.deepEqual(delays,[0,1300,2600]);assert.equal(await page.evaluate(()=>CartasTest.getState().drawn),80004);await page.waitForTimeout(4700);assert.ok(await page.locator('.draw-choice').isVisible());await page.locator('.draw-choice button').filter({hasText:'Guardar'}).tap();
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.penalty=6;s.highest=6;PanelinhaTableBridge.render()});await page.locator('#buyBtn').tap();assert.equal(await page.locator('[data-effect=draw][data-presentation=preview]').count(),6);assert.equal(await page.locator('.draw-choice').count(),0);assert.ok(await page.evaluate(()=>{const s=CartasTest.getState();return s.players[0].hand.length===13&&s.penalty===0&&s.current!==0&&s.drawn===null}));
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState(),c={id:80005,type:'wild',color:null};s.players[1].hand.push(c);PanelasMesa.recordDraw(s,1,c);PanelinhaTableBridge.render()});const other=page.locator('[data-card-id="80005"]');assert.equal(await other.getAttribute('data-presentation'),'direct');assert.equal(await other.getAttribute('data-duration'),'850');assert.equal(await other.locator('.card-image').count(),0);
  console.log('PASS carta jogável chega ao destaque em 960ms e mantém decisão; compra infinita espaçada, penalidade sem descarte e compras alheias apenas com verso');
  }
  const {DEFAULT_RULES}=await import('../multiplayer-server/src/protocol.mjs');const {createMatch,gameView}=await import('../multiplayer-server/src/game.mjs');
  const realNames=['Ana Maria','Bruno Pessoa de Souza','Alexandre de Albuquerque Santos','Maria Clara de Oliveira Almeida'];
  const room={rules:{...DEFAULT_RULES},status:'lobby',players:realNames.map((name,i)=>({id:'p'+i,name,avatar:'frigideira-chef',team:i%2+1,ready:true,bot:false,connected:true}))};createMatch(room,1000);room.players[1].idleBot=true;Object.assign(room.game,{unlockAt:0,countdownAt:0,deadline:0,presentationUntil:0,lastRotation:null,lastDistribution:null});
  for(let self=0;self<4;self++){
   const viewer=room.players[self],g=gameView(room,viewer.id,5000);g.matchId+='-perspective-'+self;
   const snapshot={status:'connected',selfId:viewer.id,state:{code:'123456',hostId:'p0',players:room.players,allReady:false,game:g}};
   await page.evaluate(snapshot=>PanelinhaOnline.receive(snapshot),snapshot);await page.waitForTimeout(300);
   for(const [width,height] of [[844,390],[1280,800]]){await page.setViewportSize({width,height});await page.waitForTimeout(300);const names=await layout();assert.deepEqual(names.map(n=>n.text).sort(),realNames.filter(n=>n!==viewer.name).sort());if(!names.every(n=>n.inside&&!n.overlap))await page.screenshot({path:out+'/colisao.png'});assert.ok(names.every(n=>n.inside&&!n.overlap),JSON.stringify({self,width,names}));if(self===2)await page.screenshot({path:out+'/multiplayer-'+width+'.png'});}
  }
  console.log('PASS quatro perspectivas autoritativas: nomes reais, próprio nome oculto, substituição temporária preserva nome; nomes longos sem colisões em celular/tablet');assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
