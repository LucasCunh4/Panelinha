// Teste explícito contra a publicação real. Usa salas temporárias e não injeta configuração.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const base=new URL(process.env.PANELINHA_PUBLIC_TEST_URL||'');assert.equal(base.protocol,'https:');assert.ok(!base.username&&!base.password&&!base.search&&!base.hash);
const out=process.env.PANELAS_SCREENSHOTS,errors=[],pages=[],contexts=[];
const launch={executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],...(process.env.PANELAS_BROWSER_PROXY?{proxy:{server:process.env.PANELAS_BROWSER_PROXY,bypass:'127.0.0.1,localhost'}}:{})};
const browsers=[await chromium.launch(launch),await chromium.launch(launch)];
const view=p=>p.evaluate(()=>PanelinhaLobbyConnection.current),all=async fn=>{for(const p of pages)await p.waitForFunction(fn);};
async function fresh(i){const c=await browsers[i%2].newContext({viewport:i===1?{width:1280,height:800}:{width:844,height:390},hasTouch:true,isMobile:true});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));pages.push(p);return p;}
try{
  const a=await fresh(0);await a.goto(base.href);assert.equal(await a.evaluate(()=>PanelinhaServerConfig.serverUrl),base.origin);assert.deepEqual(await a.evaluate(()=>fetch('/health').then(r=>r.json())),{v:1,phase:3,gameplay:true});
  await a.locator('#multiplayerBtn').tap();await a.locator('#playerName').fill('Teste continuidade 0');await a.locator('#profileContinueBtn').tap();await a.locator('#createRoomBtn').tap();await a.locator('#createLobbyBtn').tap();await a.waitForFunction(()=>PanelinhaNavigation.current==='lobby');const code=(await view(a)).state.code;
  for(let i=1;i<4;i++){const p=await fresh(i);await p.goto(base.origin+'/?sala='+code);await p.locator('#playerName').fill('Teste continuidade '+i);await p.locator('#profileContinueBtn').tap();await p.locator('#joinLobbyBtn').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='lobby');}
  for(const p of pages){await p.locator('#lobbyReadyBtn').tap();await p.waitForFunction(()=>{const v=PanelinhaLobbyConnection.current;return v.state.players.find(p=>p.id===v.selfId).ready;});}
  await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.canStart);await a.locator('#lobbyStartBtn').tap();await all(()=>PanelinhaNavigation.current==='game');await a.locator('#tableMenuBtn').tap();await a.locator('#onlinePauseToggle').tap();await all(()=>CartasTest.getState().paused);
  const before=await Promise.all(pages.map(view)),originalId=before[0].selfId,version=before[0].state.version;
  console.log('PASS quatro humanos na publicação HTTPS/WSS, início manual e pausa autoritativa; 70 segundos sem comandos');
  for(let i=0;i<2;i++)await a.waitForTimeout(35000);
  for(let i=0;i<4;i++){const now=await view(pages[i]);assert.equal(now.status,'connected');assert.equal(now.state.version,version);assert.equal(now.state.game.paused,true);assert.deepEqual(now.state.game.remaining,before[i].state.game.remaining);assert.deepEqual(now.state.game.players[now.state.game.self].hand,before[i].state.game.players[before[i].state.game.self].hand);}
  console.log('PASS pausa mantém conexões, cartas, versão e prazos após repouso; sem heartbeat');
  await a.close();await pages[1].waitForFunction(id=>PanelinhaLobbyConnection.current.state.hostId!==id,originalId);const hostId=(await view(pages[1])).state.hostId;
  const returned=await contexts[0].newPage();returned.setDefaultTimeout(60000);returned.on('pageerror',e=>errors.push(e.message));pages[0]=returned;await returned.goto(base.origin+'/?sala='+code);await returned.locator('#profileContinueBtn').tap();await returned.locator('#joinLobbyBtn').tap();await returned.waitForFunction(()=>PanelinhaNavigation.current==='game'&&PanelinhaLobbyConnection.current.status==='connected');
  const back=await view(returned);assert.equal(back.selfId,originalId);assert.equal(back.state.hostId,hostId);assert.equal(back.state.game.self,before[0].state.game.self);assert.deepEqual(back.state.game.players[back.state.game.self].hand,before[0].state.game.players[before[0].state.game.self].hand);assert.equal(back.state.game.paused,true);
  const host=pages[(await Promise.all(pages.map(view))).findIndex(v=>v.selfId===hostId)];assert.ok(host);await host.locator('#onlineResumeBtn').tap();await all(()=>CartasTest.getState().resumeAt>0);assert.ok(['3','2','1'].includes(await returned.locator('#onlineCountdown').textContent()));await all(()=>!CartasTest.getState().paused);
  console.log('PASS saída do host transfere cargo definitivamente; retorno na mesma origem restaura mão/assento sem recuperar cargo; sucessor retoma com 3–2–1');
  await host.locator('#tableMenuBtn').tap();await host.locator('#onlinePauseToggle').tap();await all(()=>CartasTest.getState().paused);
  if(out){await mkdir(out,{recursive:true});await returned.screenshot({path:out+'/continuidade-publica.png'});await writeFile(out+'/resultado.json',JSON.stringify({health:{phase:3,gameplay:true},clients:4,idleSeconds:70,pausedStatePreserved:true,originalIdentityRestored:true,hostSuccessionPermanent:true,resumeCountdown:true},null,2)+'\n');}
  await host.locator('#tableMenuBtn').tap();await host.locator('#onlineCloseRoom').tap();await host.locator('#lobbyDialogConfirm').tap();await all(()=>PanelinhaNavigation.current==='multiplayer');assert.equal(await returned.evaluate(code=>fetch('/v1/rooms/'+code).then(r=>r.status),code),404);assert.deepEqual(errors,[]);
  console.log('PASS encerrar sala durante pausa invalida código e retorna todos ao menu; nenhuma exceção JS');
}finally{await Promise.all(browsers.map(b=>b.close()));}
