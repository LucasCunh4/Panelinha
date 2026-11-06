import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../src/protocol.mjs';
import {createMatch,engine,perform,advance,nextWake,gameView,nextRound,returnLobby,settleReady,conserve} from '../src/game.mjs';
import {startRuntime,session,create,connect,waitFor} from './runtime.mjs';

function room(options={}){return {status:'lobby',rules:{...DEFAULT_RULES,...options},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',bot:false,connected:true,ready:true,team:i%2+1}))};}
function fixture(options={}){
 const r=room(options);createMatch(r,1000);const s=r.game,{core}=engine(r,5000);
 for(const p of s.players)p.hand=[];
 s.deck=[];s.discard=[];s.events=[];s.current=0;s.phase='playing';s.activeColor='red';s.direction=-1;s.penalty=0;s.highest=0;s.lastPenalty=null;s.finisher=null;s.unlockAt=0;s.deadline=0;s.countdownAt=0;s.cutOpen=false;s.drawn=null;s.botAt=0;s.botCutAt=0;s.summary=[];
 const card=(type='num',color='red',num=7)=>core.make(type,color,num);
 s.discard=[card()];s.deck=Array.from({length:80},()=>card('num','blue',2));
 for(const p of s.players)p.hand=[card(),card(),card()];
 const seal=()=>s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length;
 const actor=seat=>r.players.find(p=>p.id===s.seats[seat]);seal();return {r,s,core,card,actor,seal};
}
test('baralho oficial, assentos sorteados, parceiros opostos e contagem inicial bloqueada no servidor',()=>{
 for(const duo of [false,true])for(const wild6 of [false,true]){
  const r=room({duo,wild6,goal:duo?5:10});createMatch(r,1000);const s=r.game;conserve(s);
  assert.equal(s.cardCount,wild6?118:116);assert.equal(s.countdownAt,4000);assert.equal(s.direction,s.discard[0].type==='reverse'?1:-1);
  assert.equal(new Set(s.seats).size,4);
  if(duo)assert.equal(r.players.find(p=>p.id===s.seats[0]).team,r.players.find(p=>p.id===s.seats[2]).team);
  for(const p of r.players){const v=gameView(r,p.id,1001);assert.equal(v.players.filter(p=>p.hand).length,duo?2:1);assert.deepEqual(v.actions.legal,[]);assert.equal(v.actions.draw,false);assert.ok(!('deck' in v));assert.ok(!('lastPenalty' in v));}
  assert.ok(advance(r,4000));assert.equal(s.countdownAt,0);assert.equal(s.unlockAt,0);
 }
});
test('snapshots e eventos não enviam mãos adversárias, cartas de compra ou indicador privado de desafio',()=>{
 for(const duo of [false,true]){
  const f=fixture({duo});f.s.lastPenalty={id:1,type:'wild4',illegal:true,challengeable:true};f.core.drawMany(1,3);
  for(const p of f.r.players){const v=gameView(f.r,p.id,5000),self=v.self;for(const other of v.players){const visible=other.id===self||duo&&other.id%2===self%2;assert.equal('hand' in other,visible);if(visible)assert.deepEqual(other.hand,f.s.players[other.id].hand);}
   for(const e of v.events.filter(e=>e.type==='draw'))assert.equal('card' in e,e.actor===self||duo&&e.actor%2===self%2);
   const data=JSON.stringify(v);assert.ok(!data.includes('illegal'));for(const c of f.s.deck)assert.ok(!data.includes('"id":'+c.id+','));
  }
 }
});
for(const total of [20,40,80])for(const penalty of [0,2,12,40])test('Panela online: '+total+' cartas e +'+penalty+', redução, equilíbrio e conservação',()=>{
 const f=fixture(),s=f.s;s.players.forEach(p=>p.hand=[]);for(let i=0;i<total;i++)s.players[i%4].hand.push(f.card());
 const special=f.card('dist',null,null);s.players[0].hand.push(special);s.penalty=penalty;s.highest=penalty?6:0;f.seal();const count=s.cardCount,cap=s.players[0].hand.length-1,originalColor=s.activeColor;
 perform(f.r,f.actor(0),'play',{cardId:special.id},5000);conserve(s);const counts=s.players.map(p=>p.hand.length);
 assert.ok(cap-counts[0]>=1&&cap-counts[0]<=3);assert.ok(counts.every(n=>n>=1));assert.ok(Math.max(...counts.slice(1))-Math.min(...counts.slice(1))<=2);
 assert.equal(s.penalty,0);assert.equal(s.cardCount,count);assert.equal(s.activeColor,originalColor);assert.equal(s.pendingAction,null);
});
test('Panela pode bater sem seletor, mantém autor fora e Liquidificador conserva cor/direção',()=>{
 for(const duo of [false,true]){
  const f=fixture({duo,single:true}),c=f.card('dist',null,null);f.s.players[0].hand=[c];f.s.penalty=20;f.s.highest=6;f.seal();perform(f.r,f.actor(0),'play',{cardId:c.id},5000);
  assert.equal(f.s.phase,'gameOver');assert.equal(f.s.finisher,0);assert.equal(f.s.players[0].hand.length,0);assert.equal(f.s.penalty,0);assert.ok(f.s.players.slice(1).every(p=>p.hand.length));conserve(f.s);
 }
 for(const direction of [-1,1]){
  const f=fixture(),c=f.card('rotate',null,null);f.s.players[0].hand.push(c);f.s.direction=direction;const hands=f.s.players.map(p=>p.hand.filter(card=>card!==c).map(card=>card.id));f.seal();perform(f.r,f.actor(0),'play',{cardId:c.id},5000);
  for(let i=0;i<4;i++)assert.deepEqual(f.s.players[(i+direction+4)%4].hand.map(c=>c.id),hands[i]);assert.equal(f.s.activeColor,'red');assert.equal(f.s.direction,direction);conserve(f.s);
 }
});
test('Coringa/+4/+6 exigem cor; Panela/Liquidificador recusam cor; ação inválida não muda cartas',()=>{
 for(const type of ['wild','wild4','wild6','dist','rotate']){
  const f=fixture(),c=f.card(type,null,null);f.s.players[0].hand.push(c);f.seal();const cards=JSON.stringify(f.s.players),chooser=['wild','wild4','wild6'].includes(type);
  assert.throws(()=>perform(f.r,f.actor(0),'play',{cardId:c.id,...(!chooser?{color:'blue'}:{})},5000),e=>e.code==='ILLEGAL_MOVE'||e.code==='BAD_PAYLOAD');assert.equal(JSON.stringify(f.s.players),cards);
  perform(f.r,f.actor(0),'play',{cardId:c.id,...(chooser?{color:'green'}:{})},5000);assert.equal(f.s.activeColor,chooser?'green':'red');conserve(f.s);
 }
});
test('corte até 2199 ms, rejeitado em 2200; cópia própria não repete penalidade e primeiro corte válido altera janela',()=>{
 const f=fixture(),a=f.card('draw2'),b=f.card('draw2');f.s.players[0].hand.push(a,b);f.seal();perform(f.r,f.actor(0),'play',{cardId:a.id},5000);assert.equal(f.s.unlockAt,7200);assert.equal(f.s.penalty,2);
 const before=JSON.stringify(f.s);assert.throws(()=>perform(f.r,f.actor(0),'cut',{cardId:b.id},7200),e=>e.code==='ILLEGAL_MOVE');assert.equal(JSON.stringify(f.s),before);
 perform(f.r,f.actor(0),'cut',{cardId:b.id},7199);assert.equal(f.s.penalty,2);assert.equal(f.s.discard.at(-1).id,b.id);conserve(f.s);
});
test('desafio procedente/improcedente, penalidades, compra opcional e término automático de turno',()=>{
 for(const illegal of [false,true]){
  const f=fixture();f.s.penalty=12;f.s.highest=6;f.s.lastPenalty={id:1,type:'wild6',illegal,challengeable:true};const counts=f.s.players.map(p=>p.hand.length);perform(f.r,f.actor(0),'challenge',{},5000);
  assert.equal(f.s.penalty,0);assert.equal(f.s.players[illegal?1:0].hand.length,counts[illegal?1:0]+(illegal?12:14));assert.equal(f.s.current,illegal?0:3);conserve(f.s);
 }
 const f=fixture({timeout:15});f.s.deck.push(f.card());f.seal();perform(f.r,f.actor(0),'draw',{},5000);assert.ok(f.s.drawn);perform(f.r,f.actor(0),'pass',{},5001);assert.equal(f.s.current,3);
 f.s.current=0;f.s.deadline=6000;f.s.unlockAt=0;f.s.penalty=20;f.s.highest=6;const old=f.s.players[0].hand.length;advance(f.r,6000);assert.equal(f.s.players[0].hand.length,old+20);assert.equal(f.s.current,3);assert.equal(f.s.penalty,0);conserve(f.s);
});
test('anúncio e denúncia são eventos reais ordenados, sem duplicação por render',()=>{
 const f=fixture();f.s.players[0].hand=f.s.players[0].hand.slice(0,2);f.seal();perform(f.r,f.actor(0),'announce',{},5000);assert.equal(f.s.events.filter(e=>e.type==='last-card').length,1);
 assert.throws(()=>perform(f.r,f.actor(0),'announce',{},5001),e=>e.code==='ILLEGAL_MOVE');perform(f.r,f.actor(0),'play',{cardId:f.s.players[0].hand[0].id},5002);assert.equal(f.s.unoWindow,null);assert.equal(f.s.events.filter(e=>e.type==='last-card').length,1);
 const a=fixture();a.s.players[0].hand=a.s.players[0].hand.slice(0,2);a.seal();perform(a.r,a.actor(0),'play',{cardId:a.s.players[0].hand[0].id},5000);assert.equal(a.s.unoWindow.id,0);perform(a.r,a.actor(1),'report',{},5001);assert.equal(a.s.players[0].hand.length,3);conserve(a.s);
});
test('rodadas, pontuação, mesmo vencedor inicia e revanche conserva código',()=>{
 const f=fixture({single:false,goal:50,cut:false}),c=f.card();f.s.players[0].hand=[c];f.r.code='000007';f.seal();perform(f.r,f.actor(0),'play',{cardId:c.id},5000);
 assert.equal(f.s.phase,'roundOver');assert.equal(f.s.players[0].score,3);assert.ok(f.r.players.every(p=>!p.ready));for(const p of f.r.players)p.ready=true;
 f.s.cardCount=118;nextRound(f.r,6000);assert.equal(f.s.round,2);const first=f.s.discard[0];assert.equal(f.s.current,first.type==='skip'?3:first.type==='reverse'?1:0);assert.equal(f.s.players[0].score,3);
 f.s.phase='gameOver';for(const p of f.r.players)p.ready=true;returnLobby(f.r);assert.equal(f.r.status,'lobby');assert.equal(f.r.game,undefined);assert.equal(f.r.code,'000007');assert.ok(f.r.players.every(p=>!p.ready));
});
test('bots completam partidas Individual e Duplas sem perdas/duplicações',()=>{
 for(const duo of [false,true]){
  const r=room({duo,goal:duo?5:10,single:true,cut:false});for(const p of r.players)p.bot=true;createMatch(r,1000);let now=1000,steps=0;
  while(r.game.phase==='playing'&&steps++<10000){now=Math.max(now+1,nextWake(r,now));assert.ok(Number.isFinite(now));advance(r,now);conserve(r.game);}
  assert.equal(r.game.phase,'gameOver');assert.equal(r.game.summary.length,4);assert.equal(r.game.players[r.game.finisher].hand.length,0);
 }
});
test('quatro WebSockets: início autorizado, snapshots privados, jogada única e comandos host bloqueados durante partida',async t=>{
 const {mf,url}=await startRuntime();t.after(()=>mf.dispose());const users=[];for(let i=0;i<4;i++)users.push(await session(url,'p'+i));const code=await create(url,users[0]),clients=[];
 for(const u of users)clients.push(await connect(url,code,u));for(const c of clients)await c.command('ready',{ready:true});await clients[0].command('start');
 for(const c of clients)await waitFor(()=>c.state.game);assert.ok(clients.every(c=>c.state.phase==='match'&&c.state.game.players.filter(p=>p.hand).length===1));
 const outsider=await session(url,'visitor');await assert.rejects(connect(url,code,outsider),e=>e.code==='MATCH_STARTED');
 await assert.rejects(clients[0].command('rules',{rules:DEFAULT_RULES}),e=>e.code==='MATCH_STARTED');assert.equal(clients[0].closed,null);
 await waitFor(()=>clients[0].state.game.unlockAt===0,7000);
 const actor=clients.find(c=>c.state.game.self===c.state.game.current),g=actor.state.game;
 if(g.actions.legal.length){const card=g.players[g.self].hand.find(c=>c.id===g.actions.legal[0]),data={cardId:card.id,...(['wild','wild4','wild6'].includes(card.type)&&g.players[g.self].count>1?{color:'red'}:{})},id=crypto.randomUUID();const old=g.players[g.self].count;
  await actor.command('play',data,id);const count=actor.state.game.players[g.self].count,duplicate=await actor.send('play',data,0,id);assert.ok(duplicate.duplicate);assert.equal(actor.state.game.players[g.self].count,count);if(!['dist','rotate'].includes(card.type))assert.equal(count,old-1);
 }else await actor.command('draw');
 for(const u of users)for(const c of clients)assert.ok(!JSON.stringify(c.messages).includes(u.token));await clients[0].command('close-room');
});
test('retorno durante partida conserva posição/mão, bloqueia visitante e perfil, sem devolver anfitrião antigo',async t=>{
 const {mf,url}=await startRuntime();t.after(()=>mf.dispose());const host=await session(url,'host-retorno','Anfitrião'),user=await session(url,'guest-retorno','Convidado'),code=await create(url,host),a=await connect(url,code,host),b=await connect(url,code,user);
 await a.command('add-bot');await a.command('add-bot');await a.command('ready',{ready:true});await b.command('ready',{ready:true});await a.command('start');await waitFor(()=>b.state.game);
 const seat=b.state.game.self,hand=b.state.game.players[seat].hand,identity=b.selfId;b.ws.close();await waitFor(()=>a.state.players.find(p=>p.id===identity).connected===false);
 const stranger=await session(url,'visitante-retorno');await assert.rejects(connect(url,code,stranger),e=>e.code==='MATCH_STARTED');
 const back=await connect(url,code,{...user,profile:{...user.profile,name:'Nome alterado indevidamente'}});assert.equal(back.selfId,identity);assert.equal(back.state.game.self,seat);assert.deepEqual(back.state.game.players[seat].hand,hand);assert.equal(back.state.players.find(p=>p.id===identity).name,'Convidado');
 a.ws.close();await waitFor(()=>back.state.hostId===identity);const oldHost=await connect(url,code,host);assert.equal(oldHost.state.hostId,identity);assert.ok(oldHost.state.game);await back.command('close-room');
});
test('punição grande conserva uma animação privada/oculta por carta, sem replay de cartas futuras',()=>{
 const f=fixture();f.s.penalty=60;f.s.highest=6;const old=f.s.players[0].hand.length;perform(f.r,f.actor(0),'draw',{},5000);
 assert.equal(f.s.players[0].hand.length,old+60);const self=gameView(f.r,f.actor(0).id,5000),other=gameView(f.r,f.actor(1).id,5000);
 assert.equal(self.events.filter(e=>e.type==='draw').length,60);assert.ok(self.events.filter(e=>e.type==='draw').every(e=>e.card));assert.equal(other.events.filter(e=>e.type==='draw').length,60);assert.ok(other.events.filter(e=>e.type==='draw').every(e=>!e.card));conserve(f.s);
});
test('aba antiga permanece no lobby sem perder identidade, mas precisa atualizar para iniciar',async t=>{
 const {mf,url}=await startRuntime();t.after(()=>mf.dispose());const user=await session(url,'compatibilidade'),code=await create(url,user),old=await connect(url,code,{...user,clientPhase:1});
 await old.command('add-bot');await old.command('add-bot');await old.command('add-bot');await old.command('ready',{ready:true});assert.equal(old.state.canStart,false);assert.equal(old.state.upgradeRequired,true);await assert.rejects(old.command('start'),e=>e.code==='UPGRADE_REQUIRED');
 const updated=await connect(url,code,user);assert.equal(updated.selfId,old.selfId);assert.equal(updated.state.canStart,true);await updated.command('start');assert.equal(updated.state.phase,'match');await updated.command('close-room');
});
test('anúncio preventivo não fica indevidamente ativo depois de compra ou troca de mão',()=>{
 const f=fixture();f.s.players[0].hand=f.s.players[0].hand.slice(0,2);f.seal();perform(f.r,f.actor(0),'announce',{},5000);assert.equal(f.s.preUnoById[0],true);perform(f.r,f.actor(0),'draw',{},5001);assert.equal(f.s.preUnoById[0],undefined);
 const other=fixture();other.s.preUnoById[1]=true;const c=other.card('rotate',null,null);other.s.players[0].hand.push(c);other.seal();perform(other.r,other.actor(0),'play',{cardId:c.id},5000);assert.deepEqual(other.s.preUnoById,{});
});
test('final com último participante substituído por bot retorna ao lobby sem exigir Pronto fictício',()=>{
 const f=fixture({single:true}),c=f.card();f.s.players[0].hand=[c];f.seal();perform(f.r,f.actor(0),'play',{cardId:c.id},5000);assert.equal(f.s.phase,'gameOver');
 for(const p of f.r.players)p.ready=true;const departed=f.r.players[3];departed.connected=false;f.r.code='000007';assert.equal(settleReady(f.r),true);assert.equal(f.r.status,'lobby');assert.equal(f.r.code,'000007');assert.equal(f.r.players[3],null);assert.ok(f.r.players.filter(Boolean).every(p=>!p.ready));
});
