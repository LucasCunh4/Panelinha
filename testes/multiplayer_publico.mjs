// Execução explícita: cria apenas salas temporárias no serviço informado pelo operador.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const target=new URL(process.env.PANELINHA_PUBLIC_TEST_URL||'');
assert.equal(target.protocol,'https:');assert.ok(!target.username&&!target.password&&!target.search&&!target.hash);
const base=target.origin+'/',out=process.env.PANELAS_SCREENSHOTS;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],...(process.env.PANELAS_BROWSER_PROXY?{proxy:{server:process.env.PANELAS_BROWSER_PROXY,bypass:'localhost,127.0.0.1'}}:{})});
const errors=[],sockets=[];
async function page(context){const p=await context.newPage();p.setDefaultTimeout(60000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(e.message));p.on('websocket',s=>sockets.push(s.url()));return p;}
const context=()=>browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
const connected=p=>p.waitForFunction(()=>PanelinhaNavigation.current==='lobby'&&PanelinhaLobbyConnection.current.status==='connected');
const view=p=>p.evaluate(()=>PanelinhaLobbyConnection.current);
try{
 const first=await context(),second=await context(),a=await page(first);await a.goto(base);
 assert.equal(await a.evaluate(()=>PanelinhaServerConfig.serverUrl),target.origin);
 const health=await a.evaluate(()=>fetch('/health').then(r=>r.json()));assert.deepEqual(health,{v:1,phase:3,gameplay:true});
 await a.locator('#multiplayerBtn').tap();await a.locator('#playerName').fill('Teste repouso A');await a.locator('#profileContinueBtn').tap();await a.locator('#createRoomBtn').tap();await a.locator('#createLobbyBtn').tap();await connected(a);
 const initial=await view(a),code=initial.state.code,b=await page(second);await b.goto(base+'?sala='+code);await b.locator('#playerName').fill('Teste repouso B');await b.locator('#profileContinueBtn').tap();await b.locator('#joinLobbyBtn').tap();await connected(b);const originalB=(await view(b)).selfId;
 for(let i=0;i<2;i++){await a.locator('.lobby-player.is-empty .lobby-moderate').first().tap();await a.waitForFunction(n=>PanelinhaLobbyConnection.current.state.players.filter(p=>p?.bot).length===n,i+1);}
 for(const p of [a,b]){await p.locator('#lobbyReadyBtn').tap();await p.waitForFunction(()=>{const v=PanelinhaLobbyConnection.current;return v.state.players.find(p=>p.id===v.selfId).ready;});}
 await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.allReady);const before=(await view(a)).state;
 console.log('PASS URL pública configurada sem injeção de teste, saúde HTTPS, duas conexões WSS e dois bots prontos; aguardando 70 segundos sem comandos');
 await a.waitForTimeout(70000);
 const after=await view(a);assert.equal(after.status,'connected');assert.equal((await view(b)).status,'connected');assert.equal(after.state.version,before.version);assert.equal(after.state.hostId,initial.selfId);assert.ok(after.state.allReady);
 assert.equal(await a.locator('#lobbyStartBtn').isDisabled(),false);
 await a.locator('#lobbyReadyBtn').tap();await b.waitForFunction(host=>!PanelinhaLobbyConnection.current.state.players.find(p=>p.id===host).ready,initial.selfId);
 assert.equal(await a.locator('#lobbyStartBtn').isDisabled(),true);assert.equal(await a.evaluate(()=>CartasTest.getState()),null);
 console.log('PASS 70 segundos ociosos preservam conexões/host/Pronto, comando posterior chega ao outro cliente e partida não inicia automaticamente sem comando do anfitrião');
 if(out){await mkdir(out,{recursive:true});await a.screenshot({path:out+'/lobby-apos-repouso.png'});}
 await b.close();await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.players.filter(Boolean).length===3);
 const returned=await page(second);await returned.goto(base+'?sala='+code);await returned.locator('#profileContinueBtn').tap();await returned.locator('#joinLobbyBtn').tap();await connected(returned);
 const restored=await view(returned);assert.equal(restored.selfId,originalB);assert.equal(restored.state.hostId,initial.selfId);assert.equal(restored.state.players.find(p=>p.id===originalB).ready,false);
 console.log('PASS fechamento confirmado libera vaga; retorno na mesma origem/contexto conserva identidade, sem recuperar Pronto');
 await a.locator('#lobbyCloseBtn').tap();await a.locator('#lobbyDialogConfirm').tap();for(const p of [a,returned])await p.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');
 const status=await a.evaluate(code=>fetch('/v1/rooms/'+code).then(r=>r.status),code);assert.equal(status,404);assert.deepEqual(errors,[]);assert.ok(sockets.length>=3&&sockets.every(url=>url.startsWith('wss://'+target.host+'/')));
 console.log('PASS encerramento público invalida código (404), nenhum erro JS e todos os transportes observados usam WSS');
}finally{await browser.close();}
