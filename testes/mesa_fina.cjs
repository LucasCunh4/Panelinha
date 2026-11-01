const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const output=process.env.PANELAS_SCREENSHOTS||'/workspace/work/mesa-fina-evidence';
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const fixture=()=>page.evaluate(()=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'blue',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,round:s.round+1,token:s.token+1});Object.assign(s.o,{duo:true,single:false,timeout:0,cut:true,infinite:false});
  s.discard=[{id:900000,type:'num',color:'blue',num:2}];s.deck=Array.from({length:100},(_,i)=>({id:910000+i,type:'num',color:'green',num:7}));
  s.players.forEach((p,a)=>p.hand=Array.from({length:7},(_,i)=>({id:920000+a*100+i,type:'num',color:'blue',num:i%10})));
  document.getElementById('useCardArt').onchange();
 });
 const finish=async()=>{await page.locator('.flying-card,.block-effect').evaluateAll(nodes=>nodes.forEach(n=>n.getAnimations().forEach(a=>a.finish())));await page.waitForFunction(()=>!document.querySelector('.flying-card,.block-effect'));};
 try{
  await page.clock.install();await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await page.locator('#singlePlayerBtn').click();await page.locator('#profileContinueBtn').click();await page.locator('#mode').selectOption('duo');await page.locator('#startBtn').tap();
  for(const [width,height] of [[320,568],[390,844],[412,915],[568,320],[844,390],[1280,800]]){
   await page.setViewportSize({width,height});await fixture();
   await page.locator('#hand>button,.subhand>.card,.back>.hidden-card').evaluateAll(nodes=>Promise.all(nodes.flatMap(n=>n.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))));
   const layout=await page.evaluate(()=>{
    const r=id=>document.getElementById(id).getBoundingClientRect(),pile=r('pile'),buy=r('buyBtn'),discard=r('discard'),bg=r('stoveScene'),self=r('player0');
    const flameCenter=bg.x+bg.width*836/1672,anchor=bg.x+bg.width*500/1672;
    return {pileLeft:pile.right<discard.left-12,vertical:pile.height>pile.width*1.9,inside:buy.left>=0&&buy.top>=0&&buy.right<=innerWidth&&buy.bottom<=innerHeight,
     touch:document.getElementById('buyBtn').contains(document.elementFromPoint(buy.x+buy.width/2,buy.y+buy.height/2)),
     landscapeAnchor:innerWidth<innerHeight||Math.abs(buy.x+buy.width/2-anchor)<1,
     leftOfFire:pile.x+pile.width/2<flameCenter,
     selfLower:innerWidth>innerHeight||self.top>Math.max(...[...document.querySelectorAll('#hand>button')].map(c=>c.getBoundingClientRect().bottom)),
     noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight};
   });
   for(const [key,value] of Object.entries(layout))assert.ok(value,`${width}x${height}: ${key} ${JSON.stringify(layout)}`);
   await page.locator('.stove-glint').evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=1150});
   await page.screenshot({path:path.join(output,`${width}x${height}-mesa-fina.png`)});
  }
  console.log('PASS monte no interior esquerdo do fogão, alvo direto vertical e nome/avatar humano no rodapé, seis tamanhos');
  await page.setViewportSize({width:390,height:844});await fixture();
  const widths=await page.evaluate(()=>({human:document.querySelector('#hand .card').offsetWidth,opponent:document.querySelector('#player1 .hidden-card').offsetWidth,partner:document.querySelector('#player2 .card').offsetWidth,discard:document.getElementById('discard').offsetWidth}));
  assert.ok(widths.human>76&&widths.human<82&&widths.opponent/widths.human>.87&&widths.opponent/widths.human<.93&&widths.partner/widths.human>.92&&widths.partner/widths.human<.97&&widths.discard===widths.human,JSON.stringify(widths));
  console.log('PASS tamanho humano/descarte preservado e redução discreta dos oponentes/parceiro');
  const orbit=await page.locator('.stove-glint').evaluate(el=>{
   const a=el.getAnimations()[0];a.pause();a.currentTime=1000;const first=parseFloat(getComputedStyle(el).strokeDashoffset);a.currentTime=1500;const second=parseFloat(getComputedStyle(el).strokeDashoffset);
   const bg=document.getElementById('stoveScene').getBoundingClientRect(),svg=document.getElementById('stoveDirection').getBoundingClientRect(),box=el.getBBox();
   return {first,second,forever:a.effect.getTiming().iterations===Infinity,aligned:Math.abs(svg.x-bg.x)<1&&Math.abs(svg.y-bg.y)<1&&Math.abs(svg.width-bg.width)<1&&Math.abs(svg.height-bg.height)<1,box:{x:box.x,y:box.y,width:box.width,height:box.height}};
  });
  assert.ok(orbit.forever&&orbit.aligned&&orbit.second>orbit.first&&orbit.box.x===630&&orbit.box.y===245&&orbit.box.width===412);
  await page.evaluate(()=>{CartasTest.getState().direction=-1;document.getElementById('useCardArt').onchange()});
  const reverse=await page.locator('.stove-glint').evaluate(el=>{const a=el.getAnimations()[0],before=parseFloat(getComputedStyle(el).strokeDashoffset);a.currentTime+=500;return {before,after:parseFloat(getComputedStyle(el).strokeDashoffset),direction:a.effect.getTiming().direction};});
  assert.equal(reverse.direction,'normal');assert.ok(Math.abs(reverse.before-orbit.second)<1&&reverse.after<reverse.before,JSON.stringify(reverse));
  console.log('PASS brilho circular no plano do queimador, giro nos dois sentidos e inversão sem salto de fase');
  const opacity=async color=>{
   await page.evaluate(color=>{const s=CartasTest.getState();s.activeColor=color;document.getElementById('useCardArt').onchange()},color);
   return await page.locator(`.flame-${color}`).evaluate(async el=>{await Promise.all(el.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished));return Number(getComputedStyle(el).opacity)});
  };
  const blue=await opacity('blue'),yellow=await opacity('yellow');assert.ok(Math.abs(yellow/blue-1.15)<.002);
  await page.evaluate(()=>{CartasTest.getState().penalty=20;document.getElementById('useCardArt').onchange()});assert.ok(await opacity('yellow')<=.961);
  console.log('PASS amarelo 15% mais opaco em intensidade normal e limitado em penalidade máxima, sem editar PNG');
  await fixture();await page.locator('#buyBtn').tap();assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),8);
  const single=await page.locator('.drawn-card').evaluate(el=>Number(el.dataset.duration));assert.ok(single>=410&&single<450);await finish();
  await fixture();await page.evaluate(()=>document.getElementById('testPenalty').click());await page.locator('#buyBtn').tap();assert.equal(await page.locator('.drawn-card').count(),20);
  const sequence=await page.locator('.drawn-card').evaluateAll(nodes=>nodes.map(n=>({delay:Number(n.dataset.delay),duration:Number(n.dataset.duration)})));
  assert.ok(sequence.every((t,i)=>t.duration>=370&&(i===0||t.delay>sequence[i-1].delay)));
  assert.ok(sequence.at(-1).delay+sequence.at(-1).duration>1100&&sequence.at(-1).delay+sequence.at(-1).duration<1850);await finish();
  console.log('PASS compras individuais mais legíveis: voo simples >410ms e sequência de vinte entre 1.1 e 1.85s; lógica imediata');
  await fixture();for(let i=0;i<3;i++){await page.evaluate(id=>{const s=CartasTest.getState();s.current=0;s.unlockAt=0;s.cutOpen=false;s.token++;document.getElementById('useCardArt').onchange();document.querySelector(`[data-card="${id}"]`).click()},920000+i);await finish();}
  const poses=await page.locator('.discard-layer').evaluateAll(nodes=>nodes.map(n=>n.style.transform));
  assert.equal(poses.length,3);const lowerAngle=Number(poses[2].match(/rotate\((-?[\d.]+)deg\)/)[1]);assert.ok(lowerAngle<=-4&&lowerAngle>=-14);
  await page.screenshot({path:path.join(output,'pilha-inferiores.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.stove-glint').getAnimations().length===0);
  assert.deepEqual(errors,[]);console.log('PASS três camadas naturais e movimento reduzido sem exceções JS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
