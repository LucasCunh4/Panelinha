const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const epoch=new Date("2030-01-01T12:00:00Z");await page.clock.install({time:epoch});await page.clock.pauseAt(epoch);await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/');await page.locator('#startBtn').tap();
  const results=await page.evaluate(()=>{
   const originalRandom=Math.random;let seed=0x50414e4c;
   Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   let serial=200000;const c=(type='num',color='red',num=7)=>({id:serial++,type,color,num});
   const refresh=()=>document.getElementById('useCardArt').onchange();
   const setup=(total=20)=>{
    const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'red',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,summary:[],pastWinners:[],teams:[0,0],token:s.token+1});
    Object.assign(s.o,{duo:false,single:true,timeout:0,cut:true,dist:true,rotate:true});
    s.players.forEach(p=>{p.hand=[];p.score=0});
    const cards=Array.from({length:total},()=>c());cards.forEach((card,i)=>s.players[i%4].hand.push(card));
    s.discard=[c()];s.deck=Array.from({length:100},()=>c('num','blue',2));return s;
   };
   const all=s=>[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort((a,b)=>a-b).join();
   const play=(card,color='red')=>{refresh();document.querySelector(`[data-card="${card.id}"]`).click();document.querySelector(`[data-color="${color}"]`)?.click();};
   const check=(condition,message)=>{if(!condition)throw Error(message)};
   const tests=[];const test=(name,fn)=>{fn();tests.push(name)};
   for(const total of [20,40,80,118])test(`Distribuidora ${total} cartas: conservação, limite, aleatoriedade e zeros`,()=>{
    const sizes=new Set();let unequal=false,zero=false;
    for(let attempt=0;attempt<60;attempt++){
     const s=setup(total),card=c('dist',null);s.players[0].hand.push(card);const before=all(s),cap=s.players[0].hand.length-1;
     play(card);const lengths=s.players.map(p=>p.hand.length);sizes.add(lengths.join());
     check(all(s)===before,'perda/duplicação');check(new Set([...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id)).size===total+102,'ID duplicado');
     check(lengths.reduce((a,b)=>a+b,0)===total,'total incorreto');check(lengths[0]<=cap,'autor ganhou além do limite');
     unequal ||= Math.max(...lengths)-Math.min(...lengths)>1;zero ||= lengths.some(n=>n===0);
     if(lengths.some(n=>n===0)){check(s.finisher!==null&&s.phase==='gameOver','zero não finalizou');check(s.players[s.finisher].hand.length===0,'vencedor com cartas');}
    }
    check(sizes.size>8&&unequal&&zero,'quantidades não aleatórias/zeros ausentes');
   });
   for(const penalty of [2,6,12,20,40,80])test(`Distribuidora resolve +${penalty} sem exceder mão do autor`,()=>{
    const s=setup(20),card=c('dist',null);s.players[0].hand.push(card);s.penalty=penalty;s.highest=6;
    const before=all(s),cap=5;play(card);
    check(all(s)===before,'cartas perdidas na penalidade');check(s.players.flatMap(p=>p.hand).length===20+penalty,'total pool');check(s.players[0].hand.length<=cap,'limite durante penalidade');
    check(s.penalty===0&&s.highest===0&&!s.lastPenalty&&s.lastDistribution.penaltyAdded===penalty,'penalidade não encerrada');
   });
   test('Distribuidora final mantém vencedor e não devolve cartas ao autor',()=>{
    const s=setup(20),card=c('dist',null);s.players[0].hand=[card];const before=all(s);play(card);check(s.finisher===0&&s.players[0].hand.length===0&&s.phase==='gameOver','vitória alterada');check(all(s)===before,'conservação final');
   });
   test('Duplas encerra quando um participante fica com zero',()=>{
    const s=setup(20);s.o.duo=true;const card=c('dist',null);s.players[0].hand=[card];play(card);check(s.finisher===0&&s.teams[0]===1&&s.phase==='gameOver','vitória duplas');
   });
   test('Distribuidora exclui finalizador anterior e mantém o resultado',()=>{
    const s=setup(20);s.players[3].hand=[];s.finisher=3;s.penalty=20;s.highest=2;const card=c('dist',null);s.players[0].hand.push(card);const before=all(s);play(card);check(s.finisher===3&&s.players[3].hand.length===0&&!s.lastDistribution.active.includes(3),'finalizador retornou');check(all(s)===before,'conservação');
   });
   test('Único destinatário não pode absorver excedente além do limite',()=>{
    const s=setup(20);s.finisher=3;s.players[1].hand=[];s.players[2].hand=[];s.players[3].hand=[];s.penalty=20;s.highest=2;const card=c('dist',null);s.players[0].hand.push(card);const before=all(s);refresh();
    check(document.querySelector(`[data-card="${card.id}"]`).disabled,'Distribuidora inviável permitida');
    document.querySelector(`[data-card="${card.id}"]`).click();check(all(s)===before&&s.penalty===20,'estado mudou na recusa');
    document.getElementById('buyBtn').click();check(s.penalty===0&&s.phase==='gameOver'&&s.finisher===3,'compra final não preservada');
   });
   for(const direction of [1,-1])for(const color of ['red','blue','green','yellow'])test(`Giro preserva ${color}, direção ${direction} e não abre modal`,()=>{
    const s=setup(20);s.direction=direction;s.activeColor=color;const card=c('rotate',null);s.players[0].hand.push(card);
    const hands=s.players.map(p=>p.hand.filter(c=>c.id!==card.id).map(c=>c.id).join());play(card,'yellow');
    check(s.activeColor===color&&!s.pendingAction&&!document.querySelector('.colorbtn'),'Giro escolheu/mudou cor');
    check(s.direction===direction&&s.current===(direction===1?1:3),'sentido/turno');
    for(let i=0;i<4;i++)check(s.players[(i+direction+4)%4].hand.map(c=>c.id).join()===hands[i],'rotação incorreta');
   });
   Math.random=originalRandom;return tests;
  });
  results.forEach(name=>console.log('PASS',name));
  // A janela é validada no relógio real do motor, inclusive na fronteira exata.
  const fixture=()=>page.evaluate(()=>{
   const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'red',penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,lastActor:null,pendingAction:null,preUno:false,unoWindow:null,deadline:0,token:s.token+1});Object.assign(s.o,{duo:false,single:false,timeout:0,cut:true});
   s.discard=[{id:500000,type:'num',color:'red',num:0}];s.players.forEach((p,i)=>p.hand=[{id:500100+i,type:'num',color:'green',num:2}]);s.players[0].hand=[{id:500001,type:'draw2',color:'red'},{id:500002,type:'draw2',color:'red'},{id:500003,type:'num',color:'blue',num:9}];s.deck=Array.from({length:100},(_,i)=>({id:501000+i,type:'num',color:'green',num:7}));document.getElementById('useCardArt').onchange();
  });
  await fixture();await page.locator('[data-card="500001"]').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().unlockAt-Date.now()),2200);
  await page.evaluate(()=>CartasTest.getState().token++);await page.clock.runFor(2199);await page.locator('#cutBtn .cut-bubble').tap();
  assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),1);assert.equal(await page.evaluate(()=>CartasTest.getState().penalty),2);
  await fixture();await page.locator('[data-card="500001"]').tap();await page.evaluate(()=>CartasTest.getState().token++);await page.clock.runFor(2200);
  await page.evaluate(()=>document.querySelector('[data-card="500002"]').click());
  assert.equal(await page.evaluate(()=>CartasTest.getState().players[0].hand.length),2);
  console.log('PASS corte disponível até 2199 ms, recusado em 2200 ms; cópia própria não duplica efeito');
  assert.deepEqual(errors,[]);console.log(`PASS ${results.length+1} cenários novos de regras sem exceções JS`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
