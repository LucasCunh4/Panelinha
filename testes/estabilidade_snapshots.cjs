const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
  const {DEFAULT_RULES}=await import('../multiplayer-server/src/protocol.mjs');
  const G=await import('../multiplayer-server/src/game.mjs');
  const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await p.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8123');
    for(const duo of [false,true]){
      const room={status:'lobby',rules:{...DEFAULT_RULES,duo,cut:false},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',bot:false,connected:true,ready:true,team:i%2+1}))};
      let now=Date.now();G.createMatch(room,now);const s=room.game;const {core}=G.engine(room,now);
      s.seats=room.players.map(q=>q.id);s.matchId+='-'+duo;
      Object.assign(s,{current:0,countdownAt:0,unlockAt:0,presentationUntil:0,playUntil:0,dealUntil:0,lastPlay:null,lastDeal:null,lastNormalPurchase:null,botDrawPending:null,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false});
      s.players.forEach(q=>q.hand=Array.from({length:15},()=>core.make('num','red',7)));
      s.players[0].hand[0]=core.make('dist');s.deck=Array.from({length:50},()=>core.make('num','blue',1));s.discard=[core.make('num','red',7)];s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(q=>q.hand).length;
      const viewer=room.players[1],receive=async()=>{
        const game=G.gameView(room,viewer.id,Date.now());
        await p.evaluate(v=>PanelinhaOnline.receive(v),{status:'connected',selfId:viewer.id,state:{code:'123456',hostId:room.players[0].id,players:room.players,allReady:false,game}});
      };
      await receive();await p.waitForTimeout(250);assert.equal(await p.locator('#localIdentity .local-player-name').textContent(),viewer.name);
      await p.evaluate(()=>{window.saved=[...document.querySelectorAll('#hand>[data-card],[data-hand-card]')];});
      for(let i=0;i<3;i++)await receive();
      assert.equal(await p.evaluate(()=>saved.every(n=>n.isConnected)),true);
      // A compra de outro cliente mostra só verso e não recria as outras mãos.
      now=Date.now();G.perform(room,room.players[0],'draw',{},now);await receive();
      assert.equal(await p.locator('[data-effect=draw] .card-symbol,[data-effect=draw] .card-food').count(),0);
      for(let i=0;i<3;i++){await p.waitForTimeout(110);await receive();assert.equal(await p.evaluate(()=>saved.every(n=>n.isConnected)),true);}
      await p.waitForFunction(()=>!document.querySelector('[data-effect=draw]'));
      assert.equal(await p.locator('#player3 [data-hand-card]').count(),16);
      // Recebe o efeito público do motor, incluindo snapshots repetidos durante o voo.
      Object.assign(s,{current:0,unlockAt:0,playUntil:0,presentationUntil:0,lastNormalPurchase:null,drawn:null,cutOpen:false});await receive();
      const id=s.players[0].hand.find(c=>c.type==='dist').id;G.perform(room,room.players[0],'play',{cardId:id},Date.now());await receive();
      await p.waitForFunction(()=>!!document.querySelector('[data-effect=pressure-deal]'));
      const meta=G.gameView(room,viewer.id,Date.now()).lastDistribution;assert.equal(meta.active.length,4);assert.equal('cards' in meta,false);
      const count=s.players.reduce((n,q)=>n+q.hand.length,0);
      assert.equal(await p.locator('[data-effect=pressure-deal]').count(),count);
      await p.evaluate(()=>{window.packs=[...document.querySelectorAll('[data-effect=pressure-deal]')];window.hand=[...document.querySelectorAll('#hand>[data-card],[data-hand-card]')];});
      await receive();assert.equal(await p.evaluate(()=>packs.every(n=>n.isConnected)&&hand.every(n=>n.isConnected)),true);
      for(const actor of [1,3])assert.equal(await p.locator(`[data-effect=pressure-deal][data-actor="${actor}"] .card-symbol`).count(),0);
      await p.waitForFunction(()=>!document.querySelector('#table.pressure-transition'));
      assert.equal(await p.locator('[data-effect=pressure-deal]').count(),0);G.conserve(s);
      console.log(`PASS snapshots autoritativos ${duo?'Duplas':'Individual'}: mãos persistentes, compra alheia fechada, Panela sem reinício em snapshots repetidos, quatro mãos e conservação`);
    }
    assert.deepEqual(errors,[]);
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
