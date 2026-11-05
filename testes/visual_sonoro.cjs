const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/integracao-visual-sonora/testes';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS/documentacao/MANIFESTO_VISUAL_SONORO.json')));
 assert.equal(manifest.packages.length,4);assert.ok(manifest.packages.every(p=>p.crc==='OK'));assert.equal(manifest.assets.length,69);
 for(const e of manifest.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS',e.path))).digest('hex'),e.sha256);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url());});
 const settle=()=>p.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
 try{
  await p.goto(base);await p.waitForFunction(()=>[...document.querySelectorAll('#frontScene img,#homeTitle img,#avatarGallery img')].every(im=>im.complete&&im.naturalWidth>0));await settle();
  assert.equal(await p.locator('#frontScene .kitchen-art').count(),0);assert.equal(await p.locator('#home button').count(),2);
  assert.deepEqual(await p.locator('.title-letter').evaluateAll(es=>es.map(e=>e.dataset.letter)),Array.from('PANELINHA'));
  assert.deepEqual(await p.locator('.title-letter-art').evaluateAll(es=>es.map(e=>e.src.split('/').at(-1))),Array.from('PANELINHA',(l,i)=>String(i+1).padStart(2,'0')+'_'+l+'.png'));
  assert.equal(await p.locator('.title-lid').count(),1);assert.equal(await p.locator('.title-sparkle').count(),5);assert.equal(await p.locator('.menu-vapor').count(),6);
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800],[1920,1080]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await settle();
   const geometry=await p.evaluate(()=>{
    const plane=document.querySelector('.menu-art-plane').getBoundingClientRect();
    const inside=e=>{const r=e.getBoundingClientRect();return r.left>=-.1&&r.top>=-.1&&r.right<=innerWidth+.1&&r.bottom<=innerHeight+.1;};
    return {ratio:plane.width/plane.height,inside:inside(document.querySelector('.menu-approved-background')),
     buttons:[...document.querySelectorAll('#home button')].every(e=>{const r=e.getBoundingClientRect();return inside(e)&&r.height>=48&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),
     anchors:[...document.querySelectorAll('.menu-tool-anchor')].map(e=>{const r=e.getBoundingClientRect();return [(r.x+r.width/2-plane.x)/plane.width*100,(r.y-plane.y)/plane.height*100];}),
     pots:[...document.querySelectorAll('.menu-steam-emitter')].map(e=>{const r=e.getBoundingClientRect();return [(r.x+r.width/2-plane.x)/plane.width*100,(r.bottom-plane.y)/plane.height*100];}),
     scroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight};
   });
   assert.ok(geometry.inside&&geometry.buttons&&geometry.scroll,JSON.stringify({width,height,geometry}));assert.ok(Math.abs(geometry.ratio-1672/941)<.001);
   [69.258,73.385,77.153,81.041,84.988,88.876].forEach((x,i)=>{assert.ok(Math.abs(geometry.anchors[i][0]-x)<.02);assert.ok(Math.abs(geometry.anchors[i][1]-30.287)<.02);});
   assert.ok(Math.abs(geometry.pots[0][0]-80.7)<.02&&Math.abs(geometry.pots[1][0]-93.6)<.02);
   if([568,844,1920].includes(width))await p.screenshot({path:path.join(out,`menu-${width}x${height}.png`)});
  }
  console.log('PASS 69 assets íntegros; cozinha contain, nove letras na ordem, tampa, cinco brilhos, seis utensílios ancorados e seis plumas nas duas panelas, em seis landscapes');
  await p.setViewportSize({width:844,height:390});await p.locator('#singlePlayerBtn').tap();await p.waitForFunction(()=>PanelinhaSFX.status.unlocked);
  assert.equal(await p.locator('#avatarGallery button').count(),9);
  for(const id of ['frigideira-chef','leiteira-bigode','panela-pressao','panela-dj','wok-monoculo','panela-aventureira','panela-gamer','panela-piloto','panela-escoteira']){
   await p.locator(`[data-avatar-choice="${id}"]`).tap();assert.equal(await p.locator('#profilePreviewAvatar .official-avatar').getAttribute('data-avatar'),id);assert.equal(await p.locator(`[data-avatar-choice="${id}"]`).getAttribute('aria-pressed'),'true');
  }
  await p.locator('#playerName').fill('Chef Oficial');await p.locator('#profileContinueBtn').tap();
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('panelinha.player.v1'))),{name:'Chef Oficial',avatar:'panela-escoteira'});
  await p.reload();assert.equal(await p.evaluate(()=>PanelinhaProfile.current.avatar),'panela-escoteira');
  for(const [old,id] of Object.entries({chef:'frigideira-chef',frigideira:'frigideira-chef',panela:'panela-pressao',chaleira:'leiteira-bigode',concha:'panela-aventureira',estrela:'panela-piloto',desconhecido:'frigideira-chef'})){
   await p.evaluate(old=>{localStorage.setItem('panelinha.player.v1',JSON.stringify({name:'Nome preservado',avatar:old,extra:'preservado'}));localStorage.setItem('outro-dado','sentinela');},old);await p.reload();
   assert.deepEqual(await p.evaluate(()=>PanelinhaProfile.current),{name:'Nome preservado',avatar:id});
   assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('panelinha.player.v1')).extra),'preservado');assert.equal(await p.evaluate(()=>localStorage.getItem('outro-dado')),'sentinela');
  }
  for(const [width,height] of [[568,320],[844,390],[1280,800]]){
   await p.setViewportSize({width,height});await p.locator('#singlePlayerBtn').tap();await settle();
   assert.ok(await p.locator('#profile button,#playerName').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.height>=44&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})));
   if(width===844)await p.screenshot({path:path.join(out,'perfil-nove-avatares.png')});await p.locator('#profile [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='home');
  }
  console.log('PASS seleção dos nove avatares, persistência, migração dos seis IDs antigos/fallback, nomes e outros dados preservados; perfil acessível em três landscapes');
  await p.setViewportSize({width:844,height:390});await p.locator('#soundSettings summary').tap();await p.waitForFunction(()=>PanelinhaSFX.status.unlocked);
  await p.locator('#soundVolume-menu').fill('35');await p.locator('#soundSettings [data-sfx-mute]').check();
  assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('panelinha.sfx.v1'))),{volume:.35,muted:true});await p.reload();assert.equal(await p.evaluate(()=>PanelinhaSFX.status.muted),true);assert.equal(await p.evaluate(()=>PanelinhaSFX.status.volume),.35);
  await p.locator('#soundSettings summary').tap();await p.locator('#soundSettings [data-sfx-mute]').uncheck();await p.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.equal(await p.locator('#soundSettings').getAttribute('open'),null);
  // Decodifica todos os MP3 reais com WebAudio, incluindo a demo que NÃO será disparada no jogo.
  const decoded=await p.evaluate(async files=>{const c=new AudioContext(),result=[];for(const file of files){const r=await fetch(file);if(!r.ok)throw Error(file);const b=await c.decodeAudioData(await r.arrayBuffer());result.push(b.duration);}await c.close();return result;},manifest.assets.filter(e=>e.path.endsWith('.mp3')).map(e=>e.path));assert.equal(decoded.length,30);assert.ok(decoded.every(n=>n>0));
  console.log('PASS desbloqueio por toque, 30 MP3 reais decodificados com WebAudio, controle de volume/silêncio persistente e Voltar recolhendo som');
  await p.clock.install();await p.clock.pauseAt(new Date());await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();
  await p.evaluate(()=>{window.__sfx=[];window.__events=[];document.addEventListener('panelinha:sfx',e=>window.__sfx.push(e.detail));const original=PanelinhaSFX.event;PanelinhaSFX.event=(type,data)=>{window.__events.push({type,...data});return original(type,data);};});
  await p.locator('#startBtn').tap();await p.clock.runFor(420);await p.waitForFunction(()=>['shuffle','deal','start'].every(key=>window.__sfx.some(e=>e.key===key)));
  let serial=0;
  const fixture=async(type='num',options={})=>p.evaluate(({type,options,id})=>{
   PanelinhaSFX.stopAll();const s=CartasTest.getState();PanelinhaAnnouncements.round(s);s.round++;s.token++;
   Object.assign(s,{phase:'playing',current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,pendingAction:null,cutOpen:false,lastActor:null,activeColor:'red',direction:1,deadline:0,unoWindow:null,preUno:false});Object.assign(s.o,{timeout:0,cut:true,duo:false,single:true,infinite:false});
   const make=(id,type='num',color='red',num=7)=>({id,type,color,num});s.players.forEach((p,i)=>p.hand=Array.from({length:5},(_,j)=>make(id+100+i*10+j,'num','blue',j)));
   s.players[0].hand=[make(id,type,['num','draw2','skip','reverse'].includes(type)?'red':null),make(id+1,'num','green',1),make(id+2,'num','blue',3)];s.discard=[make(id+90,'num','red',9)];s.deck=Array.from({length:80},(_,j)=>make(id+1000+j,'num','yellow',j%10));Object.assign(s,options);window.__sfx=[];window.__events=[];document.getElementById('useCardArt').onchange();
  },{type,options,id:800000+(++serial)*3000});
  const waitSound=key=>p.waitForFunction(key=>window.__sfx.some(e=>e.key===key),key,{timeout:15000});
  for(const type of ['num','draw2','wild4','wild6','skip','reverse','wild','dist','rotate']){
   await fixture(type);const id=await p.evaluate(()=>CartasTest.getState().players[0].hand[0].id);await p.locator(`[data-card="${id}"]`).tap();
   if(['wild','wild4','wild6'].includes(type)){await p.locator('[data-color=blue]').tap();await waitSound('color');assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');}
   else assert.equal(await p.locator('.color-picker').count(),0);
   const key=type==='num'?'play':type;await waitSound(key);
   assert.equal(await p.evaluate(()=>window.__events.filter(e=>e.type==='card-played').length),1);if(type!=='num')assert.equal(await p.evaluate(()=>window.__sfx.filter(e=>e.key==='play').length),0);
   const before=await p.evaluate(()=>window.__events.length);await p.evaluate(()=>{for(let i=0;i<5;i++)document.getElementById('useCardArt').onchange();});assert.equal(await p.evaluate(()=>window.__events.length),before);
   if(type==='dist'){assert.ok(await p.evaluate(()=>CartasTest.getState().lastDistribution.total>0));assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'red');}
   if(type==='rotate')assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'red');
  }
  console.log('PASS eventos reais de jogar/nove tipos, especiais sem som comum duplicado, Coringa/+4/+6 escolhendo cor, Panela redistribuindo e Liquidificador girando sem seletor; renderizações silenciosas');
  await fixture('num',{current:1,cutOpen:true,unlockAt:Date.now()+2200,lastActor:2});await p.evaluate(()=>{const s=CartasTest.getState();s.unlockAt=Date.now()+2200;s.discard[0].num=7;document.getElementById('useCardArt').onchange();});await p.locator('#cutBtn .cut-bubble').tap();await waitSound('cut');assert.equal(await p.evaluate(()=>window.__events.filter(e=>e.type==='card-played'&&e.cut).length),1);
  for(const amount of [2,4,6,8,12,20]){
   await fixture('num',{penalty:amount,highest:6});const total=await p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].length;});
   await p.locator('#buyBtn').tap();await waitSound(amount>=12?'penalty12':amount>=6?'penalty6':amount>=4?'penalty4':'penalty2');
   assert.equal(await p.evaluate(()=>CartasTest.getState().penalty),0);assert.equal(await p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].length;}),total);assert.ok(await p.evaluate(()=>PanelinhaSFX.status.voices<=6));
  }
  await fixture();await p.locator('#buyBtn').tap();await waitSound('draw');
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand.pop();document.getElementById('useCardArt').onchange();});await p.locator('#unoBtn').tap();await waitSound('last');
  const before=await p.evaluate(()=>window.__sfx.filter(e=>e.key==='last').length);await p.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('useCardArt').onchange();});assert.equal(await p.evaluate(()=>window.__sfx.filter(e=>e.key==='last').length),before);
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.o.timeout=15;s.deadline=Date.now()+5000;for(let n=5;n>=1;n--){PanelasMesa.updateClock(s,s.deadline-n*1000);PanelasMesa.updateClock(s,s.deadline-n*1000);}});await waitSound('final');
  assert.equal(await p.evaluate(()=>window.__sfx.filter(e=>e.key==='final').length),1);assert.equal(await p.evaluate(()=>window.__sfx.filter(e=>e.key==='tick').length),4);
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand.length=1;document.getElementById('useCardArt').onchange();});await p.locator('#hand [data-card]').tap();await waitSound('win');
  console.log('PASS corte real, compra e penalidades 2/4/6/8/12/20 conservando cartas, fallback sonoro consistente, anúncio real sem repetição, relógio real sem tick duplicado e vitória');
  await fixture();await p.evaluate(()=>{
   const s=CartasTest.getState();s.o.cut=false;s.players.forEach((p,i)=>p.hand=[{id:990100+i*10,type:'num',color:'red',num:i?2:7},{id:990101+i*10,type:'num',color:'green',num:1}]);
   window.__savedRandom=Math.random;Math.random=()=>0;document.getElementById('useCardArt').onchange();
  });await p.locator('#unoBtn').tap();await p.locator('[data-card="990100"]').tap();await p.clock.runFor(2200);
  await p.waitForFunction(()=>window.__sfx.filter(e=>e.key==='last').length===4);await p.evaluate(()=>Math.random=window.__savedRandom);
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.o.cut=false;s.players[1].hand=[{id:990500,type:'num',color:'red',num:2}];document.getElementById('useCardArt').onchange();});
  await p.locator('#hand button:has(.card[data-card-type=num])').filter({has:p.locator('.red')}).first().tap();await p.clock.runFor(700);await waitSound('lose');
  await fixture();await p.locator('#tableMenuBtn').tap();await waitSound('open');await p.locator('#closeTableMenu').tap();await waitSound('close');
  assert.equal(await p.evaluate(()=>window.__sfx.some(e=>e.key==='ready')),false);
  console.log('PASS som do anúncio real dos três bots e humano, derrota real, abertura/fechamento de opções; nenhum evento Pronto fictício');
  // Offline após aquecer o cache: nenhuma URL externa, áudio já decodificado e seleção local.
  await p.context().setOffline(true);await fixture('dist');await p.locator('#hand button:has([data-card-type=dist])').tap();await waitSound('dist');assert.equal(await p.locator('.color-picker').count(),0);await p.context().setOffline(false);
  await p.evaluate(()=>PanelinhaSFX.setMuted(true));assert.equal(await p.evaluate(()=>PanelinhaSFX.status.voices),0);await p.evaluate(()=>PanelinhaSFX.event('card-played',{cardType:'wild6'}));await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>PanelinhaSFX.status.voices),0);
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{PanelinhaNavigation.requestLeave();document.getElementById('confirmLeaveBtn').click();PanelinhaNavigation.go('home');});
  assert.equal(await p.locator('#frontScene,#home').evaluateAll(es=>es.flatMap(e=>[e,...e.querySelectorAll('*')]).flatMap(e=>e.getAnimations()).length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(await p.evaluate(()=>PanelinhaSFX.status.errors),[]);
  console.log('PASS offline com som local carregado, silêncio cancela fontes, movimento reduzido, sem URL externa/erros JS ou áudio; nenhum lobby/Pronto inventado');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
