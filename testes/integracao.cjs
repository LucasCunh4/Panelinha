// Requer Playwright e Chromium; não modifica o código do protótipo.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../IMPORTACAO_PANELAS');
const base = process.env.PANELAS_TEST_URL || 'http://127.0.0.1:8000/';
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 try {
  await page.clock.install();
  await page.goto(base);await page.locator('#singlePlayerBtn').click();
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_52_PNG.json')));
  assert.equal(manifest.files.length,52);
  for (const f of manifest.files) {
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.path))).digest('hex'),f.sha256);
   const response=await page.request.get(new URL(f.path,base).href);
   assert.equal(response.status(),200,f.path);
   assert.match(response.headers()['content-type'],/image\/png/);
  }
  const decoded=await page.evaluate(async files=>Promise.all(files.map(async f=>{
   const image=new Image(); image.src=f.path; await image.decode();
   return image.naturalWidth>0 && image.naturalHeight>0;
  })),manifest.files);
  assert.ok(decoded.every(Boolean)); console.log('PASS 52/52 PNGs: SHA-256, HTTP 200 e decodificação no Chromium móvel');
  await page.locator('#startBtn').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().players.length),4);
  assert.ok(await page.locator('#game').isVisible());
  console.log('PASS início individual com 1 humano + 3 bots');
  await page.locator('#tableMenuBtn').tap();await page.locator('#backBtn').tap();if(await page.locator('#navDialog').isVisible())await page.locator('#confirmLeaveBtn').tap(); await page.locator('#mode').selectOption('duo'); await page.locator('#startBtn').tap();
  assert.ok(await page.evaluate(()=>CartasTest.getState().o.duo));
  assert.equal(await page.locator('#player2 .subhand').count(),1);
  console.log('PASS duplas: parceiro oposto com mão visível');
  const results=await page.evaluate(()=>{
   const results=[]; let uid=10000;
   const c=(type='num',color='red',num=7)=>({id:uid++,type,color,num});
   const render=()=>document.querySelector('#useCardArt').onchange();
   const fixture=()=>{
    const s=CartasTest.getState();
    Object.assign(s,{current:0,direction:1,phase:'playing',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,preUno:false,unoWindow:null,pendingAction:null,deadline:0,activeColor:'red',token:s.token+1,discard:[c()],deck:Array.from({length:80},()=>c('num','blue',2)),summary:[],pastWinners:[],teams:[0,0]});
    Object.assign(s.o,{duo:false,single:true,timeout:0,cut:true,challenge:true,dist:true,rotate:true,infinite:false});
    s.players.forEach(p=>{p.hand=[c('num','green',1),c('num','yellow',2)];p.score=0;});
    return s;
   };
   const click=id=>{const el=document.getElementById(id);if(!el)throw Error('Botão ausente: '+id);el.click();};
   const play=card=>{render();const el=document.querySelector(`[data-card="${card.id}"]`);if(!el)throw Error('Carta ausente');el.click();};
   const ok=(condition,message)=>{if(!condition)throw Error(message);};
   const test=(name,run)=>{try{run();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}};
   test('baralho 114/118, dois zeros por cor',()=>{
    const a=CartasTest.createDeck({}),b=CartasTest.createDeck({dist:true,rotate:true});
    ok(a.length===114&&b.length===118,'contagem');
    for(const color of ['red','blue','green','yellow'])ok(a.filter(c=>c.type==='num'&&c.num===0&&c.color===color).length===2,'zeros');
   });
   test('penalidade +20 bloqueia carta comum e cobra total',()=>{
    const s=fixture();s.players[0].hand=[c()];render();click('testPenalty');
    ok(document.querySelector('[data-card]').disabled,'carta comum liberada');click('buyBtn');
    ok(s.players[0].hand.length===21&&s.penalty===0&&s.current===1,'cobrança incorreta');
   });
   test('acúmulo +2→+4→+6 = 12 e cor ignorada',()=>{
    const s=fixture();s.penalty=2;s.highest=2;const card=c('wild4',null);s.players[0].hand.push(card);play(card);clickColor('blue');
    ok(s.penalty===6&&s.highest===4,'+4');
    s.current=0;s.unlockAt=0;const next=c('wild6',null);s.players[0].hand.push(next);play(next);clickColor('red');
    ok(s.penalty===12&&s.highest===6,'+6');
   });
   function clickColor(color){document.querySelector(`[data-color="${color}"]`).click();}
   test('+6 não permite resposta +2; +2 aceita outra cor',()=>{
    const s=fixture();s.penalty=6;s.highest=6;const card=c('draw2','blue');s.players[0].hand.push(card);render();
    ok(document.querySelector(`[data-card="${card.id}"]`).disabled,'+2 contra +6');s.highest=2;render();ok(!document.querySelector(`[data-card="${card.id}"]`).disabled,'cor indevida');
   });
   test('Panela de Pressão incorpora +20, respeita limite e encerra punição',()=>{
    const s=fixture();const card=c('dist',null);s.players[0].hand.push(card);s.penalty=20;s.highest=2;play(card);clickColor('red');
    const sizes=s.players.map(p=>p.hand.length);ok(sizes[0]<=2&&sizes.every(n=>n>=1),'limites da Panela de Pressão');
    ok(sizes.reduce((a,b)=>a+b)===28&&s.penalty===0&&s.lastDistribution.penaltyAdded===20,'pool/punição');
   });
   test('Liquidificador transfere mãos na direção e é bloqueado contra +N',()=>{
    const s=fixture();const card=c('rotate',null);s.players[0].hand.push(card);s.penalty=2;s.highest=2;render();ok(document.querySelector(`[data-card="${card.id}"]`).disabled,'Liquidificador na punição');
    s.penalty=0;const previous=s.players[3].hand.map(c=>c.id).join();play(card);ok(!s.pendingAction&&s.activeColor==='red','Liquidificador escolheu/mudou cor');ok(s.players[0].hand.map(c=>c.id).join()===previous,'direção');
   });
   test('corte próprio de +2 em dois cliques aplica efeito uma vez',()=>{
    const s=fixture(),a=c('draw2'),b=c('draw2');s.players[0].hand.push(a,b);play(a);
    ok(s.penalty===2&&s.players[0].hand.some(c=>c.id===b.id),'primeiro descarte');click('cutBtn');ok(s.penalty===2&&!s.players[0].hand.some(c=>c.id===b.id),'segundo descarte');
   });
   test('corte externo redireciona turno e soma +2',()=>{
    const s=fixture(),card=c('draw2');s.current=2;s.cutOpen=true;s.unlockAt=Date.now()+2200;s.lastActor=1;s.discard=[c('draw2')];s.penalty=2;s.highest=2;s.players[0].hand.push(card);render();click('cutBtn');ok(s.current===1&&s.penalty===4,'corte externo');
   });
   test('cortes desligados não exibem comando',()=>{
    const s=fixture();s.o.cut=false;s.current=2;s.cutOpen=true;s.players[0].hand.push(c());render();ok(!document.querySelector('#cutBtn'),'corte ativo');
   });
   for(const illegal of [true,false])test('desafio '+(illegal?'procedente':'improcedente'),()=>{
    const s=fixture();s.penalty=10;s.highest=6;s.lastPenalty={id:3,type:'wild6',illegal,challengeable:true};render();click('challengeBtn');
    ok(s.penalty===0,'punição pendente');ok(illegal?s.players[3].hand.length===12&&s.current===0:s.players[0].hand.length===14&&s.current===1,'destino/valor');
   });
   test('denúncia de última carta dá +2',()=>{
    const s=fixture();s.players[1].hand=[c()];s.unoWindow={id:1};render();click('reportBtn');ok(s.players[1].hand.length===3&&!s.unoWindow,'denúncia');
   });
   test('compra voluntária pode ser guardada',()=>{
    const s=fixture();s.deck=[c()];render();click('buyBtn');ok(s.drawn!==null,'sem opção');click('passBtn');ok(s.current===1&&s.players[0].hand.length===3,'guardar');
   });
   test('finalização +2 resolve punição antes da classificação',()=>{
    const s=fixture(),card=c('draw2');s.players[0].hand=[card];play(card);ok(s.phase==='playing'&&s.finisher===0&&s.penalty===2,'final prematuro');
    ok(!document.querySelector('#cutBtn'),'corte após finalização');
   });
   test('pontuação personalizada e classificação da rodada',()=>{
    const s=fixture(),card=c();s.players[0].hand=[card];s.players[1].hand=[c('wild',null),c('wild6',null)];s.players[2].hand=[c('draw2'),c('skip'),c('reverse')];s.players[3].hand=[c()];play(card);
    ok(JSON.stringify(s.summary.map(x=>x.id))==='[0,3,2,1]','ranking');ok(JSON.stringify(s.summary.map(x=>x.cost))==='[0,2,12,18]','valores');ok(s.players[0].score===3&&s.players[3].score===2,'pontos');
   });
   test('corte próprio de Bloqueio não repete o salto',()=>{
    const s=fixture(),a=c('skip'),b=c('skip');s.players[0].hand.push(a,b);play(a);ok(s.current===2,'salto inicial');click('cutBtn');ok(s.current===2,'Bloqueio deve pular apenas Bot 1, mesmo após segunda cópia');
   });
   return results;
  });
  for(const r of results)console.log(r.status,r.name,r.error||'');
  // Resolve a punição final pelo turno real do bot, sem mover a vez ao finalizador.
  await page.locator('#tableMenuBtn').tap();await page.locator('#backBtn').tap();if(await page.locator('#navDialog').isVisible())await page.locator('#confirmLeaveBtn').tap();await page.locator('#startBtn').tap();
  await page.evaluate(()=>{
   const s=CartasTest.getState();s.token++;s.current=0;s.unlockAt=0;s.penalty=0;s.highest=0;s.finisher=null;s.cutOpen=false;s.activeColor='red';s.direction=1;s.o.single=true;s.o.duo=false;
   const card=(id,type='num',color='red')=>({id,type,color,num:7});
   s.discard=[card(20000)];s.players.forEach((p,i)=>p.hand=i===0?[card(20001,'draw2')]:[card(20010+i,'num','green'),card(20020+i,'num','yellow')]);
   s.deck=Array.from({length:20},(_,i)=>card(20100+i));document.querySelector('#useCardArt').onchange();document.querySelector('[data-card="20001"]').click();
  });
  assert.equal(await page.evaluate(()=>CartasTest.getState().phase),'playing');
  await page.clock.runFor(3000);
  assert.ok(await page.evaluate(()=>{const s=CartasTest.getState();return s.phase==='gameOver'&&s.finisher===0&&s.players[1].hand.length===4&&s.players[0].hand.length===0;}));
  console.log('PASS bot resolve +2 final antes de encerrar rodada');
  // Partida real: relógio virtual permite aguardar o turno automático dos bots.
  await page.locator('#tableMenuBtn').tap();await page.locator('#backBtn').tap();if(await page.locator('#navDialog').isVisible())await page.locator('#confirmLeaveBtn').tap();await page.locator('#startBtn').tap();
  await page.evaluate(()=>{document.querySelector('#testPenalty').click();document.querySelector('#buyBtn').click();});
  await page.clock.runFor(1000);
  assert.ok(await page.evaluate(()=>CartasTest.getState().log.some(x=>/Bot [123] (jogou|comprou)/.test(x))));
  console.log('PASS bot executa turno automaticamente');
  await page.evaluate(()=>document.querySelector('#reveal').click());
  assert.equal(await page.locator('#player1 .subhand').count(),1);
  await page.evaluate(()=>document.querySelector('#useCardArt').click());
  assert.equal(await page.locator('.card-image').count(),0);
  console.log('PASS laboratório: revelar bots e desligar PNGs');
  // O cronômetro deve cobrar a punição inteira, não apenas uma carta.
  await page.evaluate(()=>{
   const s=CartasTest.getState();s.current=0;s.direction=1;s.unlockAt=0;s.drawn=null;s.phase='playing';s.finisher=null;s.token++;s.o.timeout=15;s.deadline=Date.now()+100;
   document.querySelector('#testPenalty').click();s.deadline=Date.now()+100;
   window.beforeTimeout=s.players[0].hand.length;
  });
  await page.clock.runFor(500);
  assert.ok(await page.evaluate(()=>{const s=CartasTest.getState();return s.penalty===0&&s.current===1&&s.players[0].hand.length===window.beforeTimeout+20;}));
  console.log('PASS cronômetro cobra +20 integral');
  // Força falha de rede para verificar o fallback textual existente.
  await page.route('**/assets/cartas/**/*.png',route=>route.abort());
  await page.evaluate(()=>{const s=CartasTest.getState();s.players[0].hand=[{id:30000,type:'num',color:'red',num:7}];document.querySelector('#useCardArt').checked=true;document.querySelector('#useCardArt').onchange();});
  await page.locator('[data-card="30000"] .asset-unavailable').waitFor();
  assert.ok(await page.locator('[data-card="30000"] .art-fallback').isVisible());
  console.log('PASS fallback textual quando PNG falha');
  await page.unroute('**/assets/cartas/**/*.png');
  for(const viewport of [{width:844,height:390},{width:1280,height:800}]) {
   await page.setViewportSize(viewport);
   assert.ok(await page.locator('#game').isVisible());
  }
  console.log('PASS jogo visível em paisagem e desktop (sem teste em aparelho físico)');
  assert.deepEqual(errors,[]); console.log('PASS sem exceções JavaScript');
  const failed=results.filter(r=>r.status==='FAIL');console.log(`Regras: ${results.length-failed.length}/${results.length} passaram`);
  process.exitCode=failed.length?1:0;
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
