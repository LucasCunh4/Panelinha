const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out='/workspace/work/titulo-pulso-compra';
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  async function fixture(){return page.evaluate(()=>{
    const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
    Object.assign(s,{phase:'playing',current:0,activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,unlockAt:0,presentationUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastActor:null,unoWindow:null,preUno:false});
    Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo:false});let id=50000;
    const card=(type='num',color='red',num=7)=>({id:++id,type,color,num});
    s.players.forEach(p=>p.hand=Array.from({length:6},()=>card()));const dist=card('dist',null);s.players[0].hand.push(dist);
    s.deck=Array.from({length:30},()=>card('num','blue',2));s.discard=[card()];PanelinhaTableBridge.render();return dist.id;
  });}
  try{
    await page.goto('http://127.0.0.1:8000');await page.waitForTimeout(850);
    assert.equal(await page.locator('.title-lid,#home img[src*="tampa"]').count(),0);
    const wave=await page.locator('.title-letter-art').evaluateAll(nodes=>nodes.map(n=>{const a=n.getAnimations().find(a=>a.animationName==='title-piano'),t=a.effect.getTiming();a.pause();a.currentTime=1188;return{delay:t.delay,duration:t.duration,loops:t.iterations===Infinity}}));
    assert.equal(wave.length,9);wave.forEach((t,i)=>{assert.equal(t.delay,900+i*110);assert.equal(t.duration,6400);assert.ok(t.loops)});
    assert.ok(await page.locator('.title-letter-art').first().evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).f<-3));
    for(const [width,height] of [[844,390],[1280,800]]){
      await page.setViewportSize({width,height});const pose=await page.locator('.game-title').evaluate(n=>{const r=n.getBoundingClientRect(),a=[...n.querySelectorAll('.title-letter')].map(n=>n.getBoundingClientRect());return{x:r.x+r.width/2,y:r.y+r.height/2,curve:a[4].top-a[0].top}});
      assert.ok(Math.abs(pose.x-width/2)<1&&Math.abs(pose.y-height*.25)<2&&pose.curve>5);await page.screenshot({path:out+'/titulo-'+width+'.png'});
    }
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.title-letter-art').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length),0);await page.emulateMedia({reducedMotion:'no-preference'});
    console.log('PASS título sem tampa, onda esquerda→direita, curva/posição preservadas e movimento reduzido');
    await page.setViewportSize({width:844,height:390});await page.locator('#singlePlayerBtn').tap();
    assert.equal(await page.locator('#profilePreviewName').count(),0);
    await page.locator('#avatarGallery img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));
    assert.ok(await page.locator('#avatarGallery button').evaluateAll(ns=>ns.length===9&&ns.every(n=>!n.innerText.trim()&&n.getAttribute('aria-label')&&n.querySelector('img'))));
    await page.locator('#playerName').fill('Chef Lia');await page.locator('[data-avatar-choice="panela-dj"]').tap();await page.screenshot({path:out+'/avatares.png'});await page.locator('#profileContinueBtn').tap();
    assert.ok(await page.evaluate(()=>PanelinhaProfile.current.name==='Chef Lia'&&PanelinhaProfile.current.avatar==='panela-dj'));await page.locator('#startBtn').tap();await page.waitForTimeout(650);await fixture();
    const cue=page.locator('#turnCue .turn-cue-label');assert.ok(await cue.isVisible());
    const pulse=await cue.evaluate(n=>{const a=n.getAnimations().find(a=>a.animationName==='turn-cue-pulse');return{duration:a.effect.getTiming().duration,loops:a.effect.getTiming().iterations===Infinity}});assert.equal(pulse.duration,1850);assert.ok(pulse.loops);
    await page.evaluate(()=>window.__pulseNode=document.querySelector('.turn-cue-label'));await page.evaluate(()=>PanelinhaTableBridge.render());assert.ok(await page.evaluate(()=>window.__pulseNode===document.querySelector('.turn-cue-label')));
    await page.evaluate(()=>{CartasTest.getState().current=1;PanelinhaTableBridge.render()});assert.ok(await page.locator('#turnCue').isHidden());
    console.log('PASS avatares visuais sem nomes, perfil salvo; pulso somente no turno humano, sem reiniciar no render');
    await fixture();await page.evaluate(()=>CartasTest.getState().deck.push({id:60001,type:'wild',color:null}));await page.locator('#buyBtn').tap();
    const bought=page.locator('[data-card-id="60001"][data-effect=draw]');assert.equal(await bought.getAttribute('data-presentation'),'preview');assert.equal(await bought.getAttribute('data-duration'),'2400');await page.waitForTimeout(2500);assert.ok(await page.locator('.draw-choice').isVisible());await page.locator('.draw-choice button').filter({hasText:'Guardar'}).tap();
    await fixture();await page.evaluate(()=>{const s=CartasTest.getState(),c={id:60002,type:'wild',color:null};s.players[1].hand.push(c);PanelasMesa.recordDraw(s,1,c);PanelinhaTableBridge.render()});assert.equal(await page.locator('[data-card-id="60002"]').getAttribute('data-presentation'),'direct');assert.equal(await page.locator('[data-card-id="60002"] .card-image').count(),0);
    console.log('PASS compra própria 2400ms, decisão preservada; compra alheia direta sem revelar frente');
    const id=await fixture();await page.locator(`[data-card="${id}"]`).tap();await page.evaluate(()=>PanelinhaTableBridge.setOnline(CartasTest.getState()));
    await page.waitForTimeout(560);assert.equal(await page.locator('[data-effect=pressure-collect]').count(),0);await page.waitForTimeout(1540);
    const counts=await page.evaluate(()=>CartasTest.getState().lastDistribution.afterCounts);assert.equal(await page.locator('.pressure-received').count(),4);
    for(let actor=0;actor<4;actor++){const badge=page.locator(`.pressure-received[data-actor="${actor}"]`);assert.equal(await badge.textContent(),'+'+counts[actor]);assert.ok(await badge.evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=28&&n.getAnimations()[0].effect.getTiming().duration===4200));}
    await page.waitForTimeout(300);await page.screenshot({path:out+'/panela-valores.png'});await page.waitForTimeout(2400);assert.equal(await page.locator('.pressure-received').count(),4);
    await page.evaluate(()=>PanelinhaTableBridge.render());assert.equal(await page.locator('.pressure-received').count(),4);assert.ok(await page.evaluate(()=>CartasTest.getState().lastDistribution.active.includes(0)&&CartasTest.getState().lastDistribution.actorReceived>=1));
    console.log('PASS Panela: voo antes do efeito, autor incluído, quatro valores maiores, 4200ms e visíveis além de 2400ms, sem duplicação');assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
