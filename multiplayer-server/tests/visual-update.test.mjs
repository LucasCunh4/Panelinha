import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../src/protocol.mjs';
import {createMatch,engine,perform,gameView,conserve,advance,nextWake} from '../src/game.mjs';
function fixture(){
 const r={status:'lobby',rules:{...DEFAULT_RULES,timeout:15},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',bot:false,connected:true,ready:true,team:i%2+1}))};createMatch(r,1000);
 const s=r.game,{core}=engine(r,5000);Object.assign(s,{phase:'playing',current:0,direction:-1,activeColor:'red',penalty:0,highest:0,finisher:null,unlockAt:0,presentationUntil:0,lastDistribution:null,countdownAt:0,deadline:0,cutOpen:false,drawn:null,unoWindow:null,preUnoById:{},events:[]});
 const c=(t='num',color='red',n=7)=>core.make(t,color,n);s.discard=[c()];s.deck=Array.from({length:70},()=>c('num','blue',2));for(const p of s.players)p.hand=Array.from({length:8},()=>c());
 const seal=()=>s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length,actor=id=>r.players.find(p=>p.id===s.seats[id]);seal();return{r,s,core,c,seal,actor};
}
test('Panela inclui quatro mãos, reduz autor, conserva cartas e é proibida sob penalidade',()=>{
 for(const penalty of [0,20]){const f=fixture();f.s.players[0].hand.push(f.c('dist',null));f.s.penalty=penalty;f.s.highest=penalty?6:0;f.seal();const ids=[...f.s.deck,...f.s.discard,...f.s.players.flatMap(p=>p.hand)].map(c=>c.id).sort();
  const id=f.s.players[0].hand.at(-1).id;if(penalty){const before=JSON.stringify(f.s);assert.throws(()=>perform(f.r,f.actor(0),'play',{cardId:id},5000),e=>e.code==='ILLEGAL_MOVE');assert.equal(JSON.stringify(f.s),before);conserve(f.s);continue;}perform(f.r,f.actor(0),'play',{cardId:id},5000);const d=f.s.lastDistribution;
  assert.deepEqual(d.active,[0,1,2,3]);assert.equal(d.beforeCounts[0],8);assert.ok(d.actorReduction>=1&&d.actorReduction<=3);assert.equal(f.s.players[0].hand.length,8-d.actorReduction);assert.ok(f.s.players.every(p=>p.hand.length>=1));const sizes=f.s.players.slice(1).map(p=>p.hand.length);assert.ok(Math.max(...sizes)-Math.min(...sizes)<=2);assert.equal(d.penaltyAdded,penalty);assert.equal(f.s.penalty,0);assert.ok(!f.s.players.flatMap(p=>p.hand).some(c=>c.id===id));assert.deepEqual([...f.s.deck,...f.s.discard,...f.s.players.flatMap(p=>p.hand)].map(c=>c.id).sort(),ids);conserve(f.s);
  assert.equal(f.s.presentationUntil,7000);assert.equal(f.s.unlockAt,9200);assert.equal(nextWake(f.r,5000),7000);assert.equal(gameView(f.r,f.actor(1).id,5000).actions.cuts.length,0);assert.throws(()=>perform(f.r,f.actor(1),'draw',{},6000),e=>e.code==='ILLEGAL_MOVE');advance(f.r,7000);assert.equal(f.s.presentationUntil,0);
  const view=gameView(f.r,f.actor(1).id,7000);assert.equal(view.players.filter(p=>p.hand).length,1);assert.ok(!JSON.stringify(view.lastDistribution).includes('"hand"'));
 }
});
test('Última Carta usa turno, duas cartas e descarte legal; servidor rejeita fraude',()=>{
 const f=fixture();f.s.players[0].hand=[f.c('num','blue',3),f.c('num','yellow',4)];f.seal();assert.equal(f.core.canAnnounceUNO(0),false);assert.throws(()=>perform(f.r,f.actor(0),'announce',{},5000),e=>e.code==='ILLEGAL_MOVE');
 f.s.players[0].hand[0].color='red';assert.equal(f.core.canAnnounceUNO(0),true);f.s.current=1;assert.equal(f.core.canAnnounceUNO(0),false);f.s.current=0;f.s.penalty=6;f.s.highest=6;assert.equal(f.core.canAnnounceUNO(0),false);f.s.players[0].hand[0]=f.c('wild6',null);assert.equal(f.core.canAnnounceUNO(0),true);f.seal();perform(f.r,f.actor(0),'announce',{},5000);assert.equal(f.s.preUnoById[0],true);assert.equal(f.core.canAnnounceUNO(0),false);
});
test('Liquidificador só permite anúncio se mão recebida realmente terminar com uma carta',()=>{
 const f=fixture();f.s.players[0].hand=[f.c('rotate',null),f.c('num','blue',3)];f.seal();assert.equal(f.core.canAnnounceUNO(0),false);f.s.players[1].hand=[f.c()];f.seal();assert.equal(f.core.canAnnounceUNO(0),true);
});
test('Compra mantém a decisão só para carta comprada legal; punição não oferece jogar',()=>{
 const f=fixture();const c=f.c('wild',null);f.s.deck.push(c);f.seal();perform(f.r,f.actor(0),'draw',{},5000);assert.equal(f.s.drawn,c.id);assert.ok(gameView(f.r,f.actor(0).id,5000).actions.legal.includes(c.id));perform(f.r,f.actor(0),'pass',{},5001);assert.notEqual(f.s.current,0);conserve(f.s);
 const g=fixture();g.s.penalty=6;g.s.highest=6;g.seal();const n=g.s.players[0].hand.length;perform(g.r,g.actor(0),'draw',{},5000);assert.equal(g.s.players[0].hand.length,n+6);assert.equal(g.s.drawn,null);assert.equal(g.s.penalty,0);conserve(g.s);
});
test('lobby WebSocket cria sala, entra, configura bots e inicia snapshot privado',async t=>{
 const {startRuntime,session,create,connect,waitFor}=await import('./runtime.mjs');const {mf,url}=await startRuntime();t.after(()=>mf.dispose());
 const a=await session(url,'visual-a','Ana'),b=await session(url,'visual-b','Beto'),code=await create(url,a);assert.match(code,/^\d{6}$/);
 const host=await connect(url,code,a),guest=await connect(url,code,b);t.after(()=>{host.ws.close();guest.ws.close()});await host.command('add-bot');await host.command('add-bot');await host.command('ready',{ready:true});await guest.command('ready',{ready:true});await waitFor(()=>host.state.allReady);await host.command('start');await waitFor(()=>guest.state.game);
 for(const c of [host,guest]){const g=c.state.game;assert.equal(g.players.length,4);assert.equal(g.players.filter(p=>p.hand).length,1);assert.ok(g.actions.legal.length===0);assert.equal(g.lastDistribution?.actor??null,null);}await host.command('close-room');
});
