const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/layout-celular/final';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8123');await p.locator('#singlePlayerBtn').click();await p.locator('#profileContinueBtn').click();await p.locator('#startBtn').click();await p.waitForFunction(()=>!PanelinhaTableEffects.dealing());
  await p.emulateMedia({reducedMotion:'reduce'});
  async function fixture(n=7,penalty=0,actions=false,name='Lucas Cunha'){
   await p.evaluate(({n,penalty,actions,name})=>{
    const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
    Object.assign(s,{online:false,paused:false,phase:'playing',current:0,activeColor:'red',direction:-1,penalty,highest:penalty?4:0,lastPenalty:null,finisher:null,blockedPlayer:null,unlockAt:0,presentationUntil:0,playUntil:0,dealUntil:0,lastPlay:null,lastDeal:null,lastNormalPurchase:null,botDrawPending:null,cutAnnounceUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastPenaltyPurchase:null,lastActor:null,unoWindow:null,preUno:false,reveal:false});
    Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo:true,single:true});s.identity={...s.identity,name};
    let id=50000;const c=()=>({id:++id,type:'num',color:['red','blue','green','yellow'][id%4],num:7});
    s.players.forEach(q=>q.hand=Array.from({length:n},c));s.deck=Array.from({length:50},c);s.discard=[c()];
    if(actions){s.players[0].hand=[{id:99001,type:'wild6',color:null},c()];s.lastPenalty={id:1,type:'wild4',challengeable:true};s.unoWindow={id:1};}
    PanelinhaTableBridge.render();
   },{n,penalty,actions,name});
  }
  async function metrics(){return p.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
   const hand=[...document.querySelectorAll('#hand>button>.card')].map(rect),identity=rect(document.getElementById('localIdentity'));
   const inside=r=>r.x>=-.5&&r.y>=-.5&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5;
   const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
   const avatars=[...document.querySelectorAll('.seat .pan-avatar,#localIdentity>.pan-avatar')].map(rect),buttons=[...document.querySelectorAll('#controls>.btn')].map(rect),menu=rect(document.getElementById('tableMenuBtn')),flame=rect(document.querySelector('.flame-red'));
   const cards=[...document.querySelectorAll('#hand .card,#pile>.card,#discard .card')];
   const names=[...document.querySelectorAll('.opponent-name')].map(rect);
   return{size:[innerWidth,innerHeight],identity,firstCard:Math.min(...hand.map(r=>r.x)),handTop:Math.min(...hand.map(r=>r.y)),flameBottom:flame.y+flame.h*.91,
    insideHand:hand.every(inside),insideAvatars:avatars.every(inside),insideNames:names.every(inside),circle:avatars.every(r=>Math.abs(r.w-r.h)<.1),insideButtons:buttons.every(inside),identityClear:hand.every(r=>overlap(r,identity)<1),buttonsClear:buttons.every(r=>hand.every(c=>overlap(r,c)<1)&&avatars.every(a=>overlap(r,a)<1)&&overlap(r,identity)<1),menuClear:avatars.every(r=>overlap(r,menu)<1),ratio:cards.every(n=>Math.abs(n.offsetWidth/n.offsetHeight-520/850)<.02),scroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,tableScroll:document.getElementById('table').scrollTop};
  });}
  const results=[];
  for(const [width,height]of[[568,320],[667,375],[740,360],[844,390],[915,412],[1000,360],[1024,600],[1280,800],[1366,768]]){
   await p.setViewportSize({width,height});
   for(const n of [7,20,40])for(const penalty of [0,20]){
    await fixture(n,penalty);const data=await metrics();results.push({n,penalty,...data});
    for(const key of ['insideHand','insideAvatars','insideNames','circle','insideButtons','identityClear','buttonsClear','menuClear','ratio'])assert.equal(data[key],true,`${width}×${height}/${n}/+${penalty}: ${key} ${JSON.stringify(data)}`);
    assert.ok(data.identity.right+3<data.firstCard,JSON.stringify(data));assert.ok(data.handTop>=data.flameBottom+2,`mão toca o envelope visível da chama: ${JSON.stringify(data)}`);
    assert.equal(data.scroll,false);assert.equal(data.tableScroll,0);
    if(n===20&&penalty===20)await p.screenshot({path:out+`/mesa-${width}.png`});
   }
   await fixture(2,4,true,'Nome muito comprido para conferir a identificação local');const data=await metrics();
   assert.equal(await p.locator('#controls>.btn').count(),3);assert.ok(data.buttonsClear&&data.menuClear&&data.insideButtons&&data.identityClear,JSON.stringify(data));
   assert.equal(await p.locator('.local-player-name').getAttribute('title'),'Nome muito comprido para conferir a identificação local');
   if(width===568||width===844)await p.screenshot({path:out+`/acoes-${width}.png`});
   await fixture(40,20);await p.locator('#hand>button').first().focus();await p.keyboard.press('ArrowRight');
   const expanded=await metrics();assert.ok(expanded.handTop>=expanded.flameBottom+2,`grupo expandido/foco toca a chama: ${JSON.stringify(expanded)}`);
   assert.equal(await p.locator('#hand>button').count(),40);assert.equal(await p.locator('#hand').getAttribute('data-pointer'),'keyboard');
  }
  fs.writeFileSync(out+'/geometria.json',JSON.stringify(results,null,2));
  console.log('PASS 54 layouts celular/tablet/desktop: mãos com 7/20/40 cartas, fogo normal/+20, proporções, recorte circular, identidade à esquerda e ausência de rolagem/contato com chama');
  console.log('PASS nove layouts com três ações simultâneas e nome longo; leque de 40 expandido/foco por teclado: botões/avatares contidos e cartas sem contato com o fogo');
  for(const [width,height]of[[568,320],[740,360],[844,390],[1000,360]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>document.getElementById('table').style.setProperty('--table-safe-bottom','24px'));
   await fixture(40,20);await p.locator('#hand>button').first().focus();await p.keyboard.press('ArrowRight');
   const safe=await metrics();assert.ok(safe.handTop>=safe.flameBottom+2&&safe.identity.bottom<=height-24+.5,JSON.stringify(safe));
   await p.evaluate(()=>document.getElementById('table').style.removeProperty('--table-safe-bottom'));
  }
  console.log('PASS reserva inferior simulada de 24px em quatro celulares: aplicada uma vez, identidade segura e mão expandida afastada da chama');
  await p.setViewportSize({width:844,height:390});await p.emulateMedia({reducedMotion:'no-preference'});await fixture(7);
  await p.evaluate(()=>CartasTest.getState().deck.push({id:99999,type:'wild',color:null}));await p.locator('#buyBtn').tap();await p.locator('.draw-choice').waitFor();await p.locator('.draw-choice-actions .alt').tap();await p.waitForTimeout(600);
  assert.equal(await p.locator('.local-player-count').textContent(),'8 cartas');assert.equal(await p.locator('#hand>button').count(),8);assert.equal(await p.locator('.drawing-card').count(),0);
  await p.evaluate(()=>{const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.current=0;s.unlockAt=0;s.presentationUntil=0;s.playUntil=0;s.cutOpen=false;s.lastNormalPurchase=null;PanelinhaTableBridge.render();});
  const card=p.locator('#hand>[data-rule-disabled=false]').first();const id=+(await card.getAttribute('data-card'));await card.evaluate(n=>n.click());
  // Coringa pode pedir cor; a identificação e o contador acompanham a jogada real.
  if(await p.locator('.color-picker').count())await p.locator('[data-color=red]').tap();await p.waitForFunction(()=>!PanelasMesa.playing());
  assert.equal(await p.evaluate(id=>CartasTest.getState().discard.some(c=>c.id===id),id),true);
  assert.equal(await p.locator('.local-player-count').textContent(),'7 cartas');
  assert.deepEqual(errors,[]);console.log('PASS compra/Guardar e descarte com animações reais: contadores corretos, cartas chegam ao leque e um toque joga; sem erros JS');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
