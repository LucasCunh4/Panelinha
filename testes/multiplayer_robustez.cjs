const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/',out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/fase3/interface';
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const {startRuntime}=await import('../multiplayer-server/tests/runtime.mjs');
  // A inspeção SQL/evicção existe apenas neste processo Miniflare de testes.
  // Não há endpoint de laboratório/injeção publicado pelo servidor de produção.
  const name='interface-robustez',{mf,url:server}=await startRuntime({name,unsafeInspectDurableObjects:true});
  const launch={executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']};
  const browsers=[await chromium.launch(launch),await chromium.launch(launch)],pages=[],errors=[],transports=[];let latency=0,blackout=false,dropIncoming=false;
  const view=p=>p.evaluate(()=>PanelinhaLobbyConnection.current),table=p=>p.evaluate(()=>CartasTest.getState());
  async function fresh(i){
    const c=await browsers[i%2].newContext({viewport:i===1?{width:568,height:320}:{width:844,height:390},hasTouch:true,isMobile:true});
    await c.addInitScript(({server,base})=>window.PanelinhaServerConfig={serverUrl:server,inviteBaseUrl:base},{server,base});const p=await c.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    if(i===3)await p.routeWebSocket(/\/v1\/rooms\/\d{6}\/ws$/,route=>{
      if(blackout){route.close({code:1012,reason:'Rede indisponível no teste'});return;}
      const upstream=route.connectToServer(),record={route,upstream};transports.push(record);
      upstream.onMessage(message=>{if(!dropIncoming)setTimeout(()=>{try{route.send(message);}catch{}},latency);});
      route.onMessage(message=>setTimeout(()=>{try{upstream.send(message);}catch{}},latency));
      route.onClose(()=>upstream.close());upstream.onClose((code,reason)=>route.close({code,reason}));
    });
    pages.push(p);await p.goto(base);return p;
  }
  const waitAll=async predicate=>{for(const p of pages)await p.waitForFunction(predicate);};
  const cards=s=>s.players.map(p=>p.hand.map(c=>c.id));
  async function tapCard(p,id){const b=p.locator(`[data-card="${id}"]`);if(await b.evaluate(b=>b.parentElement.classList.contains('grouped-hand')&&!b.classList.contains('group-expanded'))){await b.tap();await p.waitForTimeout(220);}await b.tap();}
  try{
    const a=await fresh(0);await a.locator('#multiplayerBtn').tap();await a.locator('#playerName').fill('Chef anfitrião');await a.locator('#profileContinueBtn').tap();await a.locator('#createRoomBtn').tap();await a.locator('#createLobbyBtn').tap();await a.waitForFunction(()=>PanelinhaNavigation.current==='lobby');const code=(await view(a)).state.code;
    for(let i=1;i<4;i++){const p=await fresh(i);await p.goto(base+'?sala='+code);await p.locator('#playerName').fill('Chef '+i);await p.locator('#profileContinueBtn').tap();await p.locator('#joinLobbyBtn').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='lobby');}
    for(const p of pages){await p.locator('#lobbyReadyBtn').tap();await p.waitForFunction(()=>{const v=PanelinhaLobbyConnection.current;return v.state.players.find(p=>p.id===v.selfId).ready;});}
    await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.canStart);await a.locator('#lobbyStartBtn').tap();await waitAll(()=>PanelinhaNavigation.current==='game');
    await a.locator('#tableMenuBtn').tap();await a.locator('#onlinePauseToggle').tap();await waitAll(()=>CartasTest.getState().paused);
    const before=await Promise.all(pages.map(table));
    for(let i=0;i<4;i++){
      assert.ok(await pages[i].locator('#onlinePause').isVisible());assert.ok(await pages[i].locator('#buyBtn').isDisabled());assert.ok(await pages[i].locator('#turnCue').isHidden());
      assert.equal(await pages[i].locator('#onlineResumeBtn').isVisible(),i===0);assert.equal((await table(pages[i])).deadline,0);
    }
    await pages[1].screenshot({path:path.join(out,'pausa-568x320.png')});await a.screenshot({path:path.join(out,'pausa-844x390.png')});
    const registry=await mf.getDurableObjectNamespace('REGISTRY'),roomId=(await registry.getByName('codes').lookup(code)).roomId,storage=await mf.unsafeGetDurableObjectStorage(name,'LobbyRoom',{name:roomId});
    const read=async()=>JSON.parse((await storage.exec('SELECT value FROM lobby WHERE id=1'))[0].value);
    const write=async room=>{await storage.exec('UPDATE lobby SET value=? WHERE id=1',JSON.stringify(room));await mf.unsafeEvictDurableObject(name,'LobbyRoom',{name:roomId,webSockets:'hibernate'});};
    await mf.unsafeEvictDurableObject(name,'LobbyRoom',{name:roomId,webSockets:'hibernate'});await a.evaluate(()=>PanelinhaLobbyConnection.command('sync'));
    for(let i=0;i<4;i++)assert.deepEqual(cards(await table(pages[i])),cards(before[i]));
    console.log('PASS quatro clientes, pausa no menu, mãos/relógios congelados, controles bloqueados, retomada só do host, landscape 568x320/844x390 e evicção mantendo WebSockets');

    const guest=pages[3],identity=(await view(guest)).selfId,ownBefore=(await table(guest)).players[0].hand;
    blackout=true;const transport=transports.at(-1);transport.route.close({code:1012,reason:'Perda de transporte de teste'});transport.upstream.close({code:1012});
    await guest.waitForFunction(()=>PanelinhaLobbyConnection.current.status!=='connected');assert.ok(await guest.locator('#buyBtn').isDisabled());
    await guest.waitForFunction(()=>PanelinhaLobbyConnection.current.status==='disconnected');assert.equal(await guest.evaluate(()=>JSON.parse(localStorage.getItem('panelinha.multiplayer.room.v1')).code),code);
    assert.ok(await guest.locator('#onlineReconnectBtn').isEnabled());
    // O último snapshot pode indicar bot por inatividade quando a rede cai.
    // Essa indicação local não deve consumir o toque no botão Reconectar.
    await guest.evaluate(()=>{CartasTest.getState().actions.reclaim=true;});blackout=false;await guest.locator('#onlineReconnectBtn').tap();
    await guest.waitForFunction(()=>PanelinhaLobbyConnection.current.status==='connected');assert.equal((await view(guest)).selfId,identity);assert.deepEqual((await table(guest)).players[0].hand,ownBefore);assert.equal((await table(guest)).paused,true);
    assert.equal((await view(guest)).state.hostId,(await view(a)).selfId);
    console.log('PASS perda real do transporte, quatro tentativas e Reconectar mantêm código, identidade, assento, mão e pausa; mesa sem comandos durante desconexão');

    await a.locator('#onlineResumeBtn').tap();await waitAll(()=>CartasTest.getState().resumeAt>0);assert.equal(await a.locator('#onlineCountdown').textContent(),'3');
    await a.waitForTimeout(1000);for(let i=0;i<4;i++){assert.equal((await table(pages[i])).paused,true);assert.deepEqual(cards(await table(pages[i])),cards(before[i]));}
    await waitAll(()=>!CartasTest.getState().paused);assert.ok(await a.locator('#onlinePause').isHidden());
    console.log('PASS retomada 3–2–1 sincronizada sem compra/jogada durante a contagem');

    // Relógio local adiantado e transporte com 150 ms em cada direção. O prazo
    // continua sendo o do servidor, estimado pelo RTT real, sem heartbeat.
    latency=150;await guest.evaluate(()=>{const realNow=Date.now;Date.now=()=>realNow()+3600000;});
    let saved=await read(),s=saved.game,seat=s.seats.indexOf(identity);Object.assign(s,{current:seat,unlockAt:0,countdownAt:0,cutOpen:false,deadline:Date.now()+30000,idleAt:0,botAt:0,botCutAt:0,reportAt:0,penalty:0,highest:0,lastPenalty:null});s.o.timeout=30;await write(saved);
    await guest.evaluate(()=>PanelinhaLobbyConnection.command('sync'));const display=await guest.evaluate(()=>CartasTest.getState().deadline-Date.now()),actual=(await read()).game.deadline-Date.now();assert.ok(Math.abs(display-actual)<350,`erro de relógio ${display-actual} ms`);
    console.log('PASS relógio visual deriva do prazo real apesar de +1 hora no relógio do cliente e 300 ms de RTT');

    // Prepara uma substituição já validada pelos testes temporais do servidor.
    // As cartas são as do próprio baralho da partida, sem criar ou perder IDs.
    saved=await read();s=saved.game;const owner=saved.players.find(p=>p.id===identity);owner.idleBot=true;owner.missedTurns=2;
    Object.assign(s,{current:seat,unlockAt:0,countdownAt:0,cutOpen:false,drawn:null,deadline:Date.now()+120000,botAt:Date.now()+60000,idleAt:0,penalty:0,highest:0,lastPenalty:null,reportAt:0});s.activeColor=s.players[seat].hand[0].color||'red';await write(saved);await guest.evaluate(()=>PanelinhaLobbyConnection.command('sync'));
    await guest.waitForFunction(()=>CartasTest.getState().actions.reclaim);assert.ok(await guest.locator('#onlineReclaimBtn').isVisible());assert.ok(await guest.locator('#turnCue').isHidden());
    for(const size of [{width:568,height:320},{width:844,height:390}]){
      await guest.setViewportSize(size);await guest.waitForTimeout(250);
      const fits=await guest.evaluate(()=>{const r=document.getElementById('onlineConnectionNotice').getBoundingClientRect(),overlap=n=>{const x=n.getBoundingClientRect();return x.width&&x.height&&r.left<x.right&&r.right>x.left&&r.top<x.bottom&&r.bottom>x.top;};return {inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,conflicts:[...document.querySelectorAll('#player2 [data-hand-card],#player2 .seat-identity,#discard .card,#hand .card')].filter(overlap).map(n=>n.className),notice:r.toJSON()};});
      await guest.screenshot({path:path.join(out,`controle-${size.width}x${size.height}.png`)});assert.ok(fits.inside&&!fits.conflicts.length,JSON.stringify(fits));
    }
    await guest.screenshot({path:path.join(out,'retomar-controle.png')});const original=(await table(guest)).players[0].hand.map(c=>c.id),token=(await table(guest)).token;
    const hand=await guest.locator('#hand').boundingBox();await guest.touchscreen.tap(hand.x+hand.width/2,Math.min(385,hand.y+hand.height/2));
    await guest.waitForFunction(()=>!CartasTest.getState().actions.reclaim);assert.deepEqual((await table(guest)).players[0].hand.map(c=>c.id),original);assert.equal((await table(guest)).token,token);
    const g=(await view(guest)).state.game;if(g.actions.legal.length){const c=g.players[g.self].hand.find(c=>c.id===g.actions.legal[0]);await tapCard(guest,c.id);if(['wild','wild4','wild6'].includes(c.type)&&original.length>1)await guest.locator('[data-color=blue]').click();}else await guest.locator('#buyBtn').tap();
    await guest.waitForFunction(token=>CartasTest.getState().token!==token||CartasTest.getState().drawn!==null,token);
    console.log('PASS bot mantém nome/avatar e cartas; primeiro toque somente reassume; segundo toque executa a ação normal, inclusive seleção de cor');
    saved=await read();s=saved.game;Object.assign(s,{current:seat,unlockAt:0,countdownAt:0,cutOpen:false,drawn:null,deadline:0,idleAt:0,botAt:0,botCutAt:0,reportAt:0,penalty:0,highest:0,lastPenalty:null});s.o.timeout=0;await write(saved);await guest.evaluate(()=>PanelinhaLobbyConnection.command('sync'));
    const count=s.players[seat].hand.length;dropIncoming=true;await guest.locator('#buyBtn').tap();
    const until=Date.now()+5000;while((await read()).game.players[seat].hand.length!==count+1){assert.ok(Date.now()<until);await new Promise(r=>setTimeout(r,25));}
    // Isola a entrega da compra de uma jogada legítima do bot substituto.
    await a.evaluate(()=>PanelinhaLobbyConnection.command('pause'));
    await guest.waitForFunction(()=>PanelinhaLobbyConnection.current.status!=='connected',{},{timeout:15000});dropIncoming=false;
    await guest.waitForFunction(()=>PanelinhaLobbyConnection.current.status==='connected');assert.equal((await table(guest)).players[0].hand.length,count+1);
    assert.equal((await read()).game.players[seat].hand.length,count+1);
    console.log('PASS compra aplicada com ACK perdido não é reenviada; reconexão recupera exatamente uma carta adicional');
    assert.deepEqual(errors,[]);await a.evaluate(()=>PanelinhaLobbyConnection.command('close-room'));console.log('PASS nenhuma exceção JS; sala encerrada pelo host');
  }finally{await Promise.all(browsers.map(b=>b.close()));await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
