const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/horizontal-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url())});
 const refresh=()=>p.evaluate(()=>document.getElementById('useCardArt').onchange());
 const fixture=(options={})=>p.evaluate(options=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,activeColor:'red',direction:1,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,pendingAction:null,deadline:0,lastActor:null,unoWindow:null,preUno:false,token:s.token+1});
  Object.assign(s.o,{timeout:0,challenge:true,cut:true,wild6:true,infinite:false,single:true,duo:false});
  const make=(id,type='num',color='blue',num=7)=>({id,type,color,num});
  s.players.forEach((player,i)=>player.hand=[make(140000+i),make(141000+i,'num','green',8)]);
  s.discard=[make(142000,'num','red',2)];s.deck=Array.from({length:80},(_,i)=>make(143000+i,'num','yellow',i%10));
  Object.assign(s,options);if(options.hand){s.players[0].hand=options.hand;delete s.hand;}
  document.getElementById('useCardArt').onchange();
 },options);
 const settle=async()=>{await p.locator('#hand').evaluate(e=>e.getAnimations().forEach(a=>a.finish()));await p.waitForFunction(()=>!document.getElementById('hand').getAnimations().some(a=>a.playState==='running'))};
 const card=(type='num',color='blue',num=7,id=139000)=>({id,type,color,num});
 try{
  await p.goto(base);
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800],[1920,1080]]){
   await p.setViewportSize({width,height});await p.locator('#singlePlayerBtn').tap();await p.locator('#playerName').fill('Nome comprido para testar layout');
   const bounds=await p.locator('#profile input,#profile button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),size:r.height>=44}}));
   assert.ok(bounds.every(r=>r.inside&&r.hit&&r.size),JSON.stringify({width,height,bounds}));
   if(width===568)await p.screenshot({path:path.join(out,'identificacao-568x320.png')});
   await p.locator('#profile [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='home');
  }
  await p.setViewportSize({width:844,height:390});await p.locator('#singlePlayerBtn').tap();assert.equal(await p.evaluate(()=>PanelinhaNavigation.current),'profile');assert.equal(await p.locator('#avatarGallery button').count(),6);
  await p.locator('#playerName').fill('<b>Lua</b>');await p.locator('[data-avatar-choice=concha]').tap();assert.equal(await p.locator('#profilePreviewName').textContent(),'<b>Lua</b>');assert.equal(await p.locator('#profilePreviewName b').count(),0);
  await p.screenshot({path:path.join(out,'identificacao.png')});await p.locator('#profileContinueBtn').tap();assert.equal(await p.locator('#menu [data-nav-back]').getAttribute('aria-label'),'Voltar à identificação');assert.ok(await p.locator('#wild6').isChecked());await p.locator('#wild6').uncheck();await p.locator('#startBtn').tap();
  const initial=await p.evaluate(()=>{const s=CartasTest.getState();return {identity:s.identity,enabled:s.o.wild6,cards:[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.type)}});
  assert.deepEqual(initial.identity,{name:'<b>Lua</b>',avatar:'concha'});assert.equal(initial.enabled,false);assert.ok(!initial.cards.includes('wild6'));assert.equal(initial.cards.length,116);assert.equal(await p.locator('#player0 .name b').count(),0);assert.equal(await p.locator('#player0 [data-avatar=concha]').count(),1);
  assert.ok((await p.locator('#player1 .name').textContent()).includes('Bot 1'));assert.equal(await p.locator('#player1 .player-avatar').count(),0);
  await p.reload();await p.locator('#multiplayerBtn').tap();assert.equal(await p.locator('#playerName').inputValue(),'<b>Lua</b>');assert.equal(await p.locator('[data-avatar-choice=concha]').getAttribute('aria-pressed'),'true');
  await p.locator('#playerName').fill('Chef Lua');await p.locator('[data-avatar-choice=estrela]').tap();await p.locator('#profileContinueBtn').tap();assert.equal(await p.evaluate(()=>PanelinhaNavigation.current),'multiplayer');assert.equal(await p.locator('#multiplayer [data-nav-back]').getAttribute('aria-label'),'Voltar à identificação');await p.locator('#createRoomBtn').tap();await p.locator('#createRoom [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');await p.locator('#joinRoomBtn').tap();assert.ok(await p.locator('#roomCode').isDisabled());await p.locator('#joinRoom [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='multiplayer');await p.locator('#multiplayer [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='profile');await p.locator('#profile [data-nav-back]').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='home');
  await p.locator('#singlePlayerBtn').tap();assert.equal(await p.locator('#playerName').inputValue(),'Chef Lua');await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().identity.name),'Chef Lua');
  console.log('PASS dois fluxos via identificação, seis avatares locais, prévia, nomes seguros, bots independentes, persistência/reabertura e hierarquia Voltar');
  const decks=await p.evaluate(()=>{
   for(let i=0;i<100;i++)for(const wild6 of [true,false]){
    const a=CartasTest.createDeck({dist:true,rotate:true,wild6});if(a.length!==(wild6?118:116)||a.filter(c=>c.type==='wild6').length!==(wild6?2:0)||new Set(a.map(c=>c.id)).size!==a.length)throw Error('Baralho +6 inconsistente');
   }return true;
  });assert.ok(decks);
  // Alterar o campo fora da configuração não altera o snapshot da rodada em curso.
  await p.evaluate(()=>{document.getElementById('wild6').checked=false});assert.equal(await p.evaluate(()=>CartasTest.getState().o.wild6),true);
  await p.evaluate(()=>{const s=CartasTest.getState();s.o.wild6=false;CartasTest.newRound()});
  for(let i=0;i<20;i++)assert.ok(await p.evaluate(()=>{CartasTest.newRound();const s=CartasTest.getState(),a=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)];return a.length===116&&!a.some(c=>c.type==='wild6')&&new Set(a.map(c=>c.id)).size===116}));
  await p.evaluate(()=>{document.getElementById('injectType').value='wild6';document.getElementById('injectBtn').click()});assert.equal(await p.evaluate(()=>CartasTest.getState().players[0].hand.filter(c=>c.type==='wild6').length),0);assert.ok(await p.locator('#injectType option[value=wild6]').isDisabled());
  console.log('PASS 200 baralhos on/off, duas ou zero +6, total 118/116, 20 distribuições sem +6, snapshot da configuração e laboratório sem injeção indevida');
  for(const [enabled,type] of [[false,'wild4'],[true,'wild6']])for(const illegal of [true,false]){
   await fixture({penalty:20,highest:type==='wild6'?6:4,lastPenalty:{id:1,type,illegal,challengeable:true},hand:[card()]});
   await p.evaluate(enabled=>{CartasTest.getState().o.wild6=enabled;document.getElementById('useCardArt').onchange()},enabled);
   assert.equal(await p.locator('#buyBtn.mandatory-buy').count(),0);await p.locator('#challengeBtn').tap();
   assert.ok(await p.evaluate(illegal=>{const s=CartasTest.getState();return s.penalty===0&&(illegal?s.current===0&&s.players[1].hand.length===22:s.current===1&&s.players[0].hand.length===23)},illegal));
  }
  console.log('PASS desafios procedentes/improcedentes de +4 com +6 desligado e +6 ativado, sem alteração dos valores ou destinos');
  const cases=[
   ['normal sem carta',{hand:[card()]},true],['normal com carta',{hand:[card('num','red')]},false],
   ['penalidade sem resposta',{penalty:20,highest:6,hand:[card()]},true],
   ['resposta +2',{penalty:2,highest:2,hand:[card('draw2','blue')]},false],
   ['resposta +4',{penalty:4,highest:4,hand:[card('wild4',null)]},false],
   ['resposta +6',{penalty:6,highest:6,hand:[card('wild6',null)]},false],
   ['resposta Panela',{penalty:20,highest:6,hand:[card('dist',null)]},false],
   ['+2 não rebate +6',{penalty:6,highest:6,hand:[card('draw2','blue')]},true],
   ['desafio disponível',{penalty:20,highest:6,lastPenalty:{id:3,type:'wild6',challengeable:true},hand:[card()]},false],
   ['bloqueio temporal',{unlockAt:Date.now()+8000,hand:[card()]},false],['bot',{current:1,hand:[card()]},false],
   ['já comprou',{drawn:139000,hand:[card()]},false],['modal pendente',{pendingAction:{id:0,ids:[139000]},hand:[card()]},false]
  ];
  for(const [name,data,expected] of cases){await fixture(data);assert.equal(await p.locator('#buyBtn').evaluate(e=>e.classList.contains('mandatory-buy')),expected,name)}
  await fixture({penalty:20,highest:6,hand:[card()]});const before=await p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()});await p.screenshot({path:path.join(out,'compra-obrigatoria.png')});await p.locator('#buyBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().penalty),0);assert.equal(await p.locator('#buyBtn.mandatory-buy').count(),0);assert.equal(await p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()}),before);
  console.log('PASS 13 condições de compra obrigatória, sem brilho indevido com carta/desafio/turno bloqueado; compra por toque remove efeito imediatamente e conserva cartas');
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800],[390,844]])for(const count of [7,15,20,30,40,60,100]){
   await p.setViewportSize({width,height});const hand=Array.from({length:count},(_,i)=>card('num',['red','blue','green','yellow'][i%4],i%10,150000+i));
   await fixture({current:1,hand});await settle();const normal=await p.locator('#hand').evaluate(e=>parseFloat(getComputedStyle(e).transform.split('(')[1]));
   await p.evaluate(()=>{CartasTest.getState().current=0;document.getElementById('useCardArt').onchange()});await settle();assert.equal(await p.locator('#turnCue').textContent(),'SUA VEZ!');
   const shape=await p.locator('#hand').evaluate(e=>{const r=e.getBoundingClientRect(),a=[...e.children].map(c=>c.getBoundingClientRect());return {scale:parseFloat(getComputedStyle(e).transform.split('(')[1]),inside:r.x>=-1&&r.right<=innerWidth+1,noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight,center:(Math.min(...a.map(r=>r.left))+Math.max(...a.map(r=>r.right)))/2}});
   assert.equal(normal,1);assert.equal(shape.scale,1.06);assert.ok(shape.inside&&shape.noScroll&&Math.abs(shape.center-width/2)<18,JSON.stringify({width,height,count,shape}));
   await p.evaluate(()=>window.__cueNode=document.getElementById('turnCue').firstElementChild);await refresh();assert.ok(await p.evaluate(()=>window.__cueNode===document.getElementById('turnCue').firstElementChild));
   await p.evaluate(()=>{CartasTest.getState().current=1;document.getElementById('useCardArt').onchange()});await settle();assert.ok(await p.locator('#turnCue').isHidden());assert.equal(await p.locator('#hand').evaluate(e=>parseFloat(getComputedStyle(e).transform.split('(')[1])),1);
  }
  console.log('PASS 42 layouts/mãos 7–100: crescimento 6%, retorno suave, centralização, leque contínuo, sem rolagem da mesa ou repetição do aviso a cada render');
  await p.setViewportSize({width:844,height:390});await fixture({hand:[card('num','red',2),card('num','blue',3,139001)]});await p.locator('[data-card="139000"]').tap();await fixture({current:1,cutOpen:true,unlockAt:Date.now()+2200,lastActor:2,hand:[card('num','red',2),card('num','blue',3,139001)]});await settle();assert.equal(await p.locator('#hand').evaluate(e=>getComputedStyle(e).transform),'matrix(1, 0, 0, 1, 0, 0)');assert.ok(await p.locator('#cutBtn .cut-bubble').isVisible());assert.equal(await p.locator('#controls').textContent().then(s=>/cortes abertos|liberada em|aguardando/i.test(s)),false);await p.locator('#cutBtn .cut-bubble').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().discard.length),2);
  console.log('PASS corte fora da vez mantém tamanho normal e faca clicável; controles sem mensagens de espera');
  for(const [width,height] of [[568,320],[844,390],[1280,800]]){
   await p.setViewportSize({width,height});await fixture();await p.evaluate(()=>{CartasTest.getState().identity.name='NomeMuitoCompridoSemEspacos123456';document.getElementById('useCardArt').onchange()});
   const overlap=await p.evaluate(()=>{const a=document.getElementById('player0').getBoundingClientRect(),b=document.getElementById('turnCue').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top});assert.equal(overlap,false);
  }
  await p.setViewportSize({width:844,height:390});await p.evaluate(()=>CartasTest.getState().identity=PanelinhaProfile.current);
  await fixture({hand:[card('num','red',2)]});await p.locator('[data-card="139000"]').tap();assert.ok((await p.locator('#controls').textContent()).includes('Chef Lua'));
  await p.emulateMedia({reducedMotion:'reduce'});await fixture();await settle();assert.equal(await p.locator('#hand').evaluate(e=>e.getAnimations().length),0);await p.context().setOffline(true);await p.locator('#tableMenuBtn').tap();assert.ok(await p.locator('#tableMenu').isVisible());await p.locator('#closeTableMenu').tap();await p.context().setOffline(false);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS nome nos resultados, movimento reduzido e opções offline; sem erros JS ou dependência de rede externa');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
