const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const {startRuntime}=await import('../multiplayer-server/tests/runtime.mjs');const {mf,url}=await startRuntime();
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(url=>window.PanelinhaServerConfig={serverUrl:url,inviteBaseUrl:'http://127.0.0.1:8000',allowInsecureDevelopment:true},url);
  await p.goto('http://127.0.0.1:8000');await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();
  for(const [width,height] of [[844,390],[1280,800]]){
   await p.setViewportSize({width,height});assert.ok(await p.locator('#menu .has-setting-info').evaluateAll(ns=>ns.every(label=>{const r=label.getBoundingClientRect();return [...label.children].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right})})));
   await p.screenshot({path:'/workspace/work/menu-sala-placar/opcoes-'+width+'.png'});
  }
  console.log('PASS caixas de ajuda e toggles contidos em celular/tablet');
  await p.evaluate(()=>PanelinhaNavigation.go('home'));await p.locator('#multiplayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#createRoomBtn').tap();await p.locator('#createLobbyBtn').tap();await p.locator('#lobbyRulesBtn').waitFor();
  await p.locator('#lobbyRulesBtn').tap();assert.equal(await p.locator('#mpRule-duration').inputValue(),'single');assert.ok(await p.locator('#mpRule-infinite').isChecked());assert.equal(await p.locator('#lobbyDialog [data-setting-info]').count(),6);
  await p.locator('#lobbyDialog [data-setting-info=challenge]').tap();assert.ok(await p.locator('#settingHelp').isVisible());assert.ok(await p.locator('#mpRule-challenge').isChecked());await p.screenshot({path:'/workspace/work/menu-sala-placar/sala-ajuda.png'});
  await p.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.ok(await p.locator('#settingHelp').isHidden());assert.ok(await p.locator('#lobbyDialog').isVisible());
  await p.locator('#mpRule-infinite').setChecked(false);await p.locator('[data-select-for="mpRule-duration"]').tap();await p.locator('[role=option][data-value=points]').tap();await p.locator('#lobbyDialogConfirm').tap();
  await p.waitForFunction(()=>!PanelinhaLobbyConnection.current.state.rules.infinite&&!PanelinhaLobbyConnection.current.state.rules.single,{timeout:5000});
  await p.evaluate(()=>PanelinhaLobbyConnection.command('close-room'));assert.deepEqual(errors,[]);console.log('PASS sala real local: padrões, seis explicações clonadas, Voltar e alteração/salvamento de regras');
 }finally{await b.close();await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1});
