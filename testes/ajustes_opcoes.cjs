const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/ajustes-opcoes-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const refresh=()=>p.evaluate(()=>document.getElementById('useCardArt').onchange());
 const settle=()=>p.locator('#hand,#hand>button,.subhand>.card,.back>.hidden-card,#pileAura').evaluateAll(es=>Promise.all(es.flatMap(e=>e.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
 const fixture=(options={})=>p.evaluate(options=>{
  document.getElementById('table').click();const s=CartasTest.getState();
  Object.assign(s,{phase:'playing',current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'blue',direction:1,finisher:null,lastActor:null,deadline:0,unoWindow:null,preUno:false,lastDistribution:null,token:s.token+1});
  Object.assign(s.o,{duo:false,single:true,timeout:0,infinite:false,cut:true,challenge:true,wild6:true});
  s.players.forEach((p,a)=>p.hand=Array.from({length:options.n||7},(_,i)=>({id:500000+a*1000+i,type:'num',color:'red',num:i%8})));
  s.discard=[{id:510000,type:'num',color:'blue',num:9}];s.deck=Array.from({length:120},(_,i)=>({id:520000+i,type:'num',color:'green',num:i%8}));
  const {n,...rest}=options;Object.assign(s,rest);document.getElementById('useCardArt').onchange();
 },options);
 const ids=()=>p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort((a,b)=>a-b).join()});
 const playPressure=()=>p.evaluate(()=>{const card=document.querySelector('[data-card="500000"]');card.click();if(card.isConnected&&CartasTest.getState().players[0].hand.some(c=>c.id===500000)&&document.getElementById('hand').classList.contains('grouped-hand'))card.click();});
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();
  await p.locator('.route-ghost').waitFor({state:'hidden'});
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800],[390,844]]){
   await p.setViewportSize({width,height});assert.equal(await p.locator('#menu fieldset').count(),2);assert.equal(await p.locator('#menu label.setting').count(),10);
   for(const id of ['mode','duration','goal','timeout','infinite','cut','challenge','wild6','dist','rotate']){
    const control=p.locator('#'+id),label=control.locator('..');await label.scrollIntoViewIfNeeded();
    const hit=await control.evaluate(e=>{const r=e.getBoundingClientRect(),label=e.closest('label').getBoundingClientRect(),menu=document.getElementById('menu').getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))&&r.left>=menu.left&&r.right<=menu.right&&label.height>=44});assert.ok(hit,`${id} inacessível ${width}x${height}`);
    if(await control.getAttribute('type')==='checkbox'){const checked=await control.isChecked();await label.tap();assert.equal(await control.isChecked(),!checked);await label.tap();assert.equal(await control.isChecked(),checked);}
   }
   await p.locator('#menu .settings-grid').evaluate(e=>e.scrollTop=0);
   await p.screenshot({path:path.join(out,`opcoes-${width}x${height}.png`)});
  }
  await p.setViewportSize({width:844,height:390});await p.locator('#mode').selectOption('duo');await p.locator('#goal').selectOption('10');await p.locator('#timeout').selectOption('45');
  for(const [id,checked] of [['infinite',true],['cut',false],['challenge',false],['wild6',false],['rotate',false]])await p.locator('#'+id).setChecked(checked);
  await p.locator('#startBtn').tap();
  assert.deepEqual(await p.evaluate(()=>{const {duo,single,goal,timeout,infinite,cut,challenge,wild6,dist,rotate}=CartasTest.getState().o;return {duo,single,goal,timeout,infinite,cut,challenge,wild6,dist,rotate}}),{duo:true,single:false,goal:10,timeout:45,infinite:true,cut:false,challenge:false,wild6:false,dist:true,rotate:false});
  console.log('PASS opções temáticas: seis telas, dez controles acessíveis por toque/teclado nativo; mesmas configurações aplicadas ao iniciar');
  await p.evaluate(()=>{window.__colorCalls=[];const open=PanelinhaColorPicker.open;PanelinhaColorPicker.open=(root,options)=>{window.__colorCalls.push(options.cardType);return open(root,options)}});
  for(const penalty of [0,2,6,20,40])for(const duo of [false,true]){
   await fixture({penalty,highest:penalty?6:0});await p.evaluate(duo=>{const s=CartasTest.getState();s.o.duo=duo;s.players[0].hand[0]={id:500000,type:'dist',color:null};document.getElementById('useCardArt').onchange()},duo);
   const before=await ids();await playPressure();assert.equal(await p.locator('.color-picker').count(),0);assert.deepEqual(await p.evaluate(()=>window.__colorCalls),[]);
   assert.ok(await p.evaluate(()=>{const s=CartasTest.getState();return !s.pendingAction&&s.activeColor==='blue'&&s.lastDistribution&&s.penalty===0}));assert.equal(await ids(),before);
  }
  for(const cut of [false,true]){
   await fixture({current:cut?2:0,lastActor:cut?1:null,cutOpen:cut,unlockAt:cut?Date.now()+2200:0});
   await p.evaluate(cut=>{const s=CartasTest.getState();s.players[0].hand[0]={id:500000,type:'dist',color:null};if(cut){s.unlockAt=Date.now()+2200;s.discard=[{id:510000,type:'dist',color:null}]}else s.players[0].hand.length=1;document.getElementById('useCardArt').onchange()},cut);
   await playPressure();assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');
  }
  await fixture();await p.evaluate(()=>{CartasTest.getState().deck.push({id:530000,type:'dist',color:null});document.getElementById('useCardArt').onchange()});await p.locator('#buyBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().drawn),530000);
  await p.evaluate(()=>{const c=document.querySelector('[data-card="530000"]');c.click();if(c.isConnected&&CartasTest.getState().players[0].hand.some(c=>c.id===530000))c.click()});assert.equal(await p.evaluate(()=>CartasTest.getState().discard.at(-1).id),530000);assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');
  for(const actor of [1,2,3]){
   await fixture({direction:actor===3?-1:1});await p.evaluate(actor=>{const s=CartasTest.getState();s.players[0].hand[0]={id:500000,type:actor===2?'skip':'num',color:'blue',num:1};document.getElementById('useCardArt').onchange();document.querySelector('[data-card="500000"]').click();s.players[actor].hand[0]={id:500000+actor*1000,type:'dist',color:null};s.penalty=20;s.highest=6;document.getElementById('useCardArt').onchange()},actor);
   const before=await ids();await p.clock.runFor(2250);assert.equal(await p.evaluate(()=>CartasTest.getState().lastActor),actor);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');assert.equal(await p.evaluate(()=>CartasTest.getState().discard.at(-1).type),'dist');assert.equal(await ids(),before);
  }
  await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand[0]={id:500000,type:'dist',color:null};document.getElementById('useCardArt').onchange();document.querySelector('[data-card="500000"]').click();s.players[2].hand[0]={id:540000,type:'dist',color:null};window.__beforeBotCutRandom=Math.random;Math.random=()=>0;});
  const beforeCut=await ids();await p.clock.runFor(750);assert.equal(await p.evaluate(()=>CartasTest.getState().lastActor),2);assert.equal(await p.evaluate(()=>CartasTest.getState().discard.at(-1).id),540000);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');assert.equal(await ids(),beforeCut);await p.evaluate(()=>Math.random=window.__beforeBotCutRandom);
  assert.deepEqual(await p.evaluate(()=>window.__colorCalls),[]);
  await fixture();assert.equal(await p.evaluate(()=>PanelinhaColorPicker.open(document.getElementById('modalRoot'),{cardType:'dist',choose(){throw Error('cor indevida')},cancel(){}})),false);assert.equal(await p.locator('.color-picker').count(),0);
  console.log('PASS Panela sem chamar seletor: normal, +2/+6/+20/+40, duplas, última carta, corte, compra e três bots; cor/IDs preservados e componente recusa dist');
  for(const [width,height] of [[568,320],[844,390],[1280,800]])for(const n of [7,20,40]){
   await p.setViewportSize({width,height});await fixture({n});await settle();
   const shape=await p.evaluate(()=>{
    const seat=document.getElementById('player2'),cards=[...seat.querySelectorAll('[data-hand-card]')].map(n=>n.getBoundingClientRect()),identity=seat.querySelector('.seat-identity').getBoundingClientRect();
    const svg=document.getElementById('pileAura'),a=svg.getBoundingClientRect(),layers=[...document.querySelectorAll('#pile>.deck-back')].map(n=>n.getBoundingClientRect()),lo={x:Math.min(...layers.map(r=>r.left)),y:Math.min(...layers.map(r=>r.top)),right:Math.max(...layers.map(r=>r.right)),bottom:Math.max(...layers.map(r=>r.bottom))};
    const orbit=document.getElementById('stoveOrbit'),m=orbit.getScreenCTM(),point=(x,y)=>new DOMPoint(x,y).matrixTransform(m),c=point(245,245),x=point(465,245),y=point(245,439),burner=document.getElementById('burner').getBoundingClientRect();
    return {gap:Math.min(...cards.map(r=>r.left))-identity.right,center:Math.abs((Math.min(...cards.map(r=>r.left))+Math.max(...cards.map(r=>r.right)))/2-innerWidth/2),margins:[lo.x-a.left,a.right-lo.right,lo.y-a.top,a.bottom-lo.bottom],images:svg.querySelectorAll('image').length,glowPointer:getComputedStyle(svg).pointerEvents,tag:orbit.tagName,ratio:Math.hypot(x.x-c.x,x.y-c.y)/Math.hypot(y.x-c.x,y.y-c.y),dx:c.x-burner.x-burner.width/2,dy:c.y-burner.y-burner.height/2};
   });
   assert.ok(shape.gap>=10&&shape.gap<=15&&shape.center<1.5,JSON.stringify({width,height,n,shape}));assert.ok(shape.margins.every(x=>Math.abs(x-18)<.1),JSON.stringify({width,height,n,shape}));assert.equal(shape.images,6);assert.equal(shape.glowPointer,'none');assert.equal(shape.tag,'ellipse');assert.ok(Math.abs(shape.ratio-220/194)<.001&&Math.abs(shape.dx)<.1&&Math.abs(shape.dy)<.1);
   if(n===7){await p.locator('.stove-glint').evaluate(e=>{const a=e.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity);a.pause();a.currentTime=1400});await p.screenshot({path:path.join(out,`mesa-normal-${width}x${height}.png`)});}
  }
  for(const [penalty,highest,response,expected] of [[0,0,'num',true],[2,2,'num',true],[4,4,'num',true],[6,6,'num',true],[20,6,'num',true],[2,2,'draw2',false],[4,4,'wild4',false],[6,6,'wild6',false],[20,6,'dist',false]]){
   await fixture({penalty,highest});if(response!=='num')await p.evaluate(response=>{CartasTest.getState().players[0].hand[0]={id:500000,type:response,color:response==='draw2'?'yellow':null};document.getElementById('useCardArt').onchange()},response);
   assert.equal(await p.locator('#buyBtn').getAttribute('data-mandatory'),String(expected));assert.equal(await p.locator('#pileAura').evaluate(e=>e.getAnimations().some(a=>a.animationName==='pile-aura-pulse')),expected);
   if(expected&&penalty===20)await p.screenshot({path:path.join(out,'monte-obrigatorio.png')});
  }
  console.log('PASS elipse 220×194 concêntrica; card junto ao leque centrado; halo com 18px simétricos nas quatro bordas, seis silhuetas e reforço apenas sem resposta legal');
  const desktop=await b.newPage({viewport:{width:1280,height:800}});
  await desktop.clock.install();await desktop.clock.pauseAt(new Date());await desktop.goto(base);await desktop.locator('#singlePlayerBtn').click();await desktop.locator('#profileContinueBtn').click();
  await desktop.locator('#wild6').focus();await desktop.keyboard.press('Space');assert.equal(await desktop.locator('#wild6').isChecked(),false);await desktop.keyboard.press('Space');assert.equal(await desktop.locator('#wild6').isChecked(),true);await desktop.locator('#startBtn').click();
  const point=()=>desktop.locator('[data-card="600001"]').evaluate(el=>{const r=el.getBoundingClientRect();for(const dy of [.25,.5,.75])for(let x=1;x<r.width-1;x++){const px=r.x+x,py=r.y+r.height*dy;if(el.contains(document.elementFromPoint(px,py)))return {x:px,y:py}}return null});
  const hoverCheck=async n=>{
   const button=desktop.locator('[data-card="600001"]');await desktop.mouse.move(0,0);
   const metrics=()=>button.evaluate(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,card:el.querySelector('.card').getBoundingClientRect().y,neighbors:[...el.parentElement.children].filter(n=>n!==el).map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y]})}));
   const before=await metrics(),at=await point();assert.ok(at);await desktop.mouse.move(at.x,at.y);await button.locator('.card').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));const after=await metrics();
   assert.ok(after.card<before.card-5);assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.deepEqual(after.neighbors,before.neighbors);assert.equal(await desktop.evaluate(()=>CartasTest.getState().players[0].hand.length),n);
   await desktop.mouse.move(0,0);await button.locator('.card').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));assert.ok(Math.abs((await metrics()).card-before.card)<.1);
  };
  for(const n of [7,40]){
   await desktop.evaluate(n=>{const s=CartasTest.getState();Object.assign(s,{current:0,unlockAt:0,penalty:0,cutOpen:false,pendingAction:null,activeColor:'blue',token:s.token+1});s.o.timeout=0;s.players[0].hand=Array.from({length:n},(_,i)=>({id:600000+i,type:'num',color:['red','blue','green','yellow'][i%4],num:i%7}));document.getElementById('useCardArt').onchange()},n);
   await desktop.locator('#hand,#hand>button').evaluateAll(es=>Promise.all(es.flatMap(e=>e.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));await hoverCheck(n);
   if(n===40){assert.equal(await desktop.locator('#hand').getAttribute('data-expanded-color'),null);await desktop.locator('[data-card="600001"]').dispatchEvent('click');await desktop.locator('#hand>button').evaluateAll(es=>Promise.all(es.flatMap(e=>e.getAnimations().map(a=>a.finished.catch(()=>{})))));await hoverCheck(n);}
  }
  await desktop.close();console.log('PASS hover real no leque normal, compacto fechado e expandido: elevação suave, retorno, vizinhos imóveis e nenhuma jogada; toggle acessível por Espaço');
  assert.deepEqual(errors,[]);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
