import {test} from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../src/protocol.mjs';import {createMatch,engine,perform,gameView,conserve} from '../src/game.mjs';
function fixture(duo=false){const r={status:'lobby',rules:{...DEFAULT_RULES,duo,single:false,goal:duo?15:50},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',bot:false,connected:true,ready:true,team:i%2+1}))};createMatch(r,1000);const s=r.game,{core}=engine(r,5000);Object.assign(s,{blockedPlayer:null,current:0,activeColor:'red',direction:-1,penalty:0,highest:0,finisher:null,unlockAt:0,presentationUntil:0,lastDistribution:null,lastRotation:null,countdownAt:0,deadline:0,drawn:null,cutOpen:false,events:[]});const card=(type='num',color='red',num=7)=>core.make(type,color,num);s.deck=Array.from({length:30},()=>card());s.discard=[card()];s.players.forEach((p,i)=>p.hand=Array.from({length:i+3},()=>card()));const seal=()=>s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length,actor=id=>r.players.find(p=>p.id===s.seats[id]);seal();return {r,s,core,card,seal,actor};}
test('novas salas iniciam em partida única, seis opcionais ativos',()=>{assert.equal(DEFAULT_RULES.single,true);for(const k of ['infinite','cut','challenge','wild6','dist','rotate'])assert.equal(DEFAULT_RULES[k],true);});
test('Liquidificador mantém regra/cor nos dois sentidos, bloqueia transição e não publica cartas nos metadados',()=>{
 for(const direction of [-1,1]){const f=fixture();f.s.direction=direction;const c=f.card('rotate',null);f.s.players[0].hand.push(c);f.seal();const before=f.s.players.map(p=>p.hand.filter(c=>c.type!=='rotate').map(c=>c.id));perform(f.r,f.actor(0),'play',{cardId:c.id},5000);
 assert.deepEqual(f.s.players.map(p=>p.hand.map(c=>c.id)),[0,1,2,3].map(i=>before[(i-direction+4)%4]));assert.equal(f.s.activeColor,'red');assert.equal(f.s.presentationUntil,7000);assert.equal(f.s.lastRotation.transfers.length,4);assert.deepEqual(f.s.lastRotation.active,[0,1,2,3]);assert.throws(()=>perform(f.r,f.actor(1),'draw',{},6000),e=>e.code==='ILLEGAL_MOVE');
 const v=gameView(f.r,f.actor(1).id,5000);assert.equal(v.players.filter(p=>p.hand).length,1);assert.ok(!JSON.stringify(v.lastRotation).includes('"hand"'));conserve(f.s);
 }
});
test('placar registra deltas reais da rodada sem alterar pontuação individual ou por duplas',()=>{
 for(const duo of [false,true]){const f=fixture(duo);f.s.players[0].hand=[f.card()];f.s.players[0].score=12;f.s.teams=[4,3];f.seal();perform(f.r,f.actor(0),'play',{cardId:f.s.players[0].hand[0].id},5000);assert.equal(f.s.phase,'roundOver');
 if(duo){assert.deepEqual(f.s.roundScore.teams.map(t=>[t.before,t.earned,t.total]),[[4,1,5],[3,0,3]]);assert.equal(f.s.players[0].score,12);}else{const a=f.s.roundScore.players[0];assert.deepEqual([a.before,a.earned,a.total],[12,3,15]);assert.deepEqual(f.s.roundScore.players.map(p=>p.earned).sort(),[0,1,2,3]);}
 assert.deepEqual(gameView(f.r,f.actor(0).id,5001).roundScore,f.s.roundScore);conserve(f.s);
 }
});
