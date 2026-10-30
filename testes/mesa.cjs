// Testes da apresentação e da interação móvel; execute com o servidor HTTP ativo.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PANELAS_TEST_URL || 'http://127.0.0.1:8000/';
(async () => {
  const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.clock.install();
    await page.goto(base);
    await page.locator('#mode').selectOption('duo');
    await page.locator('#startBtn').tap();
    await page.evaluate(() => {
      const s = CartasTest.getState();
      Object.assign(s, {current:0,unlockAt:0,penalty:0,highest:0,finisher:null,drawn:null,pendingAction:null,cutOpen:false,activeColor:'blue',direction:1,token:s.token+1});
      s.discard = [{id:50000,type:'num',color:'blue',num:2}];
      s.players[0].hand = [{id:50001,type:'reverse',color:'blue',num:null}, ...Array.from({length:6}, (_,i) => ({id:50002+i,type:'num',color:['red','blue','green','yellow'][i%4],num:i}))];
      document.querySelector('#useCardArt').onchange();
    });
    assert.equal(await page.locator('.seat .pan-avatar').count(),4);
    assert.equal(await page.locator('.seat.active').getAttribute('id'),'player0');
    assert.equal(await page.locator('#player2 .subhand').count(),1);
    assert.equal(await page.locator('#player1 .subhand, #player3 .subhand').count(),0);
    assert.equal(await page.locator('#player1 .back, #player3 .back').count(),2);
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#hand > button')].some(card => card.style.getPropertyValue('--fan-angle') !== '0deg')));
    console.log('PASS avatares, turno, leque próprio, mini-leque do parceiro e adversários fechados');

    for (const viewport of [{width:320,height:568},{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1280,height:900}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => document.querySelector('#useCardArt').onchange());
      const positions = await page.evaluate(() => {
        const rect = id => document.getElementById(id).getBoundingClientRect();
        const top=rect('player2'), self=rect('player0'), left=rect('player3'), right=rect('player1'), center=document.querySelector('.center').getBoundingClientRect();
        return { noOverflow:document.documentElement.scrollWidth <= innerWidth, top:top.bottom <= center.top+1, bottom:self.top >= center.bottom-1, sides:left.right <= center.left+1 && right.left >= center.right-1 };
      });
      assert.ok(positions.noOverflow,`overflow ${viewport.width}`);
      assert.ok(positions.top && positions.bottom && positions.sides,`posições ${viewport.width}: ${JSON.stringify(positions)}`);
    }
    await page.setViewportSize({width:320,height:568});
    await page.waitForFunction(() => document.querySelector('#hand').classList.contains('scroll-hand'));
    console.log('PASS posições e ausência de overflow de página: 320, 360, 390, 844 e 1280 px; leque se adapta ao redimensionar');

    for (const [color, name] of Object.entries({red:'Vermelho',blue:'Azul',yellow:'Amarelo',green:'Verde'})) {
      await page.evaluate(color => {CartasTest.getState().activeColor=color;document.querySelector('#useCardArt').onchange();},color);
      assert.match(await page.locator('#burner').getAttribute('aria-label'),new RegExp(name));
      assert.equal(await page.locator('.center').getAttribute('data-active-color'),color);
    }
    assert.equal(new Set(await page.evaluate(() => ['red','blue','yellow','green'].map(color => {
      const center=document.querySelector('.center');center.dataset.activeColor=color;
      return getComputedStyle(center).getPropertyValue('--flame');
    }))).size,4);
    await page.evaluate(() => {const s=CartasTest.getState();s.penalty=12;document.querySelector('#useCardArt').onchange();});
    assert.equal(await page.locator('#penaltyDisplay').innerText(),'+12');
    assert.ok(await page.locator('#penaltyDisplay').isVisible());
    await page.evaluate(() => {CartasTest.getState().penalty=0;document.querySelector('#useCardArt').onchange();});
    assert.ok(await page.locator('#penaltyDisplay').isHidden());
    assert.equal(await page.locator('.deck-count').innerText(),await page.evaluate(() => String(CartasTest.getState().deck.length)));
    assert.notEqual(await page.locator('#discard').evaluate(el=>getComputedStyle(el,'::before').content),'none');
    console.log('PASS quatro cores na boca, penalidade +12, quantidade do monte e camadas do descarte');

    // Uma jogada real de Inverter atualiza direção e animação sem mexer nos handlers.
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => {const s=CartasTest.getState();s.activeColor='blue';document.querySelector('#useCardArt').onchange();});
    await page.locator('[data-card="50001"]').tap();
    assert.equal(await page.evaluate(() => CartasTest.getState().direction),-1);
    assert.equal(await page.locator('#directionGlyph').innerText(),'↺');
    assert.equal(await page.locator('#directionGlyph').evaluate(el=>el.getAnimations().length),1);
    console.log('PASS toque na carta Inverter e animação da seta');
    await page.clock.runFor(900);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(() => {CartasTest.getState().direction=1;document.querySelector('#useCardArt').onchange();});
    assert.equal(await page.locator('#directionGlyph').evaluate(el=>el.getAnimations().length),0);
    console.log('PASS preferência por movimento reduzido');

    await page.evaluate(() => {
      const s=CartasTest.getState();
      s.players[0].hand=Array.from({length:25},(_,i)=>({id:60000+i,type:'num',color:'red',num:i%10}));
      s.players[2].hand=Array.from({length:20},(_,i)=>({id:61000+i,type:'num',color:'green',num:i%10}));
      document.querySelector('#useCardArt').onchange();
    });
    assert.ok(await page.locator('#hand').evaluate(el=>el.classList.contains('scroll-hand') && el.scrollWidth>el.clientWidth));
    assert.ok(await page.locator('#player2 .subhand').evaluate(el=>el.classList.contains('scroll-hand') && el.scrollWidth>el.clientWidth));
    await page.locator('#hand > button').last().scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#hand > button').last().evaluate(el=>{const r=el.getBoundingClientRect();return r.right<=innerWidth && r.left>=0;}));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    console.log('PASS mãos grandes acessíveis por rolagem sem alargar a página');

    await page.evaluate(() => {
      const before=JSON.stringify(CartasTest.getState());
      const frozen=JSON.parse(before);
      const freeze=value=>{if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}};
      freeze(frozen);PanelasMesa.render(frozen);
      if(JSON.stringify(CartasTest.getState())!==before)throw Error('Apresentação alterou o jogo');
    });
    assert.deepEqual(errors,[]);
    console.log('PASS apresentação aceita estado congelado e não altera o estado do jogo; sem exceções JS');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
