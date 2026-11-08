import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../src/protocol.mjs';
import {createMatch,engine,perform,advance,gameView,conserve,pauseMatch,resumeMatch,refreshAutomation,nextWake} from '../src/game.mjs';
const Rules=globalThis.PanelinhaRules;
function fixture(options={}){
 const r={status:'lobby',rules:{...DEFAULT_RULES,infinite:false,single:false,timeout:15,goal:10,...options},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',ready:true,connected:true,bot:false,team:i%2+1}))};createMatch(r,1000);const s=r.game,{core}=engine(r,5000);
 Object.assign(s,{phase:'playing',current:0,direction:1,activeColor:'red',penalty:0,highest:0,lastPenalty:null,finisher:null,unlockAt:0,deadline:0,countdownAt:0,cutOpen:false,drawn:null,blockedPlayer:null,presentationUntil:0,lastPenaltyPurchase:null,lastDistribution:null,lastRotation:null,finalStandings:null,events:[],botAt:0,botCutAt:0,reportAt:0,idleAt:0});
 const c=(type='num',color='red',num=7)=>core.make(type,color,num);s.discard=[c()];s.deck=Array.from({length:90},()=>c());for(const p of s.players)p.hand=[c(),c(),c()];
 const seal=()=>s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length,actor=id=>r.players.find(p=>p.id===s.seats[id]);seal();return{r,s,core,c,seal,actor};
}
test('Bloqueio proíbe descarte/corte do bloqueado, sem fechar cortes alheios e futuros',()=>{
 for(const direction of [1,-1]){const f=fixture();f.s.direction=direction;const blocked=(4+direction)%4,other=(4-direction)%4,skip=f.c('skip');f.s.players[0].hand.push(skip);const blockedSkip=f.c('skip'),otherSkip=f.c('skip');f.s.players[blocked].hand.push(blockedSkip);f.s.players[other].hand.push(otherSkip);f.seal();perform(f.r,f.actor(0),'play',{cardId:skip.id},5000);
 assert.equal(f.s.current,2);assert.equal(f.s.blockedPlayer,blocked);assert.equal(engine(f.r,5001).core.checkCards(blocked,[blockedSkip.id],true),false);assert.throws(()=>perform(f.r,f.actor(blocked),'cut',{cardId:blockedSkip.id},5001),e=>e.code==='ILLEGAL_MOVE');assert.ok(engine(f.r,5001).core.checkCards(other,[otherSkip.id],true));
 assert.equal(engine(f.r,5001).core.applyPlay(blocked,[blockedSkip.id],false),false);
 const nextCard=f.s.players[2].hand[0];perform(f.r,f.actor(2),'play',{cardId:nextCard.id},7201);assert.equal(f.s.blockedPlayer,null);assert.ok(engine(f.r,7202).core.checkCards(blocked,[f.s.players[blocked].hand[0].id],true));conserve(f.s);
 }
});
test('Panela é ilegal sob +2/+4/+6/acumulado e continua distribuindo normalmente fora da punição',()=>{
 for(const penalty of [2,4,6,20]){const f=fixture();const dist=f.c('dist',null),stack=f.c('wild6',null);f.s.players[0].hand.push(dist,stack);f.s.penalty=penalty;f.s.highest=Math.min(6,penalty);f.seal();const cards=JSON.stringify([f.s.deck,f.s.discard,f.s.players]);assert.equal(f.core.canPlay(dist),false);assert.equal(f.core.canDistribute(dist),false);assert.throws(()=>perform(f.r,f.actor(0),'play',{cardId:dist.id},5000),e=>e.code==='ILLEGAL_MOVE');assert.equal(JSON.stringify([f.s.deck,f.s.discard,f.s.players]),cards);assert.equal(f.s.penalty,penalty);assert.ok(f.core.canPlay(stack));}
 const f=fixture(),dist=f.c('dist',null);f.s.players[0].hand.push(dist);f.seal();perform(f.r,f.actor(0),'play',{cardId:dist.id},5000);assert.deepEqual(f.s.lastDistribution.active,[0,1,2,3]);assert.ok(f.s.lastDistribution.actorReduction>=1);assert.equal(f.s.lastDistribution.penaltyAdded,0);conserve(f.s);
});
test('compra forçada trava pelo cronograma compartilhado, conserva cartas e libera sem ACK mesmo desconectado',()=>{
 for(const n of [2,6,20]){const f=fixture();f.s.penalty=n;f.s.highest=2;f.seal();const before=f.s.players[0].hand.length;perform(f.r,f.actor(0),'draw',{},5000);const until=f.s.presentationUntil;assert.equal(until,5000+Rules.drawSequence(n,'penalty').duration+Rules.DRAW_PACES.penalty.settle);assert.equal(f.s.players[0].hand.length,before+n);assert.equal(f.s.penalty,0);assert.equal(f.s.current,1);assert.equal(f.s.deadline,until+15000);assert.throws(()=>perform(f.r,f.actor(1),'play',{cardId:f.s.players[1].hand[0].id},until-1),e=>e.code==='ILLEGAL_MOVE');
 const own=gameView(f.r,f.actor(0).id,5000);assert.equal(own.lastPenaltyPurchase.cardIds.length,n);for(const id of [1,2,3]){const v=gameView(f.r,f.actor(id).id,5000);assert.ok(!('cardIds' in v.lastPenaltyPurchase));assert.deepEqual(v.actions.legal,[]);assert.equal(v.actions.draw,false);}
 f.actor(0).connected=false;refreshAutomation(f.r,5100);assert.equal(nextWake(f.r,5100),until);advance(f.r,until-1);assert.equal(f.s.presentationUntil,until);advance(f.r,until);assert.equal(f.s.presentationUntil,0);assert.ok(gameView(f.r,f.actor(1).id,until).actions.legal.length);conserve(f.s);
 }
});
test('pausa/reconexão conserva a espera e denúncia preserva decisão/tempo do turno em andamento',()=>{
 const f=fixture();f.s.penalty=2;f.s.highest=2;f.seal();perform(f.r,f.actor(0),'draw',{},5000);const until=f.s.presentationUntil;pauseMatch(f.r,5100);assert.equal(f.s.frozen.presentationUntil,until-5100);resumeMatch(f.r,6000);advance(f.r,9000);assert.equal(f.s.presentationUntil,9000+until-5100);assert.deepEqual(gameView(f.r,f.actor(1).id,9000).actions.legal,[]);
 const u=fixture();u.s.current=1;u.s.players[0].hand=u.s.players[0].hand.slice(0,1);u.s.unoWindow={id:0};u.s.drawn=u.s.players[1].hand[0].id;u.s.deadline=12000;u.seal();perform(u.r,u.actor(2),'report',{},5000);const duration=u.s.lastPenaltyPurchase.duration;assert.equal(u.s.current,1);assert.equal(u.s.drawn,u.s.players[1].hand[0].id);assert.equal(u.s.deadline,12000+duration);assert.equal(u.s.players[0].hand.length,3);conserve(u.s);
});
test('pódio final por pontos usa total/vitórias, mantém empates e não altera a classificação da rodada',()=>{
 const f=fixture();f.s.players[0].hand=[f.s.players[0].hand[0]];f.s.players.forEach((p,i)=>p.score=[1,9,7,8][i]);f.seal();perform(f.r,f.actor(0),'play',{cardId:f.s.players[0].hand[0].id},5000);assert.equal(f.s.phase,'gameOver');assert.equal(f.s.winnerId,1);assert.equal(f.s.summary[0].id,0);assert.deepEqual(f.s.finalStandings.map(g=>[g.place,g.playerIds]),[[1,[1]],[2,[2,3]],[4,[0]]]);assert.deepEqual(gameView(f.r,f.actor(3).id,5001).finalStandings,f.s.finalStandings);assert.equal(f.s.events.filter(e=>e.type==='sound'&&e.name==='round-result').length,1);
 const round=fixture();round.s.players[0].hand=[round.s.players[0].hand[0]];round.seal();perform(round.r,round.actor(0),'play',{cardId:round.s.players[0].hand[0].id},5000);assert.equal(round.s.phase,'roundOver');assert.equal(round.s.finalStandings,null);
});
test('pódio de partida única preserva ordem oficial e Duplas preserva vencedor/equipes',()=>{
 const f=fixture({single:true});f.s.players[0].hand=[f.s.players[0].hand[0]];f.seal();perform(f.r,f.actor(0),'play',{cardId:f.s.players[0].hand[0].id},5000);assert.deepEqual(f.s.finalStandings.map(g=>g.playerIds[0]),f.s.summary.map(p=>p.id));
 const d=fixture({duo:true,goal:5});d.s.teams=[4,3];d.s.players[0].hand=[d.s.players[0].hand[0]];d.seal();perform(d.r,d.actor(0),'play',{cardId:d.s.players[0].hand[0].id},5000);assert.equal(d.s.winnerTeam,0);assert.deepEqual(d.s.finalStandings.map(g=>g.playerIds),[[0,2],[1,3]]);assert.deepEqual(d.s.teams,[5,3]);conserve(d.s);
});
test('desafios e punição final também mantêm a barreira até a última carta comprada',()=>{
 for(const illegal of [true,false]){const f=fixture();f.s.penalty=6;f.s.highest=6;f.s.lastPenalty={id:1,type:'wild6',illegal,challengeable:true};f.seal();perform(f.r,f.actor(0),'challenge',{},5000);const buyer=illegal?1:0,count=illegal?6:8;assert.equal(f.s.players[buyer].hand.length,3+count);assert.equal(f.s.lastPenaltyPurchase.actor,buyer);assert.equal(f.s.lastPenaltyPurchase.reason,'challenge');assert.equal(f.s.presentationUntil,5000+Rules.drawSequence(count,'penalty').duration+Rules.DRAW_PACES.penalty.settle);assert.equal(f.s.current,illegal?0:1);assert.deepEqual(gameView(f.r,f.actor(f.s.current).id,5001).actions.legal,[]);conserve(f.s);}
 const f=fixture({single:true});f.s.finisher=3;f.s.players[3].hand=[];f.s.penalty=6;f.s.highest=6;f.seal();perform(f.r,f.actor(0),'draw',{},5000);assert.equal(f.s.phase,'gameOver');assert.ok(f.s.finalStandings);assert.equal(nextWake(f.r,5001),f.s.presentationUntil);advance(f.r,f.s.presentationUntil);assert.equal(f.s.presentationUntil,0);conserve(f.s);
});
