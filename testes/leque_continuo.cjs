const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/leque19-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=(n=30,oneColor=false)=>page.evaluate(({n,oneColor})=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'blue',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,round:s.round+1,token:s.token+1});Object.assign(s.o,{duo:true,single:false,timeout:0,cut:true,infinite:false});
  s.deck=Array.from({length:100},(_,i)=>({id:910000+i,type:'num',color:'green',num:4}));s.discard=[{id:920000,type:'num',color:'blue',num:9}];
  s.players.forEach((p,a)=>p.hand=Array.from({length:a?20:n},(_,i)=>{const color=oneColor?'blue':['red','blue','green','yellow',null][i%5];return {id:930000+a*1000+i,type:color?'num':['wild','wild4','wild6','dist','rotate'][Math.floor(i/5)%5],color,num:color?i%8:null}}));
  document.getElementById('useCardArt').onchange();s.token++;
 },{n,oneColor});
 const settle=()=>page.locator('#hand>button,.subhand>.card,.hidden-card').evaluateAll(ns=>Promise.all(ns.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
 const finish=async()=>{await page.locator('.flying-card').evaluateAll(ns=>ns.forEach(n=>n.getAnimations().forEach(a=>a.finish())));await page.waitForFunction(()=>!document.querySelector('.flying-card'));};
 const point=async(id,p=page)=>p.locator(`[data-card="${id}"]`).evaluate(el=>{
  const r=el.getBoundingClientRect(),h=document.getElementById('hand').getBoundingClientRect();
  for(const y of [.3,.5,.7,.85])for(let x=1;x<r.width-1;x+=1){const px=r.left+x,py=r.top+r.height*y;if(px<h.left||px>h.right||py<h.top||py>h.bottom||px<0||px>=innerWidth)continue;const hit=document.elementFromPoint(px,py);if(el.contains(hit)&&!hit.closest('.cut-bubble'))return{x:px,y:py};}
  return null;
 });
 const tap=async id=>{let at=await point(id);if(!at){await page.locator(`[data-card="${id}"]`).scrollIntoViewIfNeeded();at=await point(id);}assert.ok(at,`sem ponto tocável ${id}`);await page.touchscreen.tap(at.x,at.y);};
 try{
  await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await page.locator('#singlePlayerBtn').click();await page.locator('#profileContinueBtn').click();await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();
  for(const [width,height] of [[320,568],[390,844],[568,320],[844,390],[1280,800]])for(const n of [15,20,30,40,60,100]){
   await page.setViewportSize({width,height});await fixture(n);await settle();
   const metrics=await page.evaluate(n=>{
    const hand=document.getElementById('hand'),buttons=[...hand.children],r=e=>e.getBoundingClientRect();const cardWidth=document.querySelector('#hand .card').offsetWidth;
    const top=r(document.querySelector('#player2 .seat-identity')),fan=r(document.querySelector('#player2 .subhand'));
    const centers=[1,3].map(i=>{const a=[...document.querySelectorAll(`#player${i} .seat-identity,#player${i} .hidden-card`)].map(r);return Math.abs((Math.min(...a.map(r=>r.top))+Math.max(...a.map(r=>r.bottom)))/2-innerHeight/2)});
    const rects=buttons.map(r);return {count:buttons.length,onlyButtons:buttons.every(c=>c.matches('button[data-card][data-hand-color]')),continuous:rects.slice(1).every((r,i)=>r.left<rects[i].right),inside:rects.every(r=>r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight),center:Math.abs((Math.min(...rects.map(r=>r.left))+Math.max(...rects.map(r=>r.right)))/2-innerWidth/2),topSide:top.right<=fan.left+1&&top.top<fan.bottom&&top.bottom>fan.top,topUp:fan.top<=12,opponent:document.querySelector('#player1 .hidden-card').offsetWidth/cardWidth,partner:document.querySelector('#player2 .card').offsetWidth/cardWidth,discard:document.querySelector('#discard .card').offsetWidth/cardWidth,centers,noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&document.getElementById('table').scrollTop===0,opponents:[1,2,3].every(i=>document.querySelectorAll(`#player${i} [data-hand-card]`).length===20)};
   },n);
   assert.ok(metrics.count===n&&metrics.onlyButtons&&metrics.continuous&&metrics.inside&&metrics.center<2&&metrics.topSide&&metrics.topUp&&metrics.centers.every(x=>x<10)&&metrics.noScroll&&metrics.opponents,`${width}x${height}/${n}: ${JSON.stringify(metrics)}`);
   assert.ok(metrics.opponent>.87&&metrics.opponent<.93&&metrics.partner>.92&&metrics.partner<.97&&metrics.discard===1,JSON.stringify(metrics));
   if(n===30)await page.screenshot({path:path.join(out,`${width}x${height}-compacta.png`)});
  }
  console.log('PASS 30 layouts: leque único contínuo/centrado, 15/20/30/40/60/100 cartas, superior ao lado e mais alto; bots menores e parceiro legível');
  await page.setViewportSize({width:390,height:844});
  for(const n of [15,20,30,40,60,100]){
   await fixture(n);await settle();assert.ok(await page.locator('#hand').evaluate(el=>el.classList.contains('grouped-hand')));
   const groups=await page.locator('#hand>button').evaluateAll(ns=>ns.map(n=>n.dataset.handColor));assert.deepEqual([...new Set(groups)],['red','blue','green','yellow','wild']);
   const before=await page.evaluate(()=>CartasTest.getState().players[0].hand.map(c=>c.id).join());
   await tap(930001);await settle();assert.equal(await page.locator('#hand').getAttribute('data-expanded-color'),'blue');assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.map(c=>c.id).join()),before);
   assert.equal(await page.locator('#hand>.group-expanded').count(),groups.filter(c=>c==='blue').length);
   const gaps=await page.locator('#hand>button').evaluateAll(ns=>ns.slice(1).map((n,i)=>({previous:ns[i].dataset.handColor,gap:n.getBoundingClientRect().x-ns[i].getBoundingClientRect().x})));assert.ok(gaps.filter(g=>g.previous==='blue').every(g=>g.gap>Math.max(...gaps.filter(g=>g.previous!=='blue').map(g=>g.gap))+5));
   await page.touchscreen.tap(195,400);await settle();assert.equal(await page.locator('#hand').getAttribute('data-expanded-color'),null);
  }
  console.log('PASS toque expande somente a cor, primeiro toque não joga; demais cores compactas conectadas; toque externo recolhe');
  await fixture(40);await settle();await tap(930001);await settle();await tap(930005);await settle();assert.equal(await page.locator('#hand').getAttribute('data-expanded-color'),'red');
  const count=await page.evaluate(()=>CartasTest.getState().players[0].hand.length);await tap(930005);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),count);assert.equal(await page.locator('.played-card').count(),0);
  await tap(930001);await settle();const origin=await page.locator('[data-card="930001"] .card').boundingBox();await tap(930001);
  assert.equal(await page.evaluate(()=>CartasTest.getState().discard[CartasTest.getState().discard.length-1].id),930001);
  const flight=await page.locator('.played-card').evaluate(el=>({...el.dataset}));assert.ok(Math.abs(Number(flight.originX)-(origin.x+origin.width/2))<1);assert.ok(Math.abs(Number(flight.originY)-(origin.y+origin.height/2))<1);await finish();
  console.log('PASS troca de grupo, carta inválida não joga e descarte parte da carta real no leque expandido');
  for(const n of [40,100]){
   await fixture(n,true);await settle();await tap(930000+n-1);await settle();assert.ok(await point(930000+n-1));
   assert.ok(await page.locator('#hand').evaluate(el=>el.classList.contains('hand-overflow')&&el.scrollWidth>el.clientWidth));
   for(const i of [0,Math.floor(n/2),n-1]){await page.locator(`[data-card="${930000+i}"]`).scrollIntoViewIfNeeded();assert.ok(await point(930000+i));}
   assert.equal(await page.locator('#table').evaluate(el=>el.scrollLeft+el.scrollTop),0);
  }
  console.log('PASS cor única com 40/100 cartas: sobreposição adaptada e acesso às primeiras/intermediárias/últimas por rolagem apenas da mão');
  await fixture(40);await page.evaluate(()=>document.getElementById('testPenalty').click());await page.locator('#buyBtn').tap();assert.equal(await page.locator('.drawn-card').count(),20);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),60);await finish();assert.equal(await page.locator('.flying-card').count(),0);
  await fixture(40,true);await settle();await tap(930039);await settle();
  const idsBefore=await page.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(p=>p.hand)].map(c=>c.id).sort().join());
  await page.evaluate(()=>{const s=CartasTest.getState();s.o.timeout=15;s.penalty=20;s.highest=2;s.deadline=Date.now()+100;s.token++});await page.clock.runFor(350);
  assert.equal(await page.locator('#hand').getAttribute('data-expanded-color'),'blue');assert.equal(await page.locator('.drawn-card').count(),20);assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),60);await finish();
  assert.equal(await page.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()),idsBefore);
  console.log('PASS compra automática +20 com grupo aberto: prazo real, cartas individuais, grupo preservado e conservação de IDs');
  await fixture(40);await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand.push({id:950000,type:'num',color:'blue',num:9});s.current=2;s.cutOpen=true;s.unlockAt=Date.now()+2200;s.lastActor=1;document.getElementById('useCardArt').onchange();s.token++});await page.locator('#cutBtn .cut-bubble').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().discard[CartasTest.getState().discard.length-1].id),950000);await finish();
  console.log('PASS compra +20 individual e corte direto na faca em mão compacta sem bloquear a janela de 2,2s');
  const clean=await page.evaluate(()=>{const msg=getComputedStyle(document.getElementById('centerMsg')),dir=getComputedStyle(document.getElementById('directionIndicator'));return {labels:document.querySelectorAll('.discard-stack .stack-label').length,msg:msg.clip,dir:dir.clip}});assert.equal(clean.labels,0);assert.match(clean.msg,/rect/);assert.match(clean.dir,/rect/);
  for(const dir of [1,-1]){
   await page.evaluate(dir=>{const s=CartasTest.getState();s.direction=dir;document.getElementById('useCardArt').onchange()},dir);
   const tail=await page.locator(`.tail-${dir===1?'counterclockwise':'clockwise'}.tail-long`).evaluate(el=>{
    // A transição de opacidade também aparece em getAnimations; escolha o fluxo pelo nome.
    const a=el.getAnimations().find(a=>a.animationName==='stove-flow');if(!a)throw Error('Cauda sem animação stove-flow');
    a.pause();a.currentTime=1000;const first=Number(getComputedStyle(el).strokeDashoffset.match(/-?[\d.]+/)[0]);a.currentTime=1500;
    return {dash:getComputedStyle(el).strokeDasharray,iterations:a.effect.getTiming().iterations,direction:a.effect.getTiming().direction,first,second:Number(getComputedStyle(el).strokeDashoffset.match(/-?[\d.]+/)[0])};
   });
   assert.match(tail.dash,/220/);assert.equal(tail.direction,dir===1?'reverse':'normal');assert.equal(tail.iterations,Infinity);
   assert.ok(Math.abs(Math.abs(tail.second-tail.first)-1000/15)<.1);assert.ok(dir===1?tail.second>tail.first:tail.second<tail.first);
  }
  console.log('PASS centro sem rótulos redundantes, rastro circular 220/1000 e animação derivada da direção do motor');
  // Desktop: gesto físico do mouse, espera estável e primeiro clique só fixa a expansão.
  const desktop=await browser.newPage({viewport:{width:1000,height:700}});desktop.on('pageerror',e=>errors.push(e.message));await desktop.clock.install();await desktop.clock.pauseAt(new Date());await desktop.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await desktop.locator('#singlePlayerBtn').click();await desktop.locator('#profileContinueBtn').click();await desktop.locator('#startBtn').click();
  await desktop.evaluate(()=>{const s=CartasTest.getState();s.current=0;s.unlockAt=0;s.penalty=0;s.cutOpen=false;s.token++;s.o.timeout=0;s.activeColor='blue';s.players[0].hand=Array.from({length:40},(_,i)=>({id:960000+i,type:'num',color:['red','blue','green','yellow'][i%4],num:i%7}));document.getElementById('useCardArt').onchange()});
  const at=await point(960001,desktop);assert.ok(at);await desktop.mouse.move(at.x,at.y);await desktop.clock.runFor(179);assert.equal(await desktop.locator('#hand').getAttribute('data-expanded-color'),null);await desktop.clock.runFor(1);assert.equal(await desktop.locator('#hand').getAttribute('data-expanded-color'),'blue');
  await desktop.locator('#hand>button').evaluateAll(ns=>Promise.all(ns.flatMap(n=>n.getAnimations().map(a=>a.finished.catch(()=>{})))));const pinned=await point(960001,desktop);await desktop.mouse.click(pinned.x,pinned.y);assert.equal(await desktop.evaluate(()=>CartasTest.getState().players[0].hand.length),40);await desktop.mouse.move(500,300);await desktop.clock.runFor(600);assert.equal(await desktop.locator('#hand').getAttribute('data-expanded-color'),'blue');await desktop.mouse.click(500,300);assert.equal(await desktop.locator('#hand').getAttribute('data-expanded-color'),null);await desktop.close();
  assert.deepEqual(errors,[]);console.log('PASS mouse com intenção de 180ms, clique fixa sem jogar, ausência de recolhimento sensível e clique externo fecha; sem exceções JS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
