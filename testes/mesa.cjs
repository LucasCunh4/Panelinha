// Mesa V1: arte oficial, geometria, interações reais e privacidade das mãos.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const evidence=process.env.PANELAS_SCREENSHOTS||'/workspace/work/refinamentos-evidence';
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const refresh=()=>page.evaluate(()=>document.querySelector('#useCardArt').onchange());
 const fixture=()=>page.evaluate(()=>{
  const s=CartasTest.getState();Object.assign(s,{current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,pendingAction:null,cutOpen:false,activeColor:'blue',direction:1,phase:'playing',token:s.token+1});
  s.o.timeout=0;s.deck=Array.from({length:80},(_,i)=>({id:52000+i,type:'num',color:'red',num:1}));s.discard=[{id:50000,type:'num',color:'blue',num:2}];
  s.players[0].hand=[{id:50001,type:'reverse',color:'blue',num:null},...Array.from({length:6},(_,i)=>({id:50002+i,type:'num',color:['red','blue','green','yellow'][i%4],num:i}))];
  document.querySelector('#useCardArt').onchange();
 });
 try{
  await page.clock.install();await page.goto(base);await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();await fixture();
  assert.equal(await page.locator('.seat .pan-avatar').count(),4);
  assert.equal(await page.locator('#player2 .subhand').count(),1);assert.equal(await page.locator('#player1 .back,#player3 .back').count(),2);
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS/documentacao/MANIFESTO_MESA_V1.json')));
  for(const f of manifest.asset_files){const response=await page.request.get(new URL(f.path,base).href);assert.equal(response.status(),200);assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),f.sha256);}
  console.log('PASS 6 PNGs oficiais por SHA-256/HTTP; quatro participantes; parceiro visível e adversários ocultos');
  const sizes=[[320,568],[360,640],[390,844],[412,915],[568,320],[667,375],[844,390],[915,412],[1280,800],[1920,1080]];
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height});await fixture();await page.clock.runFor(220);
   const geometry=await page.evaluate(()=>{
    const rect=id=>document.getElementById(id).getBoundingClientRect();const cardTop=Math.min(...[...document.querySelectorAll('#hand>button')].map(c=>c.getBoundingClientRect().top));const bg=rect('stoveScene'),burner=rect('burner'),discard=rect('discard'),hand=rect('hand'),top=rect('player2'),left=rect('player3'),right=rect('player1');
    const near=(a,b)=>Math.abs(a-b)<1;
    const hit=id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};
    return {noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,
     registered:near(burner.x+burner.width/2,bg.x+bg.width*836/1672)&&near(burner.y+burner.height/2,bg.y+bg.height*451/941)&&near(burner.width,burner.height),
     discard:near(discard.x+discard.width/2,burner.x+burner.width/2)&&near(discard.y+discard.height/2,burner.y+burner.height/2),
     background:bg.left<=0&&bg.top<=0&&bg.right>=innerWidth-1&&bg.bottom>=innerHeight-1,
     positions:top.bottom<discard.top&&left.right<discard.left&&right.left>discard.right&&cardTop>=discard.bottom,
     hand:hand.bottom<=innerHeight&&hand.top>0,buyHit:hit('buyBtn'),menuHit:hit('tableMenuBtn')};
   });
   for(const [key,value] of Object.entries(geometry))assert.ok(value,`${key} ${width}x${height}: ${JSON.stringify(geometry)}`);
   await page.locator('#hand>button').last().scrollIntoViewIfNeeded();
   assert.ok(await page.locator('#hand>button').last().evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),`carta fora da tela ${width}x${height}`);
   await page.screenshot({path:path.join(evidence,`${width}x${height}-duplas.png`)});
  }
  console.log('PASS 10 tamanhos: sem rolagem da mesa; fundo e chama co-registrados; descarte no queimador; compra/menu alcançáveis; mãos dentro da tela');
  for(const color of ['red','blue','green','yellow',null]){
   await page.evaluate(color=>{CartasTest.getState().activeColor=color;document.querySelector('#useCardArt').onchange()},color);await page.clock.runFor(220);
   await page.locator('.flame').evaluateAll(els=>Promise.all(els.flatMap(el=>el.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished))));
   assert.equal(await page.locator('.flame').evaluateAll(els=>els.filter(el=>Number(getComputedStyle(el).opacity)>.1).length),color?1:0);
   if(color){await page.locator(`.flame-${color}`).evaluate(el=>Promise.all(el.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished)));assert.equal(await page.locator(`.flame-${color}`).evaluate(el=>getComputedStyle(el).opacity),'0.66');}
  }
  console.log('PASS quatro chamas por estado, crossfade e ausência de chama sem cor ativa');
  await page.setViewportSize({width:390,height:844});await fixture();
  await page.locator('#tableMenuBtn').tap();assert.ok(await page.locator('#tableMenu').isVisible());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'closeTableMenu');
  await page.locator('.debug summary').tap();await page.locator('#reveal').check();assert.equal(await page.locator('#player1 .subhand').count(),1);
  await page.locator('#reveal').uncheck();await page.keyboard.press('Escape');assert.ok(await page.locator('#tableMenu').isHidden());
  assert.equal(await page.evaluate(()=>document.activeElement.id),'tableMenuBtn');
  await page.locator('[data-card="50001"]').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().direction),-1);assert.equal(await page.locator('#directionGlyph').innerText(),'↺');
  assert.equal(await page.locator('#directionGlyph').evaluate(el=>el.getAnimations().length),1);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#directionGlyph').getAnimations().length===0);assert.equal(await page.locator('#directionGlyph').evaluate(el=>el.getAnimations().length),0);
  console.log('PASS menu sobreposto, foco/ESC, laboratório e retorno à mesa; Inverter por toque e movimento reduzido');
  // Compra real no monte e guarda da carta: os handlers originais continuam ativos.
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.deck=[{id:55000,type:'num',color:'blue',num:8}]});await refresh();
  await page.locator('#buyBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().drawn),55000);await page.locator('#passBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().current),1);
  await fixture();await page.evaluate(()=>document.querySelector('#testPenalty').click());await page.locator('#buyBtn').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().penalty),0);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),27);
  console.log('PASS compra por toque no monte, guardar/passagem e pagamento integral de +20');
  for(const [width,height] of [[390,844],[844,390]]){
   await page.setViewportSize({width,height});await fixture();
   await page.evaluate(()=>{const s=CartasTest.getState();s.activeColor='red';s.discard=[{id:57000,type:'num',color:'red',num:7}];s.players[0].hand=[{id:57001,type:'draw2',color:'red'},{id:57002,type:'draw2',color:'red'},{id:57003,type:'num',color:'blue',num:9}];document.querySelector('#useCardArt').onchange();window.holdCut=()=>{s.unlockAt=Date.now()+120000;document.querySelector('#useCardArt').onchange()};document.querySelector('[data-card="57001"]').addEventListener('click',holdCut,{once:true})});
   await page.locator('[data-card="57001"]').tap();await page.locator('#unoBtn').tap();assert.ok(await page.evaluate(()=>CartasTest.getState().preUno));
   await page.locator('#cutBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().penalty),2);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),1);
  }
  console.log('PASS sequência por toque: +2, anúncio de última carta e corte da segunda cópia, em retrato/paisagem');
  // Balão tem a carta como único alvo, inclusive fora do turno; mantém pausa de 2,8s.
  for(const [width,height] of [[320,568],[390,844],[568,320],[844,390]]){
   await page.setViewportSize({width,height});await fixture();
   await page.evaluate(()=>{const s=CartasTest.getState();s.current=2;s.cutOpen=true;s.lastActor=1;s.discard=[{id:58000,type:'num',color:'blue',num:4}];s.players[0].hand.push({id:58001,type:'num',color:'blue',num:4});document.querySelector('#useCardArt').onchange()});
   assert.equal(await page.locator('#controls #cutBtn').count(),0);assert.equal(await page.locator('#hand #cutBtn .cut-bubble img').count(),1);
   const r=await page.locator('#cutBtn .cut-bubble').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=height&&r.width>=58&&r.height>=58);
   await page.screenshot({path:path.join(evidence,`${width}x${height}-corte.png`)});
   await page.locator('#cutBtn .cut-bubble').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().discard.at(-1).id),58001);
   assert.ok(await page.evaluate(()=>CartasTest.getState().unlockAt-Date.now()>=2700&&CartasTest.getState().unlockAt-Date.now()<=2800));
  }
  console.log('PASS faca na carta elegível, toque no balão e pausa de corte preservada em retrato/paisagem');
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=Array.from({length:30},(_,i)=>({id:60000+i,type:'num',color:'blue',num:i%10}));s.players[2].hand=Array.from({length:20},(_,i)=>({id:61000+i,type:'num',color:'green',num:i%10}));document.querySelector('#useCardArt').onchange()});
  assert.ok(await page.locator('#hand').evaluate(el=>el.scrollWidth>el.clientWidth&&el.classList.contains('scroll-hand')));
  await page.locator('#hand>button').last().scrollIntoViewIfNeeded();assert.ok(await page.locator('#hand>button').last().evaluate(el=>{const r=el.getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight}));
  assert.ok(await page.locator('#player2 .subhand').evaluate(el=>el.scrollWidth>el.clientWidth));
  await page.evaluate(()=>{const s=CartasTest.getState();s.o.duo=false;document.querySelector('#useCardArt').onchange()});assert.equal(await page.locator('#player2 .back').count(),1);assert.equal(await page.locator('#player2 .card-image').count(),0);
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.o.single=true;s.o.duo=false;s.players[0].hand=[{id:65000,type:'num',color:'blue',num:3}];document.querySelector('#useCardArt').onchange()});await page.locator('[data-card="65000"]').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().phase),'gameOver');assert.ok(await page.locator('#controls').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>200&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  await page.locator('#backLobby').tap();assert.ok(await page.locator('#menu').isVisible());await page.locator('#mode').selectOption('solo');await page.locator('#startBtn').tap();assert.equal(await page.locator('#player2 .back').count(),1);
  console.log('PASS classificação e controles de fim de rodada; retorno às opções e novo início individual');
  await page.evaluate(()=>{const before=JSON.stringify(CartasTest.getState()),state=JSON.parse(before);const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}};freeze(state);PanelasMesa.render(state);if(JSON.stringify(CartasTest.getState())!==before)throw Error('Apresentação alterou regras/estado')});
  assert.deepEqual(errors,[]);console.log('PASS mãos grandes alcançáveis, individual sem vazamento de cartas e apresentação sem mutação do estado');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
