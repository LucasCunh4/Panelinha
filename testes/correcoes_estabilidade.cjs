// Regressões pelos fluxos reais do seletor, pelo DOM persistente e pela geometria renderizada.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/correcoes-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const refresh=()=>page.evaluate(()=>document.getElementById('useCardArt').onchange());
 const fixture=(n=7,penalty=0,type='num')=>page.evaluate(({n,penalty,type})=>{
  document.getElementById('table').click(); // Cada caso começa recolhido; a expansão é testada separadamente.
  const s=CartasTest.getState();
  Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'red',penalty,highest:penalty?2:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,deadline:0,unoWindow:null,preUno:false,token:s.token+1});
  Object.assign(s.o,{duo:false,single:true,timeout:0,challenge:true,cut:true,infinite:false});
  s.players.forEach((p,a)=>p.hand=Array.from({length:n},(_,i)=>({id:600000+a*1000+i,type:'num',color:['red','blue','green','yellow'][i%4],num:7})));
  if(type!=='num')s.players[0].hand[0]={id:600000,type,color:null};
  s.deck=Array.from({length:160},(_,i)=>({id:610000+i,type:'num',color:'yellow',num:i%10}));
  s.discard=[{id:620000,type:penalty?'draw2':'num',color:'red',num:7}];
  document.getElementById('useCardArt').onchange();
 },{n,penalty,type});
 const settle=()=>page.locator('#hand,#hand>button,.back>.hidden-card,.subhand>.card').evaluateAll(ns=>Promise.all(ns.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
 const finish=()=>page.locator('.flying-card,.block-effect').evaluateAll(ns=>ns.forEach(n=>n.getAnimations().forEach(a=>a.finish())));
 const allIds=()=>page.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort((a,b)=>a-b)});
 const play=()=>page.evaluate(()=>{const button=document.querySelector('[data-card="600000"]');button.click();if(!CartasTest.getState().pendingAction&&button.isConnected&&document.getElementById('hand').classList.contains('grouped-hand'))button.click();});
 try{
  await page.addInitScript(()=>{let seed=60427;Math.random=()=>{let x=seed+=0x6D2B79F5;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};});
  await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(base);
  await page.locator('#singlePlayerBtn').tap();await page.locator('#profileContinueBtn').tap();
  const option=await page.locator('#wild6').evaluate(el=>({label:el.parentElement.textContent.trim(),type:el.type,checked:el.checked,extras:!!document.getElementById('sixSettingValue')}));
  assert.deepEqual(option,{label:'+6',type:'checkbox',checked:true,extras:false});await page.locator('#startBtn').tap();
  // Reproduz a jogada real, desde a imagem até a confirmação da cor, não só a função de distribuição.
  const reductions=new Set();
  for(const n of [2,3,5,6,11,21,31])for(const penalty of [0,2,6,20,40]){
   await fixture(n,penalty,'dist');const ids=await allIds();await play();
   assert.equal(await page.locator('.color-picker').getAttribute('data-card-type'),'dist');
   assert.equal(await page.locator('#colorPickerTitle').textContent(),'Panela de Pressão');
   assert.match(await page.locator('#colorPickerHint').textContent(),/redistribuir/);
   const pending=await page.evaluate(()=>CartasTest.getState().pendingAction);assert.equal(pending.cardType,'dist');assert.equal(pending.cardId,600000);
   await page.locator('[data-color="blue"]').tap();
   const r=await page.evaluate(()=>{const s=CartasTest.getState();return {counts:s.players.map(p=>p.hand.length),top:s.discard.at(-1).type,dist:s.lastDistribution,penalty:s.penalty,color:s.activeColor,current:s.current}});
   assert.equal(r.top,'dist');assert.equal(r.penalty,0);assert.equal(r.color,'blue');assert.equal(r.current,1);
   const cap=n-1,reduction=cap-r.counts[0];assert.ok(Number.isInteger(reduction)&&reduction>=Math.min(1,cap-1)&&reduction<=Math.min(3,cap-1));
   if(n>=5)reductions.add(reduction);
   assert.ok(r.counts.every(c=>c>=1));assert.ok(Math.max(...r.counts.slice(1))-Math.min(...r.counts.slice(1))<=2);
   assert.equal(r.counts.reduce((a,b)=>a+b,0),n*4-1+penalty);assert.equal(r.dist.penaltyAdded,penalty);assert.equal(r.dist.actorReceived,r.counts[0]);
   assert.deepEqual(await allIds(),ids);await page.locator('.color-picker').waitFor({state:'hidden'});await finish();
  }
  assert.deepEqual([...reductions].sort(),[1,2,3]);
  console.log('PASS Panela: 35 jogadas pelo seletor tipado; mãos pequenas/20/40/80/120+, redução sorteada 1–3, mínimo, equilíbrio, +2/+6/+20/+40 e conservação de todos os IDs');
  await fixture(3,0,'wild');const original=await page.evaluate(()=>CartasTest.getState().players.slice(1).map(p=>p.hand.map(c=>c.id)));
  await play();assert.equal(await page.locator('.color-picker').getAttribute('data-card-type'),'wild');await page.locator('[data-color="green"]').tap();
  assert.deepEqual(await page.evaluate(()=>CartasTest.getState().players.slice(1).map(p=>p.hand.map(c=>c.id))),original);assert.equal(await page.evaluate(()=>CartasTest.getState().lastDistribution),null);await page.locator('.color-picker').waitFor({state:'hidden'});
  await fixture(3,0,'dist');await play();await page.evaluate(()=>CartasTest.getState().players[0].hand[0].type='wild');await page.locator('[data-color="red"]').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().discard.length),1);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),3);
  await fixture(5,20,'dist');await page.evaluate(()=>{CartasTest.getState().players[0].hand.length=1;document.getElementById('useCardArt').onchange()});const lastIds=await allIds();await play();
  const final=await page.evaluate(()=>{const s=CartasTest.getState();return {finisher:s.finisher,phase:s.phase,hands:s.players.map(p=>p.hand.length),active:s.lastDistribution.active,penalty:s.penalty}});
  assert.equal(final.finisher,0);assert.equal(final.hands[0],0);assert.deepEqual(final.active,[1,2,3]);assert.notEqual(final.phase,'playing');assert.equal(final.penalty,0);assert.deepEqual(await allIds(),lastIds);
  console.log('PASS Coringa não redistribui; troca de tipo durante seleção é recusada; Panela como última carta exclui quem bateu e mantém os demais com cartas');
  await fixture(20);await settle();
  await page.evaluate(()=>{
   window.__stable=[1,2,3].map(id=>{const root=document.querySelector(`#player${id} .back`);return {root,cards:[...root.children],styles:[...root.children].map(n=>n.style.cssText),avatar:document.querySelector(`#player${id} .pan-avatar`)}});
   window.__mutations=[];window.__observer=new MutationObserver(ms=>window.__mutations.push(...ms));
   window.__stable.forEach(({root})=>window.__observer.observe(root,{childList:true,subtree:true,attributes:true}));
   window.__pile=[...document.getElementById('pile').children];
  });
  for(const current of [1,2,3,0]){await page.evaluate(current=>{CartasTest.getState().current=current;document.getElementById('useCardArt').onchange()},current);await refresh();}
  let stable=await page.evaluate(()=>window.__stable.every(({root,cards,styles,avatar},i)=>root===document.querySelector(`#player${i+1} .back`)&&avatar===document.querySelector(`#player${i+1} .pan-avatar`)&&cards.every((n,j)=>root.children[j]===n&&n.style.cssText===styles[j])));
  assert.equal(stable,true);
  assert.equal(await page.evaluate(()=>window.__mutations.length),0);
  await page.evaluate(()=>{const s=CartasTest.getState();s.players[1].hand.push(s.deck.pop());document.getElementById('useCardArt').onchange()});await settle();
  assert.ok(await page.evaluate(()=>window.__stable.every(({root,cards})=>cards.every(n=>n.isConnected&&root.contains(n)))));
  await page.evaluate(()=>{const s=CartasTest.getState();s.players[1].hand.splice(4,1);document.getElementById('useCardArt').onchange()});await settle();
  assert.equal(await page.evaluate(()=>window.__stable[0].cards.filter(n=>n.isConnected).length),19);
  assert.ok(await page.evaluate(()=>window.__stable.slice(1).every(({root,cards})=>cards.every((n,j)=>root.children[j]===n))));
  await page.evaluate(()=>{CartasTest.getState().reveal=true;document.getElementById('useCardArt').onchange()});await settle();
  assert.equal(await page.locator('#player2 .subhand>.card').count(),20);assert.equal(await page.locator('#player2 [data-hand-card]').first().evaluate(n=>n.style.getPropertyValue('--fan-angle')),'-8deg');
  await page.evaluate(()=>{CartasTest.getState().reveal=false;document.getElementById('useCardArt').onchange();window.__observer.disconnect()});await settle();
  assert.ok(await page.evaluate(()=>window.__pile.every((n,i)=>document.getElementById('pile').children[i]===n)));
  assert.equal(await page.locator('#pile .deck-count').count(),0);assert.equal(await page.locator('#pile>.deck-back').count(),6);assert.equal(await page.locator('#pile').getAttribute('aria-label'),'Monte de compra');
  console.log('PASS mãos sem mutações em ações alheias; compra/remoção preservam cartas não afetadas; revelar reconfigura o leque; seis camadas persistentes sem contador');
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800]])for(const n of [7,15,20,30,40,60,100]){
   await page.setViewportSize({width,height});await fixture(n);await settle();
   const metrics=await page.evaluate(()=>{
    const rect=n=>n.getBoundingClientRect(),fan=document.querySelector('#player2 .back'),f=rect(fan),cue=rect(document.getElementById('turnCue')),hand=rect(document.getElementById('hand'));
    const cards=[...document.querySelectorAll('#hand .card')].map(rect),discard=rect(document.getElementById('discard'));
    const top=rect(document.querySelector('#player2 .seat-identity'));
    return {center:Math.abs(f.x+f.width/2-innerWidth/2),cueCenter:Math.abs(cue.x+cue.width/2-(hand.x+hand.width/2)),above:cue.bottom<=Math.min(...cards.map(r=>r.top))+.5,clearDiscard:cue.top>=discard.bottom-1,cardWidth:top.width,inside:top.left>=0&&top.right<=innerWidth&&top.top>=0,insideHand:cards.every(r=>r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight),scroll:document.getElementById('table').scrollTop};
   });
   assert.ok(metrics.center<1&&metrics.cueCenter<1&&metrics.above&&metrics.clearDiscard&&metrics.cardWidth<=117&&metrics.inside&&metrics.insideHand&&metrics.scroll===0,`${width}x${height}/${n}: ${JSON.stringify(metrics)}`);
   if(n===40){
    await page.evaluate(()=>document.querySelector('[data-card="600001"]').click());await settle();await page.clock.runFor(280);
    const expandedCue=await page.evaluate(()=>{const c=document.getElementById('turnCue').getBoundingClientRect(),d=document.getElementById('discard').getBoundingClientRect();return c.top>=d.bottom-1&&c.bottom<=Math.min(...[...document.querySelectorAll('#hand .card')].map(n=>n.getBoundingClientRect().top))+.5});
    assert.ok(expandedCue,`SUA VEZ no grupo expandido ${width}x${height}`);
   }
   if(n===30)await page.screenshot({path:path.join(out,`mesa-${width}x${height}.png`)});
  }
  // Valida nomes extremos pelo mesmo renderizador, sem alterar a identidade dos bots no jogo.
  for(const name of ['Bot 2','Nome muito comprido para conferir o card superior','X'.repeat(100)]){
   await page.evaluate(name=>{const s=CartasTest.getState();PanelasMesa.renderSeat(s,2,name,c=>`<span class="card">${c.id}</span>`);PanelasMesa.render(s)},name);
   const fit=await page.locator('#player2 .seat-identity').evaluate(e=>{const r=e.getBoundingClientRect(),n=e.querySelector('.name').getBoundingClientRect();return n.left>=r.left&&n.right<=r.right&&n.top>=r.top&&n.bottom<=r.bottom&&e.scrollWidth<=e.clientWidth});assert.equal(fit,true,name);
  }
  console.log('PASS 35 layouts horizontais: superior centrado independente do nome, card contido e SUA VEZ acima da mão sem invadir descarte');
  await fixture(7);await settle();
  for(const direction of [1,-1]){
   await page.evaluate(direction=>{CartasTest.getState().direction=direction;document.getElementById('useCardArt').onchange()},direction);
   const geometry=await page.locator('#stoveOrbit').evaluate(circle=>{
    const matrix=circle.getScreenCTM(),point=(x,y)=>new DOMPoint(x,y).matrixTransform(matrix),center=point(245,245),rx=point(451,245),ry=point(245,451),burner=document.getElementById('burner').getBoundingClientRect();
    const animation=circle.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity);animation.pause();animation.currentTime=1000;const first=parseFloat(getComputedStyle(circle).strokeDashoffset);animation.currentTime=1500;
    return {rx:Math.hypot(rx.x-center.x,rx.y-center.y),ry:Math.hypot(ry.x-center.x,ry.y-center.y),dx:center.x-burner.x-burner.width/2,dy:center.y-burner.y-burner.height/2,first,second:parseFloat(getComputedStyle(circle).strokeDashoffset),dash:getComputedStyle(circle).strokeDasharray};
   });
   assert.ok(Math.abs(geometry.rx-geometry.ry)<.01&&Math.abs(geometry.dx)<.1&&Math.abs(geometry.dy)<.1,JSON.stringify(geometry));
   assert.ok(direction===1?geometry.second>geometry.first:geometry.second<geometry.first);assert.match(geometry.dash,/32.*968/);
  }
  await page.setViewportSize({width:844,height:390});await fixture(3,12);
  await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand.forEach(c=>c.color='blue');document.getElementById('useCardArt').onchange()});
  assert.equal(await page.locator('#buyBtn').getAttribute('data-mandatory'),'true');
  const glow=await page.locator('#pile').evaluate(e=>({animations:e.getAnimations().map(a=>a.animationName),old:getComputedStyle(document.getElementById('buyBtn'),'::after').display,children:e.children.length,filter:e.getAnimations()[0].effect.getKeyframes().map(k=>k.filter)}));
  assert.ok(glow.animations.includes('whole-pile-glow'));assert.equal(glow.old,'none');assert.equal(glow.children,6);assert.ok(glow.filter.every(f=>/drop-shadow/.test(f)));
  await page.evaluate(()=>{CartasTest.getState().players[0].hand[0]={id:600000,type:'wild4',color:null};document.getElementById('useCardArt').onchange()});
  assert.equal(await page.locator('#buyBtn').getAttribute('data-mandatory'),'false');assert.equal(await page.locator('#pile').evaluate(e=>e.getAnimations().length),0);
  console.log('PASS círculo concêntrico sem elipse nos dois sentidos; brilho da compra aplicado às seis camadas, removido quando há resposta legal');
  // Hover na superfície da carta; a posição do botão e dos vizinhos não se altera.
  const desktop=await browser.newPage({viewport:{width:1280,height:800}});await desktop.goto(base);await desktop.locator('#singlePlayerBtn').click();await desktop.locator('#profileContinueBtn').click();await desktop.locator('#startBtn').click();
  for(const n of [7,40]){
   await desktop.evaluate(n=>{const s=CartasTest.getState();s.current=0;s.unlockAt=0;s.cutOpen=false;s.penalty=0;s.activeColor='blue';s.o.timeout=0;s.token++;s.players[0].hand=Array.from({length:n},(_,i)=>({id:650000+i,type:'num',color:n===7?'blue':['red','blue','green','yellow'][i%4],num:i%8}));document.getElementById('useCardArt').onchange()},n);
   const id=n===7?650003:650037,button=desktop.locator(`[data-card="${id}"]`);await desktop.mouse.move(0,0);
   await desktop.locator('#hand').evaluate(e=>e.getAnimations().forEach(a=>a.finish()));
   const getMetrics=()=>button.evaluate(el=>({button:el.getBoundingClientRect().y,card:el.querySelector('.card').getBoundingClientRect().y,sibling:el.previousElementSibling.getBoundingClientRect().y}));
   if(n===40){await button.dispatchEvent('click');await desktop.locator('#hand>button').evaluateAll(ns=>Promise.all(ns.flatMap(n=>n.getAnimations().map(a=>a.finished.catch(()=>{})))));}
   const before=await getMetrics();await button.hover({position:{x:2,y:60}});await button.locator('.card').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));const after=await getMetrics();
   assert.ok(after.card<before.card-5&&Math.abs(after.button-before.button)<.1&&Math.abs(after.sibling-before.sibling)<.1,JSON.stringify({n,before,after}));
   assert.equal(await desktop.evaluate(()=>CartasTest.getState().players[0].hand.length),n);await desktop.mouse.move(0,0);await button.locator('.card').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));assert.ok(Math.abs((await getMetrics()).card-before.card)<.1);
  }
  await desktop.close();assert.deepEqual(errors,[]);console.log('PASS hover levanta só a carta, sem mover vizinhas ou jogar, no leque normal e no grupo compacto expandido; sem erros JS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
