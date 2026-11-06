const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const out='/workspace/work/menu-sala-placar';
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  async function fixture(type='rotate',points=false){return page.evaluate(({type,points})=>{
    const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
    Object.assign(s,{phase:'playing',current:0,activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,unlockAt:0,presentationUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastActor:null,unoWindow:null,preUno:false,roundScore:null});
    Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo:false,single:!points,goal:50});
    let id=30000;const card=(type='num',color='red',num=7)=>({id:++id,type,color,num});
    s.players.forEach((p,i)=>{p.hand=Array.from({length:6-i},()=>card());p.score=i===0?12:4;});
    const special=card(type,['dist','rotate','wild'].includes(type)?null:'red');s.players[0].hand.push(special);
    s.deck=Array.from({length:30},()=>card('num','blue',2));s.discard=[card()];PanelinhaTableBridge.render();return special.id;
  },{type,points});}
  try{
    await page.goto('http://127.0.0.1:8000');await page.waitForTimeout(700);
    for(const [width,height] of [[844,390],[1280,800]]){
      await page.setViewportSize({width,height});
      const menu=await page.evaluate(()=>{
        const title=document.querySelector('.game-title').getBoundingClientRect(),plane=document.querySelector('.menu-art-plane').getBoundingClientRect();
        const letters=[...document.querySelectorAll('.title-letter')].map(n=>n.getBoundingClientRect());
        return{centerX:title.x+title.width/2,centerY:title.y+title.height/2,covered:plane.left<=0&&plane.top<=0&&plane.right>=innerWidth&&plane.bottom>=innerHeight,curve:letters[4].top-letters[0].top,noLid:!document.querySelector('.title-lid')};
      });
      assert.ok(Math.abs(menu.centerX-width/2)<1&&Math.abs(menu.centerY-height*.25)<2&&menu.covered&&menu.curve>5);assert.ok(menu.noLid);
      await page.screenshot({path:out+'/menu-'+width+'.png'});
    }
    console.log('PASS menu celular/tablet: cover, título no quarto superior, arco e título sem tampa');
    await page.setViewportSize({width:844,height:390});await page.locator('#singlePlayerBtn').tap();await page.locator('#profileContinueBtn').tap();
    assert.equal(await page.locator('#duration').inputValue(),'single');
    for(const id of ['infinite','cut','challenge','wild6','dist','rotate'])assert.ok(await page.locator('#'+id).isChecked());
    assert.equal(await page.locator('#menu [data-setting-info]').count(),6);
    await page.locator('#menu [data-setting-info=infinite]').tap();assert.ok(await page.locator('#settingHelp').isVisible());assert.ok(await page.locator('#infinite').isChecked());
    await page.evaluate(()=>PanelinhaNavigation.back());assert.ok(await page.locator('#settingHelp').isHidden());
    await page.locator('#menu [data-setting-info=rotate]').click();assert.match(await page.locator('#settingHelp').innerText(),/Cada mão passa/);await page.locator('#settingsTitle').tap();assert.ok(await page.locator('#settingHelp').isHidden());
    await page.screenshot({path:out+'/opcoes-celular.png'});console.log('PASS seis opcionais, partida única, ajuda por toque/mouse, fora e Voltar');
    await page.locator('#startBtn').tap();await page.waitForTimeout(650);
    let id=await fixture();const original=await page.evaluate(()=>CartasTest.getState().players.map(p=>p.hand.length));
    assert.equal(await page.locator('.seat .name:visible,.seat .sub:visible').count(),0);
    await page.locator(`[data-card="${id}"]`).tap();
    assert.equal(await page.locator('#hand button').count(),original[0]-1);assert.ok(await page.locator('#buyBtn').isDisabled());assert.equal(await page.locator('[data-effect=rotation-collect]').count(),0);
    await page.waitForTimeout(740);assert.deepEqual(await page.locator('[data-effect=rotation-collect]').evaluateAll(ns=>[...new Set(ns.map(n=>Number(n.dataset.actor)))].sort()),[0,1,2,3]);
    await page.waitForTimeout(350);assert.equal(await page.locator('[data-effect=rotation-move]').count(),4);
    const packs=await page.locator('[data-effect=rotation-move]').evaluateAll(ns=>ns.map(n=>({from:+n.dataset.from,to:+n.dataset.to,backs:[...n.querySelectorAll('img')].every(im=>im.src.endsWith('verso_oficial_400x850.png'))})));
    for(const p of packs){assert.equal(p.to,(p.from+3)%4);assert.ok(p.backs);}
    await page.screenshot({path:out+'/liquidificador-troca.png'});await page.waitForTimeout(1050);
    assert.ok(!await page.locator('#table').evaluate(n=>n.classList.contains('pressure-transition')));
    assert.equal(await page.locator('#hand button').count(),original[1]);assert.equal(await page.locator('.color-picker').count(),0);
    console.log('PASS Liquidificador: voo, recolhimento, quatro montes no sentido real, abertura, bloqueio e versos');
    id=await fixture('dist');await page.locator(`[data-card="${id}"]`).tap();await page.waitForTimeout(2080);
    const counts=await page.evaluate(()=>CartasTest.getState().lastDistribution.afterCounts);
    for(let actor=0;actor<4;actor++)assert.equal(await page.locator(`.pressure-received[data-actor="${actor}"]`).textContent(),'+'+counts[actor]);
    await page.screenshot({path:out+'/panela-quantidades.png'});console.log('PASS Panela mostra quatro quantidades autoritativas após redistribuir');
    await fixture('num');await page.evaluate(()=>CartasTest.getState().deck.push({id:40001,type:'wild',color:null}));await page.locator('#buyBtn').tap();
    const draw=page.locator('[data-effect=draw][data-card-id="40001"]');assert.equal(await draw.getAttribute('data-presentation'),'preview');assert.equal(await draw.getAttribute('data-duration'),'1450');
    await page.waitForTimeout(1500);assert.ok(await page.locator('.draw-choice').isVisible());await page.locator('.draw-choice button').filter({hasText:'Guardar'}).tap();
    await fixture('num');await page.evaluate(()=>{const s=CartasTest.getState(),c={id:40002,type:'wild',color:null};s.players[1].hand.push(c);PanelasMesa.recordDraw(s,1,c);PanelinhaTableBridge.render();});
    assert.equal(await page.locator('[data-card-id="40002"][data-effect=draw]').getAttribute('data-presentation'),'direct');assert.equal(await page.locator('[data-card-id="40002"][data-effect=draw] .card-image').count(),0);
    console.log('PASS compra própria mais lenta com decisão e compra alheia direta, sem prévia/frente');
    id=await fixture('num',true);await page.evaluate(id=>{const s=CartasTest.getState();s.players[0].hand=s.players[0].hand.filter(c=>c.id===id);PanelinhaTableBridge.render();},id);await page.locator(`[data-card="${id}"]`).tap();
    assert.equal(await page.locator('.score-track').count(),4);assert.match(await page.locator('.score-player[data-player="0"]').innerText(),/\+3 na rodada · 15 no total/);
    const fill=page.locator('.score-player[data-player="0"] .score-fill');assert.equal(await fill.getAttribute('data-before'),'0.24');assert.equal(await fill.getAttribute('data-total'),'0.3');
    await page.evaluate(()=>window.__chart=document.querySelector('.round-score'));await page.waitForTimeout(400);await page.evaluate(()=>PanelinhaTableBridge.render());assert.ok(await page.evaluate(()=>window.__chart===document.querySelector('.round-score')));await page.waitForTimeout(750);
    const scale=await fill.evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).a);assert.ok(Math.abs(scale-.3)<.002);
    for(const [width,height] of [[844,390],[1280,800]]){await page.setViewportSize({width,height});await page.screenshot({path:out+'/placar-'+width+'.png'});const box=await page.locator('#controls').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);}
    console.log('PASS placar 12→15/50 com +3, quatro barras, animação persistente e layout celular/tablet');assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
