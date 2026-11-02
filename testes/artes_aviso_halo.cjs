const {chromium}=require('playwright');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/artes-aviso-halo-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:4});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const fixture=async({duo=false,cut=false,unannounced=false,noPlay=false}={})=>p.evaluate(({duo,cut,unannounced,noPlay})=>{
  const s=CartasTest.getState();PanelinhaAnnouncements.round(s);s.round++;
  Object.assign(s,{phase:'playing',current:0,unlockAt:0,cutOpen:false,pendingAction:null,drawn:null,penalty:0,highest:0,lastPenalty:null,finisher:null,lastActor:null,deadline:0,activeColor:'blue',direction:1,preUno:false,unoWindow:null,token:s.token+1});
  Object.assign(s.o,{duo,cut,single:true,timeout:0,infinite:false,challenge:true,wild6:true});s.identity={...s.identity,name:'Chef Ana'};
  s.players.forEach((player,i)=>player.hand=[{id:960000+i*100,type:'num',color:'blue',num:i?3:2},{id:960001+i*100,type:'num',color:'green',num:7}]);
  if(noPlay)s.players[0].hand=[{id:960000,type:'num',color:'red',num:3}];
  s.deck=Array.from({length:80},(_,i)=>({id:970000+i,type:'num',color:'red',num:4}));s.discard=[{id:980000,type:'num',color:'blue',num:9}];
  window.__lastCardEvents=[];window.__randomCalls=0;Math.random=()=>{window.__randomCalls++;return unannounced?.99:0};document.getElementById('useCardArt').onchange();
 },{duo,cut,unannounced,noPlay});
 const events=()=>p.evaluate(()=>window.__lastCardEvents);
 const notice=p.locator('#lastCardNotice');
 const endNotice=async ms=>{await p.clock.runFor(ms);await notice.evaluate(e=>e.getAnimations().forEach(a=>a.finish()));await p.waitForTimeout(30)};
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  await p.evaluate(()=>{window.__originalRandom=Math.random;document.addEventListener('panelinha:ultima-carta',e=>window.__lastCardEvents.push(e.detail))});
  await fixture();await p.locator('#unoBtn').tap();let e=await events();assert.equal(e.length,1);assert.equal(e[0].playerName,'Chef Ana');assert.equal(e[0].stage,'preemptive');assert.equal(await p.evaluate(()=>window.__randomCalls),0);
  assert.match(await notice.textContent(),/ÚLTIMA CARTA!Chef Ana anunciou sua última carta!/);assert.equal(await notice.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  assert.equal(await p.locator('[data-card="960000"]').isEnabled(),true);await p.locator('[data-card="960000"]').tap();assert.equal((await events()).length,1,'descartar não repete o anúncio preventivo');
  await p.evaluate(()=>{const s=CartasTest.getState();s.token++;for(let i=0;i<5;i++)document.getElementById('useCardArt').onchange();document.dispatchEvent(new CustomEvent('panelinha:ultima-carta',{detail:window.__lastCardEvents[0]}));window.__lastCardEvents.pop()});
  assert.equal((await events()).length,1);assert.equal(await notice.getAttribute('data-event-id'),e[0].id);
  await p.screenshot({path:path.join(out,'ultima-carta-humano.png'),scale:'css'});
  await p.clock.runFor(2999);assert.ok(await notice.isVisible());await endNotice(1);await notice.waitFor({state:'hidden'});
  console.log('PASS humano preventivo real, nome correto, RNG/bot inalterado, sem repetição por descarte/render/replay; 3s de leitura, saída e interação livre');
  await fixture({cut:true});await p.locator('[data-card="960000"]').tap();assert.equal((await events()).length,0);assert.ok(await notice.isHidden());
  await p.locator('#unoBtn').tap();assert.equal((await events()).length,1);assert.equal((await events())[0].stage,'after-play');assert.equal(await p.evaluate(()=>CartasTest.getState().unoWindow),null);
  const lastId=(await events())[0].id;await fixture();await p.locator('#unoBtn').tap();assert.notEqual((await events())[0].id,lastId);
  console.log('PASS anúncio tardio conserva a janela original e novo anúncio legítimo recebe ID novo; só ter uma carta não notifica');
  for(const duo of [false,true]){
   await fixture({duo});await p.locator('#unoBtn').tap();await p.locator('[data-card="960000"]').tap();await p.clock.runFor(2200);
   const all=await events();assert.deepEqual(all.map(e=>e.playerId),[0,1,2,3]);assert.deepEqual(all.map(e=>e.playerName),['Chef Ana','Bot 1','Bot 2','Bot 3']);assert.equal(new Set(all.map(e=>e.id)).size,4);assert.ok(all.every(e=>!('hand'in e)&&!('cards'in e)));
   assert.equal(await p.evaluate(()=>CartasTest.getState().players.every(p=>p.hand.length===1)),true);
   await notice.evaluate(e=>e.getAnimations().forEach(a=>a.finish()));await p.screenshot({path:path.join(out,`ultima-carta-${duo?'duplas':'individual'}.png`),scale:'css'});
   assert.equal(await notice.getAttribute('data-event-id'),all[0].id);
   await endNotice(800);await p.waitForFunction(id=>document.getElementById('lastCardNotice').dataset.eventId===id,all[1].id);
   for(let i=1;i<4;i++){assert.ok((await notice.textContent()).includes(all[i].playerName));await endNotice(3000);if(i<3)await p.waitForFunction(id=>document.getElementById('lastCardNotice').dataset.eventId===id,all[i+1].id);}
   await notice.waitFor({state:'hidden'});await p.evaluate(()=>document.getElementById('useCardArt').onchange());assert.equal((await events()).length,4);
  }
  console.log('PASS quatro participantes reais, três bots anunciando pelo motor, Individual/Duplas, parceiro/adversários, fila legível sem pausar turnos; evento público sem cartas secretas');
  await fixture({unannounced:true});await p.locator('[data-card="960000"]').tap();await p.clock.runFor(2200);assert.equal((await events()).length,0);assert.ok(await notice.isHidden());
  await fixture();await p.locator('#unoBtn').tap();await p.evaluate(()=>CartasTest.newRound());assert.ok(await notice.isHidden());
  await p.context().setOffline(true);await fixture();await p.locator('#unoBtn').tap();assert.ok(await notice.isVisible());
  for(const [width,height] of [[568,320],[844,390],[1280,800]]){await p.setViewportSize({width,height});const bounds=await notice.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,pointer:getComputedStyle(e).pointerEvents}});assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width&&bounds.bottom<=height&&bounds.pointer==='none',JSON.stringify({width,height,bounds}));}
  await p.context().setOffline(false);await p.emulateMedia({reducedMotion:'reduce'});await fixture();await p.locator('#unoBtn').tap();assert.equal(await notice.evaluate(e=>e.getAnimations().length),0);await p.emulateMedia({reducedMotion:'no-preference'});
  console.log('PASS ausência de falso aviso para bots sem anúncio, limpeza na nova rodada, offline, redução de movimento e três layouts sem bloquear toques');
  // Comparação de pixels com a versão anterior, no MESMO DOM/escala/estado de compra.
  await p.setViewportSize({width:844,height:390});await fixture({noPlay:true});await p.evaluate(()=>{const s=CartasTest.getState();s.penalty=20;s.highest=6;document.getElementById('useCardArt').onchange()});
  const pose=await p.evaluate(()=>{const a=document.getElementById('pileAura'),r=a.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],viewBox:a.getAttribute('viewBox'),morph:[...a.querySelectorAll('feMorphology')].map(e=>e.getAttribute('radius')),blur:a.querySelector('feGaussianBlur').getAttribute('stdDeviation'),images:[...a.querySelectorAll('image')].map(i=>['x','y','width','height'].map(a=>i.getAttribute(a)))}});
  assert.deepEqual(pose,JSON.parse(fs.readFileSync(path.join(__dirname,'evidencias-artes-aviso-halo/halo-antes-geometria.json'))));
  await p.screenshot({path:path.join(out,'halo-reforcado-mesa.png'),scale:'css'});
  const style=await p.addStyleTag({content:'html,body{background:transparent!important}body *{visibility:hidden!important}#pileAura,#pileAura *{visibility:visible!important}'});
  const box=await p.locator('#pileAura').boundingBox(),clip={x:Math.floor(box.x),y:Math.floor(box.y),width:Math.ceil(box.x+box.width)-Math.floor(box.x),height:Math.ceil(box.y+box.height)-Math.floor(box.y)};
  await p.locator('#pileAura').evaluate(e=>{const a=e.getAnimations()[0];a.pause();a.currentTime=550});const after=await p.screenshot({path:path.join(out,'halo-depois.png'),clip,omitBackground:true});
  const before=fs.readFileSync(path.join(__dirname,'evidencias-artes-aviso-halo/halo-antes.png'));
  const light=await p.evaluate(async({before,after})=>{
   const measure=async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let energy=0;for(let i=0;i<a.length;i+=4)energy+=(.2126*a[i]+.7152*a[i+1]+.0722*a[i+2])*a[i+3]/255;return energy};
   const a=await measure(before),b=await measure(after);return {before:a,after:b,ratio:b/a};
  },{before:before.toString('base64'),after:after.toString('base64')});assert.ok(light.ratio>1.3,JSON.stringify(light));fs.writeFileSync(path.join(out,'halo-luminosidade.json'),JSON.stringify(light,null,2));await style.evaluate(e=>e.remove());
  console.log('PASS halo com geometria pixel a pixel preservada, mesmos seis retângulos/raios/desfoque; luminosidade integrada '+light.ratio.toFixed(2)+'× a anterior');
  await p.evaluate(()=>Math.random=window.__originalRandom);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
