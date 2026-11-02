const {chromium}=require('playwright');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_LIQUIDIFICADOR.json')));
const asset=manifest.assets[0].path;
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/liquidificador-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const fixture=(duo=false,direction=1)=>p.evaluate(({duo,direction})=>{
  const s=CartasTest.getState();s.round++;s.token++;Object.assign(s,{phase:'playing',current:0,direction,activeColor:'blue',unlockAt:0,cutOpen:false,penalty:0,highest:0,lastPenalty:null,finisher:null,pendingAction:null,drawn:null,lastActor:null,lastDistribution:null,deadline:0,unoWindow:null,preUno:false,reveal:false});
  Object.assign(s.o,{duo,single:true,timeout:0,cut:true,dist:true,rotate:true,infinite:false});
  s.players.forEach((player,i)=>player.hand=Array.from({length:i+2},(_,j)=>({id:100000+i*100+j,type:'num',color:['blue','green','red','yellow'][i],num:j})));
  s.players[0].hand.push({id:100010,type:'rotate',color:null},{id:100011,type:'dist',color:null});s.players[2].hand[0]={id:100200,type:'rotate',color:null};
  s.deck=Array.from({length:60},(_,i)=>({id:101000+i,type:'num',color:'red',num:i%10}));s.discard=[{id:102000,type:'num',color:'blue',num:9}];
  window.__liquidRandomCalls=0;Math.random=()=>{window.__liquidRandomCalls++;return .5};document.getElementById('useCardArt').onchange();
 },{duo,direction});
 const ids=()=>p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()});
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.evaluate(()=>window.__liquidOriginalRandom=Math.random);
  assert.equal(manifest.assets.length,1);const response=await p.request.get(new URL(asset,base).href);assert.equal(response.status(),200);assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),manifest.assets[0].sha256);
  const masks=await p.evaluate(async asset=>{
   const get=async path=>{const im=new Image();im.src=path;await im.decode();const c=document.createElement('canvas');c.width=400;c.height=850;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return {size:[im.naturalWidth,im.naturalHeight],a:ctx.getImageData(0,0,400,850).data}};
   const a=await get(asset),b=await get('assets/padronizadas/panela_de_pressao_400x850.png');let same=true;for(let i=3;i<a.a.length;i+=4)if(a.a[i]!==b.a[i])same=false;return {size:a.size,same,corners:[a.a[3],a.a[399*4+3],a.a[849*400*4+3],a.a[a.a.length-1]]};
  },asset);assert.deepEqual(masks,{size:[400,850],same:true,corners:[0,0,0,0]});
  console.log('PASS PNG oficial por hash/HTTP/decodificação, RGBA 400x850, máscara alfa idêntica à Panela e cantos transparentes');
  for(const duo of [false,true])for(const enabled of [false,true]){
   if(await p.evaluate(()=>PanelinhaNavigation.current==='game')){await p.evaluate(()=>PanelinhaNavigation.requestLeave());await p.locator('#confirmLeaveBtn').tap();await p.waitForFunction(()=>PanelinhaNavigation.current==='solo');}
   await p.locator('[data-select-for=mode]').tap();await p.locator(`[role=option][data-value="${duo?'duo':'solo'}"]`).tap();await p.locator('#panelinhaSelectList').waitFor({state:'hidden'});await p.locator('#rotate').setChecked(enabled);await p.locator('#startBtn').tap();
   const deck=await p.evaluate(()=>{const s=CartasTest.getState(),all=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)];return {enabled:s.o.rotate,count:all.filter(c=>c.type==='rotate').length,total:all.length}});
   assert.equal(deck.enabled,enabled);assert.equal(deck.count,enabled?2:0);assert.equal(deck.total,enabled?118:116);
   assert.equal(await p.evaluate(enabled=>CartasTest.createDeck({wild6:true,dist:true,rotate:enabled}).filter(c=>c.type==='rotate').length,enabled),enabled?2:0);
  }
  console.log('PASS configurações reais Individual/Duplas, ativada: duas cartas; desativada: zero cartas, baralhos 118/116 preservados');
  for(const [width,height] of [[568,320],[844,390],[1280,800]])for(const duo of [false,true])for(const direction of [1,-1]){
   await p.setViewportSize({width,height});await fixture(duo,direction);assert.equal(await p.evaluate(()=>CartasTest.assetFor({type:'rotate',color:null})),asset);
   const shape=await p.evaluate(()=>{
    const a=document.querySelector('[data-card="100010"] .card'),n=document.querySelector('[data-card="100000"] .card'),d=document.querySelector('[data-card="100011"] .card'),im=a.querySelector('img'),s=getComputedStyle(im);
    return {same:[n,d].every(c=>c.offsetWidth===a.offsetWidth&&c.offsetHeight===a.offsetHeight),fit:s.objectFit,radius:s.borderRadius,border:getComputedStyle(a).borderWidth,source:im.getAttribute('src'),scroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};
   });assert.ok(shape.same&&!shape.scroll);assert.equal(shape.source,asset);assert.equal(shape.fit,'contain');assert.equal(shape.radius,'0px');assert.equal(shape.border,'0px');
   if(duo)assert.equal(await p.locator('#player2 [data-hand-card="100200"] .card-image').getAttribute('src'),asset);
   const before=await ids(),hands=await p.evaluate(()=>CartasTest.getState().players.map(p=>p.hand.filter(c=>c.id!==100010).map(c=>c.id)));
   if(width===844&&direction===1)await p.screenshot({path:path.join(out,`${duo?'duplas':'individual'}-mao.png`)});
   await p.locator('[data-card="100010"]').tap();assert.equal(await p.locator('.color-picker,.colorbtn').count(),0);
   assert.equal(await p.locator('#discard .discard-top .card-image').getAttribute('src'),asset);assert.equal(await p.locator('.played-card[data-card-id="100010"] .flight-front .card-image').getAttribute('src'),asset);
   const result=await p.evaluate(()=>{const s=CartasTest.getState();return {hands:s.players.map(p=>p.hand.map(c=>c.id)),direction:s.direction,color:s.activeColor,pending:s.pendingAction,distribution:s.lastDistribution,random:window.__liquidRandomCalls}});
   assert.deepEqual(result.hands,[0,1,2,3].map(i=>hands[(i-direction+4)%4]));assert.equal(result.direction,direction);assert.equal(result.color,'blue');assert.equal(result.pending,null);assert.equal(result.distribution,null);assert.equal(result.random,0);assert.equal(await ids(),before);
   if(width===844&&direction===1){await p.locator('.played-card[data-card-id="100010"]').waitFor({state:'hidden'});assert.ok(await p.locator('#discard .discard-top .card-image').isVisible());await p.screenshot({path:path.join(out,`${duo?'duplas':'individual'}-descarte.png`)});}
  }
  console.log('PASS 12 cenários: caixa igual a numérica/Panela, frentes na mão/parceiro/descarte/voo, transferência de mãos inteiras nos dois sentidos e modos, sem RNG/redistribuição/seletor, cor e IDs preservados');
  await p.setViewportSize({width:844,height:390});await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.penalty=6;s.highest=6;document.getElementById('useCardArt').onchange()});assert.ok(await p.locator('[data-card="100010"]').isDisabled());
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=s.players[0].hand.filter(c=>c.id!==100010);s.deck[s.deck.length-1]={id:103000,type:'rotate',color:null};document.getElementById('useCardArt').onchange()});
  await p.locator('#buyBtn').tap();assert.ok(await p.locator('.drawn-card>.deck-back').count());assert.equal(await p.locator('[data-card="103000"] .card-image').getAttribute('src'),asset);
  await p.context().setOffline(true);await fixture(true,-1);await p.locator('[data-card="100010"]').tap();assert.equal(await p.locator('#discard .discard-top .card-image').getAttribute('src'),asset);assert.equal(await p.locator('.color-picker').count(),0);await p.context().setOffline(false);
  await p.evaluate(()=>Math.random=window.__liquidOriginalRandom);assert.deepEqual(errors,[]);console.log('PASS indisponível contra penalidade, compra real com verso preservado/frente nova na mão e jogada offline em Duplas; sem erros JavaScript');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
