const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/estabilidade-maos-botoes';
const url=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8123';
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await p.goto(url);await p.locator('#singlePlayerBtn').click();await p.locator('#profileContinueBtn').click();await p.locator('#startBtn').click();
    await p.waitForFunction(()=>!PanelinhaTableEffects.dealing());
    async function fixture(n=15,duo=false){
      await p.evaluate(({n,duo})=>{
        const s=CartasTest.getState();PanelinhaTableBridge.setOnline(s);s.round++;
        Object.assign(s,{online:false,paused:false,phase:'playing',current:0,activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,blockedPlayer:null,unlockAt:0,presentationUntil:0,playUntil:0,dealUntil:0,lastPlay:null,lastDeal:null,lastNormalPurchase:null,botDrawPending:null,cutAnnounceUntil:0,deadline:0,drawn:null,cutOpen:false,pendingAction:null,lastDistribution:null,lastRotation:null,lastPenaltyPurchase:null,lastActor:null,unoWindow:null,preUno:false,reveal:false});
        Object.assign(s.o,{timeout:0,cut:true,infinite:false,duo,single:true,dist:true});
        let id=50000;const card=()=>({id:++id,type:'num',color:['red','blue','green','yellow'][id%4],num:7});
        s.players.forEach(q=>q.hand=Array.from({length:n},card));s.discard=[{id:++id,type:'num',color:'red',num:7}];s.deck=Array.from({length:60},card);
        window.core=PanelinhaRules.create({getState:()=>s,render:PanelinhaTableBridge.render,draw:(...args)=>PanelasMesa.recordDraw(...args),startTurn(){s.token++;PanelinhaTableBridge.render();}});
        PanelinhaTableBridge.render();
      },{n,duo});await p.waitForTimeout(260);
    }
    async function remember(){await p.evaluate(()=>{window.saved=[...document.querySelectorAll('#hand>[data-card],[data-hand-card]')].map(node=>({node,images:[...node.querySelectorAll('img')]}));});}
    async function sameNodes(){assert.equal(await p.evaluate(()=>saved.every(({node,images})=>node.isConnected&&images.every(im=>im.isConnected&&node.contains(im)))),true);}
    await fixture();await remember();
    await p.evaluate(()=>{for(let i=0;i<8;i++)PanelinhaTableBridge.render();});await sameNodes();
    // Compras reais; o motor registra imediatamente, o leque só incorpora chegadas.
    for(const [actor,kind,count]of[[0,'normal',3],[1,'normal',2],[0,'penalty',20]]){
      await fixture(15,true);await remember();
      const before=await p.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(q=>q.hand)].map(c=>c.id).sort((a,b)=>a-b));
      await p.evaluate(({actor,kind,count})=>{
        const s=CartasTest.getState();s.current=actor;const got=core.drawMany(actor,count);
        if(kind==='penalty')core.holdPenaltyPurchase(actor,got,'penalty');PanelinhaTableBridge.render();
      },{actor,kind,count});
      assert.equal(await p.locator(actor===0?'#hand>[data-card]':`#player${actor} [data-hand-card]`).count(),15);
      const until=Date.now()+(kind==='normal'?count*1616:count*64+400);
      while(Date.now()<until){
        await p.waitForTimeout(90);await p.evaluate(()=>PanelinhaTableBridge.render());await sameNodes();
        assert.equal(await p.evaluate(()=>[...document.querySelectorAll('#hand>[data-card],[data-hand-card]')].every(n=>n.getAnimations().filter(a=>a.effect.getKeyframes().some(f=>f.transform)).length<=1)),true,'sem transforms concorrentes na mesma carta');
      }
      await p.waitForFunction(()=>!document.querySelector('[data-effect=draw]'));
      assert.equal(await p.locator(actor===0?'#hand>[data-card]':`#player${actor} [data-hand-card]`).count(),15+count);
      assert.deepEqual(await p.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(q=>q.hand)].map(c=>c.id).sort((a,b)=>a-b)),before);
      assert.equal(await p.locator('.drawing-card').count(),0);
    }
    console.log('PASS compras normais e +20: cartas/imagens existentes preservadas, chegadas progressivas, sem máscaras residuais e conservação exata');
    // Panela: sem vazio de 100 ms, sem alvo medido durante transição oculta.
    for(const [width,height,duo]of[[844,390,false],[1280,800,true]]){
      await p.setViewportSize({width,height});await fixture(15,duo);
      await p.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand[0]={id:99000,type:'dist',color:null};PanelinhaTableBridge.render();window.beforeIds=[...s.deck,...s.discard,...s.players.flatMap(q=>q.hand)].map(c=>c.id).sort((a,b)=>a-b);core.applyPlay(0,[99000],false);PanelinhaTableBridge.render();});
      await p.waitForFunction(()=>document.querySelectorAll('[data-effect=pressure-deal]').length>0);
      await remember();
      await p.evaluate(()=>PanelinhaTableBridge.render());await sameNodes();
      const counts=await p.evaluate(()=>CartasTest.getState().players.map(q=>q.hand.length));
      assert.equal(await p.locator('[data-effect=pressure-deal]').count(),counts.reduce((a,b)=>a+b,0));
      await p.evaluate(()=>{window.dealRefs=[...document.querySelectorAll('[data-effect=pressure-deal]')];dealRefs.forEach(n=>n.getAnimations().forEach(a=>a.finish()));});
      await p.waitForTimeout(30);
      assert.equal(await p.evaluate(()=>dealRefs.every(n=>n.isConnected)),true,'sprites finais não somem antes das mãos');
      assert.equal(await p.locator('#table.pressure-hands-hidden').count(),1);
      assert.equal(await p.locator('.color-picker').count(),0);
      await p.screenshot({path:out+`/panela-${width}.png`});
      await p.waitForFunction(()=>!document.querySelector('#table.pressure-transition'));
      await sameNodes();
      assert.equal(await p.locator('[data-effect=pressure-deal],[data-effect=pressure-collect]').count(),0);
      assert.deepEqual(await p.evaluate(()=>[...CartasTest.getState().deck,...CartasTest.getState().discard,...CartasTest.getState().players.flatMap(q=>q.hand)].map(c=>c.id).sort((a,b)=>a-b)),await p.evaluate(()=>beforeIds));
      for(const actor of [1,3])assert.equal(await p.locator(`#player${actor} .card-symbol`).count(),0);
    }
    console.log('PASS Panela Individual/Duplas em celular/tablet: recolhe quatro mãos, conserva cartas, mantém sprites até a troca sem intervalo vazio e preserva sigilo');
    // Identidade visual das ações existentes, sem trocar semântica/cores.
    await fixture(2);await p.evaluate(()=>{const s=CartasTest.getState();s.unoWindow={id:1};PanelinhaTableBridge.render();});
    for(const [selector,color]of[['#unoBtn','#286b56'],['#reportBtn','#923e51']]){
      assert.equal(await p.locator(selector).evaluate(n=>getComputedStyle(n).getPropertyValue('--action-color').trim()),color);
      assert.equal(await p.locator(selector).evaluate(n=>getComputedStyle(n).borderTopStyle),'solid');
    }
    await p.locator('#unoBtn').click();assert.equal(await p.evaluate(()=>CartasTest.getState().preUno),true);
    await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.penalty=4;s.highest=4;s.lastPenalty={id:1,type:'wild4',challengeable:true};PanelinhaTableBridge.render();});
    assert.equal(await p.locator('#challengeBtn').evaluate(n=>getComputedStyle(n).getPropertyValue('--action-color').trim()),'#923e51');
    await p.screenshot({path:out+'/botoes-contextuais.png'});
    await fixture();await p.evaluate(()=>{const s=CartasTest.getState();s.deck.push({id:99999,type:'wild',color:null});});await p.locator('#buyBtn').click();
    await p.locator('.draw-choice').waitFor();assert.deepEqual(await p.locator('.draw-choice-actions button').allTextContents(),['Jogar','Guardar']);
    assert.equal(await p.locator('.draw-choice-actions .table-action').count(),2);
    await p.locator('.draw-choice-actions .alt').click();await p.waitForTimeout(500);assert.equal(await p.locator('.draw-choice').count(),0);
    console.log('PASS botões de anúncio/denúncia/desafio/Jogar/Guardar tematizados, cores preservadas e ações funcionais de anúncio e Guardar');
    // Hold real de mouse, toque, teclado e interrupções; não cancela/escolhe cor.
    const cdp=await p.context().newCDPSession(p);
    for(const [width,height]of[[568,320],[844,390],[1280,800]]){
      await p.setViewportSize({width,height});
      for(const type of ['wild','wild4','wild6']){
        await p.evaluate(type=>{window.chosen=[];window.cancelled=0;PanelinhaColorPicker.open(document.getElementById('modalRoot'),{cardType:type,choose:c=>chosen.push(c),cancel:()=>cancelled++});},type);
        const peek=p.locator('#viewColorTable');const box=await peek.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
        await p.mouse.move(x,y);await p.mouse.down();assert.equal(await p.locator('.color-picker-card').isVisible(),false);
        assert.deepEqual(await peek.boundingBox(),box,'botão deve ficar no mesmo local enquanto pressionado');
        await p.mouse.move(1,1);await p.mouse.up();assert.equal(await p.locator('.color-picker-card').isVisible(),true);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});assert.equal(await p.locator('.color-picker-card').isVisible(),false);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('.color-picker-card').isVisible(),true);
        await peek.focus();await p.keyboard.down('Space');assert.equal(await p.locator('.color-picker-card').isVisible(),false);await p.keyboard.up('Space');assert.equal(await p.locator('.color-picker-card').isVisible(),true);
        await p.keyboard.down('Enter');await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.locator('.color-picker-card').isVisible(),true);await p.keyboard.up('Enter');
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await p.locator('.color-picker-card').isVisible(),true);
        assert.deepEqual(await p.evaluate(()=>chosen),[]);assert.equal(await p.evaluate(()=>cancelled),0);
        await p.screenshot({path:out+`/escolha-${type}-${width}.png`});
        await p.locator('[data-color=blue]').tap();assert.deepEqual(await p.evaluate(()=>chosen),['blue']);await p.locator('.color-picker').waitFor({state:'detached'});
      }
    }
    await p.context().setOffline(true);await p.evaluate(()=>PanelinhaColorPicker.open(document.getElementById('modalRoot'),{cardType:'wild4',choose:c=>chosen.push(c),cancel(){}}));await p.locator('[data-color=green]').tap();assert.equal(await p.evaluate(()=>chosen.at(-1)),'green');await p.context().setOffline(false);
    assert.deepEqual(errors,[]);
    console.log('PASS Coringa/+4/+6 em três tamanhos: segura com mouse/toque/Espaço/Enter, solta/cancela/perde foco e volta; nenhum cancelamento/cor involuntária; seleção e offline preservados');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
