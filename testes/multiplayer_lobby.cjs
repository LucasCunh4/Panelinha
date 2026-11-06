const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const server=process.env.PANELINHA_TEST_SERVER||'http://127.0.0.1:8787';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/multiplayer-evidence';
const launch={executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],...(process.env.PANELAS_BROWSER_PROXY?{proxy:{server:process.env.PANELAS_BROWSER_PROXY,bypass:'localhost,127.0.0.1'}}:{})};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch(launch);
 const secondBrowser=await chromium.launch(launch);
 const pages=[],errors=[],external=[],frames=[];
 async function page(){
  const context=await (pages.length%2?secondBrowser:browser).newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await context.addInitScript(({server,base})=>{window.PanelinhaServerConfig={serverUrl:server,inviteBaseUrl:base};},{server,base});
  const p=await context.newPage();if(base.startsWith('https:')){p.setDefaultTimeout(60000);p.setDefaultNavigationTimeout(90000);}pages.push(p);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith(server)&&!r.url().startsWith('data:'))external.push(r.url());});p.on('websocket',ws=>ws.on('framereceived',e=>frames.push(e.payload)));return p;
 }
 const lobby=p=>p.waitForFunction(()=>PanelinhaNavigation.current==='lobby'&&PanelinhaLobbyConnection.current.status==='connected');
 const data=p=>p.evaluate(()=>PanelinhaLobbyConnection.current);
 const count=async(p,n)=>p.waitForFunction(n=>PanelinhaLobbyConnection.current.state?.players.filter(Boolean).length===n,n);
 async function normalJoin(p,code){await p.goto(base);await p.locator('#multiplayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#joinRoomBtn').tap();await p.locator('#roomCode').fill(code);await p.locator('#joinLobbyBtn').tap();}
 try{
  const a=await page();await a.goto(base);await a.locator('#multiplayerBtn').tap();await a.locator('#playerName').fill('Chef Ana');await a.locator('#profileContinueBtn').tap();await a.locator('#createRoomBtn').tap();await a.locator('#createLobbyBtn').tap();await lobby(a);
  const code=await a.locator('#lobbyCode').textContent();assert.match(code,/^\d{6}$/);
  const originalId=(await data(a)).selfId;
  const b=await page();await b.goto(base+'?sala='+code);assert.equal(await b.locator('#roomCode').inputValue(),code);assert.equal(await b.evaluate(()=>PanelinhaNavigation.current),'profile');await b.locator('#playerName').fill('Chef Ana');await b.locator('#profileContinueBtn').tap();assert.equal(await b.evaluate(()=>PanelinhaNavigation.current),'join');await b.locator('#joinLobbyBtn').tap();await lobby(b);
  const c=await page();await normalJoin(c,code);await lobby(c);const d=await page();await normalJoin(d,code);await lobby(d);await count(a,4);
  assert.equal(new Set(await Promise.all([a,b,c,d].map(async p=>(await data(p)).selfId))).size,4);
  const tokens=await Promise.all([a,b,c,d].map(p=>p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('panelinha.multiplayer.identities.v1')))[0])));assert.equal(new Set(tokens).size,4);
  assert.ok(frames.every(frame=>tokens.every(token=>!String(frame).includes(token))));assert.ok(await a.locator('#lobbyStartBtn').isDisabled());assert.ok((await data(a)).state.players.slice(0,2).every(p=>p.name==='Chef Ana'));
  console.log('PASS quatro sessões independentes no mesmo Worker '+(server.startsWith('https:')?'público via HTTPS/WSS':'local')+', criação/convite/código, nomes repetidos, quatro IDs/tokens e nenhum token privado nos snapshots');
  const fifth=await page();await normalJoin(fifth,code);await fifth.waitForFunction(()=>/quatro jogadores/.test(document.getElementById('joinLobbyError').textContent));assert.equal(await fifth.evaluate(()=>PanelinhaNavigation.current),'join');await count(a,4);
  await a.evaluate(()=>{window.__readySounds=0;document.addEventListener('panelinha:sfx',e=>{if(e.detail.key==='ready')window.__readySounds++;});});
  for(const p of [a,b,c,d]){await p.locator('#lobbyReadyBtn').tap();await p.waitForFunction(()=>{const v=PanelinhaLobbyConnection.current;return v.state.players.find(p=>p.id===v.selfId).ready;});}
  await a.waitForFunction(()=>window.__readySounds===4);
  await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.allReady);assert.ok(await a.locator('#lobbyStartBtn').isDisabled());assert.equal(await a.evaluate(()=>CartasTest.getState()),null);
  await a.locator('#lobbyProfileBtn').tap();await a.locator('#lobbyProfileName').fill('Chef <b>Aurora</b>');await a.locator('[data-lobby-avatar=panela-dj]').tap();await a.locator('#lobbyDialogConfirm').tap();await a.locator('#lobbyDialog').waitFor({state:'hidden'});
  await b.waitForFunction(()=>PanelinhaLobbyConnection.current.state.players.some(p=>p.name==='Chef <b>Aurora</b>'&&p.avatar==='panela-dj'&&p.ready));assert.equal(await a.evaluate(()=>PanelinhaProfile.current.name),'Chef <b>Aurora</b>');assert.equal(await b.locator('.lobby-player-name b').count(),0);
  console.log('PASS quinto humano rejeitado, Pronto dos quatro, perfil/nome/avatar atualizados sem desmarcar, início online indisponível e motor offline não iniciado');
  const offlineBefore=await a.evaluate(()=>Object.fromEntries(['mode','duration','goal','timeout','infinite','cut','challenge','wild6','dist','rotate'].map(id=>{const e=document.getElementById(id);return [id,e.type==='checkbox'?e.checked:e.value];})));
  await a.locator('#lobbyRulesBtn').tap();await a.locator('[data-select-for=mpRule-mode]').tap();await a.locator('#panelinhaSelectList [data-value=duo]').tap();await a.locator('#lobbyDialogConfirm').tap();await a.locator('#lobbyDialog').waitFor({state:'hidden'});
  await b.waitForFunction(()=>PanelinhaLobbyConnection.current.state.rules.duo&&PanelinhaLobbyConnection.current.state.players.every(p=>!p.ready));
  assert.deepEqual(await a.evaluate(()=>Object.fromEntries(['mode','duration','goal','timeout','infinite','cut','challenge','wild6','dist','rotate'].map(id=>{const e=document.getElementById(id);return [id,e.type==='checkbox'?e.checked:e.value];}))),offlineBefore);
  const dId=(await data(d)).selfId;await a.locator(`[data-player-id="${dId}"] .lobby-moderate`).tap();await a.locator('#lobbyDialogConfirm').tap();await d.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');await count(a,3);
  await d.locator('#joinRoomBtn').tap();await d.locator('#roomCode').fill(code);await d.locator('#joinLobbyBtn').tap();await d.waitForFunction(()=>/removida/.test(document.getElementById('joinLobbyError').textContent));
  await a.locator('.lobby-player.is-empty .lobby-moderate').tap();await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.players.some(p=>p?.bot&&p.ready));
  await fifth.locator('#joinLobbyBtn').tap();await lobby(fifth);await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.players.every(p=>p&&!p.bot));
  console.log('PASS regras com selects próprios do jogo e reset de todos os humanos, opções offline intactas, expulsão/bloqueio, bot pronto e substituição automática por humano');
  await a.evaluate(()=>{window.__shared=null;Object.defineProperty(navigator,'share',{configurable:true,value:async value=>window.__shared=value});});await a.locator('#shareRoomLink').tap();const shared=await a.evaluate(()=>window.__shared);assert.equal(new URL(shared.url).searchParams.get('sala'),code);assert.equal(new URL(shared.url).origin,new URL(base).origin);assert.ok(tokens.every(t=>!shared.url.includes(t)));
  for(const [width,height]of[[568,320],[844,390],[1280,800]]){
   await a.setViewportSize({width,height});await a.waitForTimeout(70);
   const shape=await a.evaluate(()=>{const inside=e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;},region=document.getElementById('lobbyPlayers').getBoundingClientRect(),name=document.querySelector('.lobby-player-name').getBoundingClientRect();return {scroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,code:inside(document.getElementById('lobbyCode')),actions:[...document.querySelectorAll('.lobby-actions button')].filter(b=>!b.hidden).every(inside),cards:region.height>70,name:name.top>=region.top&&name.bottom<=region.bottom};});assert.ok(shape.scroll&&shape.code&&shape.actions&&shape.cards&&shape.name,JSON.stringify({width,height,shape}));await a.screenshot({path:path.join(out,`lobby-${width}x${height}.png`)});
  }
  await a.setViewportSize({width:844,height:390});await a.locator('#lobbyRulesBtn').tap();await a.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.ok(await a.locator('#lobbyDialog').isHidden());assert.equal(await a.evaluate(()=>PanelinhaNavigation.current),'lobby');
  await a.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.ok(await a.locator('#lobbyDialog').isVisible());await a.locator('#lobbyDialogCancel').tap();assert.equal((await data(a)).selfId,originalId);
  await a.evaluate(()=>PanelinhaNavigation.back({native:true}));await a.locator('#lobbyDialogConfirm').tap();await a.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');await count(b,3);
  const connected=[b,c,fifth];await b.waitForFunction(old=>PanelinhaLobbyConnection.current.state.hostId!==old,originalId);const newHostId=(await data(b)).state.hostId;assert.ok((await Promise.all(connected.map(async p=>(await data(p)).selfId))).includes(newHostId));
  await a.locator('#joinRoomBtn').tap();await a.locator('#roomCode').fill(code);await a.locator('#joinLobbyBtn').tap();await lobby(a);assert.equal((await data(a)).selfId,originalId);assert.equal((await data(a)).state.hostId,newHostId);assert.equal((await data(a)).state.players.find(p=>p.id===originalId).ready,false);
  const hostPage=(await Promise.all([a,b,c,fifth].map(async p=>({p,id:(await data(p)).selfId})))).find(v=>v.id===newHostId).p;
  await hostPage.locator('#lobbyCloseBtn').tap();await hostPage.locator('#lobbyDialogConfirm').tap();for(const p of [a,b,c,fifth])await p.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');
  console.log('PASS convite sem token, três landscapes, retorno/confirmar/cancelar, saída libera vaga, sucessor entre humanos, retorno por token sem recuperar cargo e encerramento para todos');
  const offline=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await offline.addInitScript(()=>window.PanelinhaServerConfig={serverUrl:''});const p=await offline.newPage();await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().players.length),4);assert.equal(await p.evaluate(()=>PanelinhaLobbyConnection.configured),false);await offline.setOffline(true);await p.locator('#tableMenuBtn').tap();assert.ok(await p.locator('#tableMenu').isVisible());await offline.close();
  const bad=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await bad.addInitScript(()=>window.PanelinhaServerConfig={serverUrl:'http://127.0.0.1:61234'});const failure=await bad.newPage();await failure.goto(base);await failure.locator('#multiplayerBtn').tap();await failure.locator('#profileContinueBtn').tap();await failure.locator('#createRoomBtn').tap();await failure.locator('#createLobbyBtn').tap();await failure.waitForFunction(()=>/Não foi possível/.test(document.getElementById('createLobbyError').textContent));assert.equal(await failure.evaluate(()=>PanelinhaNavigation.current),'create');assert.equal(await failure.evaluate(()=>CartasTest.getState()),null);await bad.close();
  const cancelled=await page();let resume,arrived;const gate=new Promise(r=>resume=r),seen=new Promise(r=>arrived=r);
  await cancelled.route(server+'/v1/rooms',async route=>{arrived();await gate;await route.continue();});
  await cancelled.goto(base);await cancelled.locator('#multiplayerBtn').tap();await cancelled.locator('#profileContinueBtn').tap();await cancelled.locator('#createRoomBtn').tap();await cancelled.locator('#createLobbyBtn').tap();await seen;
  await cancelled.evaluate(()=>PanelinhaNavigation.back({native:true}));await cancelled.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');resume();
  await cancelled.waitForFunction(()=>!document.getElementById('createLobbyBtn').disabled);assert.equal(await cancelled.evaluate(()=>PanelinhaNavigation.current),'multiplayer');assert.equal((await data(cancelled)).state,null);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS modo offline sem servidor, três bots/laboratório disponíveis, falha de conexão explícita sem lobby falso, retorno durante conexão cancela entrada e nenhum erro JS ou dependência externa inesperada');
 }finally{await Promise.all([browser.close(),secondBrowser.close()]);}
})().catch(e=>{console.error(e);process.exitCode=1;});
