const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/mesa-atual-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=(n=7,direction=1)=>page.evaluate(({n,direction})=>{
  const s=CartasTest.getState();Object.assign(s,{current:0,direction,phase:'playing',activeColor:'blue',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,round:s.round+1,token:s.token+1});Object.assign(s.o,{duo:true,single:false,timeout:0,cut:false});
  s.deck=Array.from({length:80},(_,i)=>({id:800000+i,type:'num',color:'green',num:8}));s.discard=[{id:810000,type:'num',color:'blue',num:2}];
  s.players.forEach((p,a)=>p.hand=Array.from({length:n},(_,i)=>({id:820000+a*1000+i,type:'num',color:'blue',num:i%10})));document.getElementById('useCardArt').onchange();
 },{n,direction});
 const settle=()=>page.locator('#hand>button,.hidden-card,.subhand>.card').evaluateAll(ns=>Promise.all(ns.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
 try{
  await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await page.locator('#singlePlayerBtn').click();await page.locator('#profileContinueBtn').click();await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();
  for(const [width,height] of [[320,568],[390,844],[412,915],[568,320],[844,390],[1280,800]])for(const n of [7,20,100]){
   await page.setViewportSize({width,height});await fixture(n);await settle();
   const metrics=await page.evaluate(()=>{
    const r=e=>e.getBoundingClientRect(),base=document.querySelector('#hand .card'),w=base.offsetWidth,h=base.offsetHeight;
    const same=[...document.querySelectorAll('#pile>.card,#pile>.pile-layer,#discard .card')].every(c=>Math.abs(c.offsetWidth-w)<=1&&Math.abs(c.offsetHeight-h)<=1);
    const centers=[1,3].map(i=>{const nodes=[...document.querySelectorAll(`#player${i} .seat-identity,#player${i} .hidden-card,#player${i} .subhand>.card`)].map(r);return Math.abs((Math.min(...nodes.map(t=>t.top))+Math.max(...nodes.map(t=>t.bottom)))/2-innerHeight/2)});
    return {same,w,centers,layers:document.querySelectorAll('#pile>.deck-back').length,counter:document.querySelectorAll('#pile .deck-count').length,count:document.querySelector('#pile .deck-count').textContent,cardTotal:CartasTest.getState().players.reduce((s,p)=>s+p.hand.length,0)+CartasTest.getState().deck.length+CartasTest.getState().discard.length};
   });
   assert.ok(metrics.same&&metrics.centers.every(x=>x<10),`${width}x${height}/${n}: ${JSON.stringify(metrics)}`);assert.equal(metrics.layers,6);assert.equal(metrics.counter,1);assert.equal(metrics.count,'80');assert.equal(metrics.cardTotal,n*4+81);
   await page.evaluate(()=>{const s=CartasTest.getState();s.o.timeout=15;s.deadline=Date.now()+5000;document.getElementById('useCardArt').onchange()});
   await page.locator('#turnClock').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
   assert.equal(await page.locator('#turnClock').textContent(),'5');
   assert.ok(await page.locator('#turnClock').evaluate(el=>{const t=el.getBoundingClientRect(),p=document.getElementById('buyBtn').getBoundingClientRect();return el.parentNode.id==='table'&&t.left>innerWidth/2&&Math.abs(t.y+t.height/2-(p.y+p.height/2))<1&&Math.abs(t.right+p.left-innerWidth)<1}));
   if(n===7)await page.screenshot({path:path.join(out,`${width}x${height}.png`)});
  }
  console.log('PASS 18 layouts: base humana/monte/descarte preservada, seis camadas/um contador, laterais centralizadas incluindo avatar e cronômetro grande à direita');
  await page.setViewportSize({width:390,height:844});
  for(const direction of [1,-1]){
   await fixture(7,direction);
   await page.locator('[data-card="820000"]').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().current),direction===1?1:3);
   const expected=direction===1?'anti-horário':'horário';assert.equal((await page.locator('#directionLabel').textContent()).toLowerCase(),expected);assert.match(await page.locator('#stateText').textContent(),new RegExp(`Sentido: ${expected} ·`));
   assert.equal(await page.locator('#directionGlyph').textContent(),direction===1?'↺':'↻');
   assert.equal(await page.locator('.stove-glint').evaluate(e=>e.getAnimations()[0].effect.getTiming().direction),direction===1?'reverse':'normal');
   await fixture(7,direction);await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand[0].type='reverse';document.getElementById('useCardArt').onchange()});await page.locator('[data-card="820000"]').tap();
   assert.equal(await page.evaluate(()=>CartasTest.getState().direction),-direction);assert.equal(await page.evaluate(()=>CartasTest.getState().current),direction===1?3:1);assert.equal(await page.locator('#directionGlyph').textContent(),direction===1?'↻':'↺');
  }
  console.log('PASS sentido real 0→direita→cima→esquerda anti-horário, inverso horário; texto, seta e brilho coerentes antes/depois de Inverter');
  for(const [type,label] of [['dist','Panela de Pressão'],['rotate','Liquidificador']]){
   await fixture();await page.evaluate(type=>{const s=CartasTest.getState();s.players[0].hand[0]={id:820000,type,color:null};document.getElementById('useCardArt').onchange()},type);
   assert.equal(await page.locator(`#injectType option[value="${type}"]`).textContent(),label);
   assert.match(await page.locator('[data-card="820000"]').getAttribute('aria-label'),new RegExp(label));assert.equal((await page.locator('[data-card="820000"] .special-name').textContent()).toLowerCase(),label.toLowerCase());
   await page.locator('[data-card="820000"]').tap();if(type==='dist')await page.locator('[data-color="blue"]').tap();
   assert.ok(await page.evaluate(label=>CartasTest.getState().log.some(l=>l.includes(label)),label));
   if(type==='rotate'){assert.equal(await page.evaluate(()=>CartasTest.getState().activeColor),'blue');assert.match(await page.locator('#history').textContent(),/anti-horário/);}
  }
  await fixture();await page.evaluate(()=>{const s=CartasTest.getState();s.o.timeout=15;s.deadline=Date.now()+5001;PanelasMesa.updateClock(s)});assert.ok(await page.locator('#turnClock').isHidden());
  for(const actor of [0,1,2,3])for(const seconds of [5,4,3,2,1]){
   await page.evaluate(({actor,seconds})=>{const s=CartasTest.getState();s.current=actor;s.deadline=Date.now()+seconds*1000;PanelasMesa.updateClock(s)}, {actor,seconds});assert.equal(await page.locator('#turnClock').textContent(),String(seconds));
  }
  for(const change of ['disabled','end','expired']){await page.evaluate(change=>{const s=CartasTest.getState();s.o.timeout=change==='disabled'?0:15;s.phase=change==='end'?'roundOver':'playing';s.deadline=Date.now()+(change==='expired'?0:4000);PanelasMesa.updateClock(s)},change);assert.ok(await page.locator('#turnClock').isHidden());}
  assert.deepEqual(errors,[]);console.log('PASS novos nomes na carta/laboratório/logs, regras especiais preservadas e cronômetro fiel ao prazo, sem relógio paralelo');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
