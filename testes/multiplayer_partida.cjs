const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const duo=process.env.PANELAS_TEST_MODE!=='solo';
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/',server=process.env.PANELINHA_TEST_SERVER||'http://127.0.0.1:8788',out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/fase2/partida-evidencias';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const launch={executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox'],...(process.env.PANELAS_BROWSER_PROXY?{proxy:{server:process.env.PANELAS_BROWSER_PROXY,bypass:'localhost,127.0.0.1'}}:{})};
 const browsers=[await chromium.launch(launch),await chromium.launch(launch)],pages=[],errors=[],snapshots=[];
 const data=p=>p.evaluate(()=>PanelinhaLobbyConnection.current),table=p=>p.evaluate(()=>CartasTest.getState());
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 async function fresh(i){const c=await browsers[i%2].newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});await c.addInitScript(({server,base})=>window.PanelinhaServerConfig={serverUrl:server,inviteBaseUrl:base},{server,base});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('websocket',s=>s.on('framereceived',f=>{try{const m=JSON.parse(f.payload);if(m.state?.game)snapshots.push(m.state.game);}catch{}}));pages.push(p);await p.goto(base);return p;}
 async function ready(p){await p.locator('#lobbyReadyBtn').tap();await p.waitForFunction(()=>{const v=PanelinhaLobbyConnection.current;return v.state.players.find(p=>p.id===v.selfId).ready;});}
 async function tapCard(p,id){const b=p.locator(`[data-card="${id}"]`);const expand=await b.evaluate(b=>b.parentElement.classList.contains('grouped-hand')&&!b.classList.contains('group-expanded'));if(expand){await b.tap();await p.waitForTimeout(220);}await b.tap();}
 try{
  const a=await fresh(0);await a.locator('#multiplayerBtn').tap();await a.locator('#playerName').fill('Chef 0');await a.locator('#profileContinueBtn').tap();await a.locator('#createRoomBtn').tap();await a.locator('#createLobbyBtn').tap();await a.waitForFunction(()=>PanelinhaNavigation.current==='lobby');const code=(await data(a)).state.code;
  for(let i=1;i<4;i++){const p=await fresh(i);await p.goto(base+'?sala='+code);await p.locator('#playerName').fill('Chef '+i);await p.locator('#profileContinueBtn').tap();await p.locator('#joinLobbyBtn').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='lobby');}
  // Duplas: parceiros precisam ficar opostos para cada um; rodada única acelera o fluxo completo sem alterar cartas.
  await a.locator('#lobbyRulesBtn').tap();await a.locator('[data-select-for=mpRule-mode]').tap();await a.locator('#panelinhaSelectList [data-value="'+(duo?'duo':'solo')+'"]').tap();await a.locator('[data-select-for=mpRule-duration]').tap();await a.locator('#panelinhaSelectList [data-value=single]').tap();await a.locator('#mpRule-cut').uncheck();await a.locator('#mpRule-timeout').selectOption('15');await a.locator('#lobbyDialogConfirm').tap();
  for(const p of pages)await ready(p);await a.waitForFunction(()=>PanelinhaLobbyConnection.current.state.canStart);await a.locator('#lobbyStartBtn').tap();
  for(const p of pages)await p.waitForFunction(()=>PanelinhaNavigation.current==='game'&&CartasTest.getState()?.online);
  assert.ok(await a.locator('#onlineCountdown').isVisible());assert.ok(['3','2','1'].includes(await a.locator('#onlineCountdown').textContent()));
  for(let i=0;i<4;i++){const s=await table(pages[i]),raw=(await data(pages[i])).state.game;assert.equal(s.players[0].name,'Chef '+i);assert.ok(s.players[0].hand.every(c=>!c.hidden));assert.ok(s.players[2].hand.every(c=>duo?!c.hidden:c.hidden));assert.ok(s.players[1].hand.every(c=>c.hidden)&&s.players[3].hand.every(c=>c.hidden));assert.equal(raw.players.filter(p=>p.hand).length,duo?2:1);assert.equal(await pages[i].locator('#player2 .subhand .card').count(),duo?s.players[2].hand.length:0);}
  await a.screenshot({path:path.join(out,'inicio-'+(duo?'duplas':'individual')+'.png')});console.log('PASS quatro navegadores/contextos na Mesa V1, identidade própria embaixo, parceiro/oponentes com visibilidade correta e contagem 3–2–1');
  const deadline=Date.now()+150000;let plays=0,bought=0,announced=false,flight=false,logged=0;
  while(Date.now()<deadline){
   const views=await Promise.all(pages.map(data));if(views[0].state.game.phase!=='playing')break;
   if(!announced){const caller=views.findIndex(v=>v.state.game.actions.announce&&v.state.game.players[v.state.game.self].count===2&&!v.state.game.countdownAt);if(caller>=0){await pages[caller].locator('#unoBtn').tap();await pages[caller].waitForFunction(()=>CartasTest.getState().preUno);announced=true;continue;}}
   const newest=Math.max(...views.map(v=>v.state.version));
   const index=views.findIndex(v=>v.state.version===newest&&v.state.game.self===v.state.game.current);if(index<0){await delay(25);continue;}const p=pages[index],g=views[index].state.game;
   if(g.unlockAt>g.serverNow||g.countdownAt){await delay(50);continue;}
   const token=g.token;
   if(g.actions.legal.length){
    if(g.actions.announce&&g.players[g.self].count===2){await p.locator('#unoBtn').tap();await p.waitForFunction(()=>CartasTest.getState().preUno);announced=true;}
    const hand=g.players[g.self].hand,card=hand.filter(c=>g.actions.legal.includes(c.id)).sort((a,b)=>(a.type==='num'?0:1)-(b.type==='num'?0:1))[0];await tapCard(p,card.id);
    if(['wild','wild4','wild6'].includes(card.type)&&hand.length>1){await p.locator('.color-picker').waitFor();await p.locator('[data-color=red]').click();}
    await p.waitForFunction(token=>PanelinhaLobbyConnection.current.state.game.token!==token,token);plays++;flight=flight||await p.locator('.played-card').count()>0;
   }else if(g.actions.draw){const glow=await p.locator('#buyBtn').getAttribute('data-mandatory');if((await data(p)).state.version!==views[index].state.version)continue;assert.equal(glow,'true');await p.locator('#buyBtn').tap();await p.waitForFunction(({token,version})=>{const v=PanelinhaLobbyConnection.current;return v.state.game.token!==token||v.state.version!==version;},{token,version:views[index].state.version});bought++;}
   else if(g.actions.pass){await p.locator('#passBtn').tap();await p.waitForFunction(token=>PanelinhaLobbyConnection.current.state.game.token!==token,token);}
   else await delay(50);
   if(plays+bought>=logged+20){logged=plays+bought;console.log('PROGRESS partida: '+plays+' descartes, '+bought+' compras; mãos '+(await data(pages[0])).state.game.players.map(p=>p.count).join('/'));}
  }
  const final=(await data(a)).state.game;assert.equal(final.phase,'gameOver',JSON.stringify({reason:'partida ainda em curso ao atingir o orçamento de 150s',plays,bought,current:final.current,counts:final.players.map(p=>p.count),penalty:final.penalty,actions:final.actions}));
  for(const p of pages)await p.waitForFunction(()=>CartasTest.getState()?.phase==='gameOver');assert.ok(plays>0);assert.ok(flight);assert.ok(announced);await a.screenshot({path:path.join(out,'resultado-'+(duo?'duplas':'individual')+'.png')});
  const before=(await data(a)).state.game;assert.equal(before.summary.length,4);if(duo)assert.equal(before.teams.reduce((a,b)=>a+b,0),1);else assert.equal(before.players.reduce((sum,p)=>sum+p.score,0),6);
  console.log('PASS partida completa autoritativa em '+(duo?'Duplas':'Individual')+', '+plays+' descartes animados, '+bought+' compras, seletor de ingredientes, anúncio real e pontuação');
  for(const p of pages)await p.locator('#onlineReadyResult').tap();for(const p of pages)await p.waitForFunction(()=>PanelinhaNavigation.current==='lobby');assert.equal((await data(a)).state.code,code);assert.ok((await data(a)).state.players.every(p=>!p.ready));assert.equal((await data(a)).state.game,undefined);
  assert.ok(snapshots.every(g=>g.players.filter(p=>p.hand).length===(duo?2:1)&&!('deck' in g)&&!('lastPenalty' in g)));assert.deepEqual(errors,[]);
  await a.locator('#lobbyCloseBtn').tap();await a.locator('#lobbyDialogConfirm').tap();console.log('PASS resultado/confirmar retornam ao mesmo código para revanche; snapshots sem baralho, mãos adversárias ou marcador privado de desafio; sem erros JS');
 }finally{await Promise.all(browsers.map(b=>b.close()));}
})().catch(e=>{console.error(e);process.exitCode=1});
