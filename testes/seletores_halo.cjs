const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/seletores-halo-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const trigger=id=>p.locator(`[data-select-for="${id}"]`),list=p.locator('#panelinhaSelectList');
 const shut=async()=>{await list.waitFor({state:'hidden'});assert.equal(await p.evaluate(()=>PanelinhaSelects.isOpen),false)};
 const choose=async(id,value)=>{await trigger(id).tap();await p.locator(`[role=option][data-value="${value}"]`).tap();await shut();assert.equal(await p.locator('#'+id).inputValue(),value)};
 const refresh=()=>p.evaluate(()=>document.getElementById('useCardArt').onchange());
 const fixture=(extra={})=>p.evaluate(extra=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,unlockAt:0,penalty:0,highest:0,lastPenalty:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'blue',direction:1,finisher:null,lastActor:null,deadline:0,unoWindow:null,preUno:false,token:s.token+1});
  Object.assign(s.o,{duo:false,single:true,timeout:0,infinite:false,cut:true,challenge:true,wild6:true});
  s.players.forEach((p,a)=>p.hand=Array.from({length:7},(_,i)=>({id:700000+a*100+i,type:'num',color:'red',num:i%8})));
  s.deck=Array.from({length:100},(_,i)=>({id:710000+i,type:'num',color:'green',num:i%8}));s.discard=[{id:720000,type:'num',color:'blue',num:9}];
  Object.assign(s,extra);document.getElementById('useCardArt').onchange();
 },extra);
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('.route-ghost').waitFor({state:'hidden'});
  assert.equal(await p.getByRole('combobox').count(),4);
  assert.ok(await p.locator('select').evaluateAll(es=>es.every(e=>e.getAttribute('aria-hidden')==='true'&&e.tabIndex===-1&&getComputedStyle(e).pointerEvents==='none'&&e.getBoundingClientRect().height<=1)));
  await p.evaluate(()=>{window.__changes=0;window.__nativePointer=0;document.getElementById('timeout').addEventListener('change',()=>window.__changes++);document.querySelectorAll('select').forEach(s=>s.addEventListener('pointerdown',()=>window.__nativePointer++))});
  await choose('timeout','15');assert.equal(await p.evaluate(()=>window.__changes),1);await choose('timeout','15');assert.equal(await p.evaluate(()=>window.__changes),1);assert.equal(await p.evaluate(()=>window.__nativePointer),0);assert.match(await trigger('timeout').textContent(),/15 s/);
  await choose('mode','duo');assert.deepEqual(await p.locator('#goal option').evaluateAll(es=>es.map(e=>e.value)),['5','10','15']);await choose('goal','15');await choose('mode','duo');assert.equal(await p.locator('#goal').inputValue(),'15');
  await choose('duration','single');assert.ok(await trigger('goal').isDisabled());await choose('duration','points');assert.ok(await trigger('goal').isEnabled());
  for(const [width,height] of [[568,320],[667,375],[844,390],[915,412],[1280,800],[390,844]])for(const id of ['mode','duration','goal','timeout']){
   await p.setViewportSize({width,height});await trigger(id).scrollIntoViewIfNeeded();await trigger(id).tap();await list.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));
   const metrics=await list.evaluate(e=>{const r=e.getBoundingClientRect();return {inside:r.left>=8&&r.top>=8&&r.right<=innerWidth-7&&r.bottom<=innerHeight-7,selected:e.querySelectorAll('[aria-selected=true]').length,targets:[...e.querySelectorAll('[role=option]')].every(n=>n.getBoundingClientRect().height>=44),background:getComputedStyle(e).backgroundImage}});
   assert.ok(metrics.inside&&metrics.targets&&metrics.selected===1,`${width}x${height}/${id}: ${JSON.stringify(metrics)}`);assert.match(metrics.background,/gradient/);
   if(id==='timeout'&&(width===568||width===844))await p.screenshot({path:path.join(out,`lista-${width}x${height}.png`)});
   const before=await p.locator('#'+id).inputValue();await p.mouse.click(width-2,height-2);await shut();assert.equal(await p.locator('#'+id).inputValue(),before);
  }
  await p.setViewportSize({width:568,height:320});await trigger('timeout').tap();await p.setViewportSize({width:568,height:240});assert.ok(await list.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=8&&r.bottom<=innerHeight-7}));
  await list.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{}))));
  const touch=await p.context().newCDPSession(p),box=await list.boundingBox(),beforeScroll=await list.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,total:e.scrollHeight,open:PanelinhaSelects.isOpen}));await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-20}]});
  for(let i=1;i<=8;i++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-20-i*Math.min(100,box.height-50)/8}]});await new Promise(resolve=>setTimeout(resolve,20));}
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.clock.runFor(200);
  const afterScroll=await list.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,total:e.scrollHeight,open:PanelinhaSelects.isOpen}));assert.ok(afterScroll.top>0,JSON.stringify({box,beforeScroll,afterScroll}));assert.equal(await p.evaluate(()=>PanelinhaSelects.isOpen),true);await touch.detach();await p.evaluate(()=>PanelinhaSelects.close());await shut();await p.setViewportSize({width:844,height:390});
  await trigger('timeout').tap();await p.evaluate(()=>PanelinhaNavigation.back({native:true}));await shut();assert.equal(await p.evaluate(()=>PanelinhaNavigation.current),'solo');
  await trigger('timeout').tap();await p.goBack();await shut();assert.equal(await p.evaluate(()=>PanelinhaNavigation.current),'solo');await p.goBack();await p.waitForFunction(()=>PanelinhaNavigation.current==='profile');await p.locator('#profileContinueBtn').tap();
  await choose('timeout','30');await p.locator('#startBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().o.timeout),30);await fixture();
  console.log('PASS popovers locais nos quatro seletores: valores/callbacks, estado selecionado, meta dinâmica/desabilitada, 24 layouts, altura 240px, toque fora e Voltar web/nativo');
  await p.locator('#tableMenuBtn').tap();await p.locator('.debug summary').tap();assert.equal(await p.getByRole('combobox').count(),2);await choose('injectType','dist');await choose('injectColor','green');
  const count=await p.evaluate(()=>CartasTest.getState().players[0].hand.length);await p.locator('#injectBtn').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().players[0].hand.length),count+1);assert.equal(await p.evaluate(()=>CartasTest.getState().players[0].hand.at(-1).type),'dist');
  await trigger('injectType').tap();await p.evaluate(()=>PanelinhaNavigation.back({native:true}));await shut();assert.ok(await p.locator('#tableMenu').isVisible());await p.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.ok(await p.locator('#tableMenu').isHidden());
  console.log('PASS laboratório usa o mesmo componente, injeta a carta correta e Voltar fecha a lista antes do laboratório');
  for(const [width,height] of [[568,320],[844,390],[1280,800]]){
   await p.setViewportSize({width,height});await fixture();
   const pose=await p.evaluate(()=>{const r=id=>document.getElementById(id).getBoundingClientRect(),o=r('stoveDirection'),b=r('burner'),d=r('discard'),scene=r('stoveScene'),e=document.getElementById('stoveOrbit');return {dx:o.x+o.width/2-b.x-b.width/2,dy:o.y+o.height/2-b.y-b.height/2,bx:b.x+b.width/2-(scene.x+scene.width*836/1672),by:b.y+b.height/2-(scene.y+scene.height*451/941),discardX:d.x+d.width/2-b.x-b.width/2,rx:e.getBBox().width/2,ry:(e.getBBox().height-2/(o.width/490))/2,speed:e.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity).effect.getTiming().duration}});
   assert.ok(Math.abs(pose.dx+4)<.1&&Math.abs(pose.dy)<.1&&Math.abs(pose.bx)<.1&&Math.abs(pose.by)<.1&&Math.abs(pose.discardX)<.1);assert.ok(Math.abs(pose.rx-220)<.001&&Math.abs(pose.ry-194)<.001);assert.equal(pose.speed,7500);
  }
  const cases=[['sem carta',{},true],['com carta',{valid:'num'},false],['voluntária',{valid:'num'},false],['bot',{current:1},false],['penalidade +2',{penalty:2,highest:2},true],['penalidade +4',{penalty:4,highest:4},true],['penalidade +6',{penalty:6,highest:6},true],['resposta +2',{penalty:2,highest:2,valid:'draw2'},false],['resposta +4',{penalty:4,highest:4,valid:'wild4'},false],['resposta +6',{penalty:6,highest:6,valid:'wild6'},false],['resposta Panela',{penalty:20,highest:6,valid:'dist'},false],['desafio',{penalty:6,highest:6,lastPenalty:{id:3,type:'wild6',challengeable:true}},true],['já comprou',{drawn:700000},false],['pausa',{locked:true},false],['encerrada',{phase:'roundOver'},false]];
  for(const [name,{valid,locked,...data},expected] of cases){
   await fixture(data);await p.evaluate(({valid,locked})=>{const s=CartasTest.getState();if(valid)s.players[0].hand[0]={id:700000,type:valid,color:valid==='num'?'blue':null,num:4};if(locked)s.unlockAt=Date.now()+2200;document.getElementById('useCardArt').onchange()},{valid,locked});
   assert.equal(await p.locator('#pileAura').isVisible(),expected,name);assert.equal(await p.locator('#buyBtn').getAttribute('data-mandatory'),String(expected),name);
  }
  await fixture({penalty:20,highest:6});await p.screenshot({path:path.join(out,'halo-compra-obrigatoria.png')});
  // Renderização da máscara em memória, sem editar qualquer PNG de produção.
  const gaps=await p.evaluate(async()=>{
   const source=document.getElementById('pileAura'),copy=source.cloneNode(true),w=parseFloat(source.style.width),h=parseFloat(source.style.height),factor=4;
   const png=await (await fetch('assets/padronizadas/verso_oficial_400x850.png')).blob(),data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(png)});
   copy.removeAttribute('style');copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',w);copy.setAttribute('height',h);copy.querySelectorAll('image').forEach(i=>i.setAttribute('href',data));
   const render=async svg=>{const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const c=document.createElement('canvas');c.width=Math.ceil(w*factor);c.height=Math.ceil(h*factor);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,c.width,c.height);return {data:ctx.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height}}finally{URL.revokeObjectURL(url)}};
   const halo=await render(copy);copy.querySelector('g').removeAttribute('filter');const ref=await render(copy);const alpha=(r,x,y)=>r.data[(y*r.w+x)*4+3];
   const cx=Math.floor(ref.w/2),cy=Math.floor(ref.h/2),edge=(vertical,sign)=>{const len=vertical?ref.h:ref.w,start=sign<0?0:len-1,step=sign<0?1:-1;let at=start;while(at>=0&&at<len&&(vertical?alpha(ref,cx,at):alpha(ref,at,cy))<8)at+=step;let pixel=at;while(pixel>=0&&pixel<len&&(vertical?alpha(halo,cx,pixel):alpha(halo,pixel,cy))<8)pixel-=step;return Math.abs(pixel-at)/factor};
   let overlap=0;for(let y=0;y<ref.h;y++)for(let x=0;x<ref.w;x++)if(alpha(ref,x,y)>8&&alpha(halo,x,y)>8)overlap++;
   return {distance:[edge(true,-1),edge(true,1),edge(false,-1),edge(false,1)],overlap};
  });assert.equal(gaps.overlap,0);assert.ok(gaps.distance.every(n=>n>=4.25&&n<=6.5),JSON.stringify(gaps));assert.ok(Math.max(...gaps.distance)-Math.min(...gaps.distance)<=.75,JSON.stringify(gaps));
  await fixture({current:1});assert.ok(await p.locator('#pileAura').isHidden());
  console.log('PASS órbita -4px CSS em três escalas sem mover chama/descarte; 15 condições reais de compra; halo sem sobreposição e vão externo simétrico medido nos pixels: '+gaps.distance.join('/'));
  const d=await browser.newPage({viewport:{width:1280,height:800}});await d.goto(base);await d.locator('#singlePlayerBtn').click();await d.locator('#profileContinueBtn').click();const button=d.locator('[data-select-for=timeout]');await button.focus();await d.keyboard.press('Enter');
  await d.keyboard.press('End');await d.keyboard.press('Enter');await d.locator('#panelinhaSelectList').waitFor({state:'hidden'});assert.equal(await d.locator('#timeout').inputValue(),'60');await d.keyboard.press('Space');await d.keyboard.press('Home');await d.keyboard.press('ArrowDown');await d.keyboard.press('Enter');assert.equal(await d.locator('#timeout').inputValue(),'15');
  await button.click();await d.getByRole('option',{name:'30 s',exact:true}).hover();assert.ok(await d.getByRole('option',{name:'30 s',exact:true}).evaluate(e=>e.classList.contains('is-active')));await d.getByRole('option',{name:'30 s',exact:true}).click();assert.equal(await d.locator('#timeout').inputValue(),'30');
  await button.focus();await d.keyboard.press('Enter');await d.keyboard.press('Escape');assert.equal(await d.evaluate(()=>PanelinhaNavigation.current),'solo');await d.locator('#panelinhaSelectList').waitFor({state:'hidden'});await button.click();await d.keyboard.press('Tab');assert.equal(await button.getAttribute('aria-expanded'),'false');
  await d.emulateMedia({reducedMotion:'reduce'});await button.click();assert.equal(await d.locator('#panelinhaSelectList').evaluate(e=>e.getAnimations().length),0);await d.context().setOffline(true);await d.getByRole('option',{name:'45 s',exact:true}).click();assert.equal(await d.locator('#timeout').inputValue(),'45');await d.close();
  assert.deepEqual(errors,[]);console.log('PASS mouse, hover, teclado Home/End/setas/Enter/Espaço/Tab/Escape, opção selecionada, movimento reduzido e escolha offline; sem erros JS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
