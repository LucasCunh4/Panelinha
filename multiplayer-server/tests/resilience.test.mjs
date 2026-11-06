import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../src/protocol.mjs';
import {createMatch,engine,perform,advance,nextWake,gameView,pauseMatch,resumeMatch,reclaim,refreshAutomation,conserve} from '../src/game.mjs';
import {startRuntime,session,create,connect,waitFor} from './runtime.mjs';

function fixture(options={}){
  const r={status:'lobby',rules:{...DEFAULT_RULES,...options},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',bot:false,connected:true,ready:true,team:i%2+1}))};
  createMatch(r,1000);const s=r.game,{core}=engine(r,5000);
  Object.assign(s,{deck:[],discard:[],events:[],current:0,phase:'playing',activeColor:'red',direction:-1,penalty:0,highest:0,lastPenalty:null,finisher:null,unlockAt:0,deadline:0,countdownAt:0,cutOpen:false,drawn:null,botAt:0,botCutAt:0,reportAt:0,idleAt:0});
  const card=(type='num',color='red',num=7)=>core.make(type,color,num);
  s.discard=[card()];s.deck=Array.from({length:80},()=>card('num','blue',2));for(const p of s.players)p.hand=[card(),card(),card()];
  const seal=()=>s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length;
  const actor=seat=>r.players.find(p=>p.id===s.seats[seat]);seal();return {r,s,core,card,actor,seal};
}
test('pausa sem limite congela todos os prazos e bloqueia todas as intenções de cartas',()=>{
  const f=fixture({timeout:15});f.actor(0).bot=true;Object.assign(f.s,{unlockAt:7200,deadline:22200,cutOpen:true,botAt:7250,botCutAt:5700,reportAt:5850,unoWindow:{id:1}});
  pauseMatch(f.r,5500);const frozen=structuredClone(f.s.frozen),before=JSON.stringify(f.s);assert.deepEqual(frozen,{unlockAt:1700,deadline:16700,countdownAt:0,botAt:1750,botCutAt:200,reportAt:350,idleAt:0});
  assert.equal(nextWake(f.r,999999),Infinity);assert.equal(advance(f.r,999999),false);assert.equal(JSON.stringify(f.s),before);
  for(const type of ['play','cut','draw','pass','challenge','announce','report'])assert.throws(()=>perform(f.r,f.actor(0),type,{},999999),e=>e.code==='GAME_PAUSED');
  for(const p of f.r.players){const a=gameView(f.r,p.id,999999).actions;assert.deepEqual(a.legal,[]);assert.deepEqual(a.cuts,[]);for(const k of ['draw','pass','challenge','announce','report','mustBuy'])assert.equal(a[k],false);}
  resumeMatch(f.r,1000000);assert.equal(f.s.resumeAt,1003000);assert.equal(advance(f.r,1002999),false);assert.equal(f.s.paused,true);
  advance(f.r,1003000);assert.equal(f.s.paused,false);assert.equal(f.s.unlockAt,1004700);assert.equal(f.s.deadline,1019700);assert.equal(f.s.botCutAt,1003200);assert.equal(f.s.reportAt,1003350);assert.equal(f.s.unoWindow.id,1);conserve(f.s);
});
test('pausar a contagem inicial retoma 3–2–1 e entrega o turno completo',()=>{
  const f=fixture({timeout:15});Object.assign(f.s,{unlockAt:8000,countdownAt:8000,deadline:23000});pauseMatch(f.r,6000);assert.equal(f.s.frozen.deadline,15000);assert.equal(f.s.frozen.unlockAt,0);
  resumeMatch(f.r,10000);advance(f.r,12999);assert.equal(f.s.paused,true);advance(f.r,13000);assert.equal(f.s.countdownAt,0);assert.equal(f.s.unlockAt,0);assert.equal(f.s.deadline,28000);
});
test('corte conserva exatamente o restante de 2200 ms depois de pausa e contagem de retomada',()=>{
  const f=fixture(),a=f.card('draw2'),b=f.card('draw2');f.s.players[0].hand.push(a,b);f.seal();perform(f.r,f.actor(0),'play',{cardId:a.id},5000);pauseMatch(f.r,6000);assert.equal(f.s.frozen.unlockAt,1200);
  resumeMatch(f.r,10000);advance(f.r,13000);assert.equal(f.s.unlockAt,14200);assert.throws(()=>perform(f.r,f.actor(0),'cut',{cardId:b.id},14200),e=>e.code==='ILLEGAL_MOVE');perform(f.r,f.actor(0),'cut',{cardId:b.id},14199);assert.equal(f.s.penalty,2);conserve(f.s);
});
test('penalidade e elegibilidade de desafio não se perdem durante pausa',()=>{
  const f=fixture({timeout:15});Object.assign(f.s,{deadline:20000,penalty:12,highest:6,lastPenalty:{id:1,type:'wild6',illegal:true,challengeable:true}});pauseMatch(f.r,5000);resumeMatch(f.r,100000);advance(f.r,103000);
  assert.equal(gameView(f.r,f.actor(0).id,103000).actions.challenge,true);const n=f.s.players[1].hand.length;perform(f.r,f.actor(0),'challenge',{},103001);assert.equal(f.s.players[1].hand.length,n+12);assert.equal(f.s.penalty,0);assert.equal(f.s.current,0);conserve(f.s);
});
test('dois turnos expirados assumem bot somente após cobrar 1 ou a penalidade inteira',()=>{
  for(const penalty of [0,20]){
    const f=fixture({timeout:15}),p=f.actor(0);engine(f.r,5000).startTurn();let count=f.s.players[0].hand.length;
    advance(f.r,20000);assert.equal(p.missedTurns,1);assert.equal(p.idleBot,false);assert.equal(f.s.players[0].hand.length,++count);
    f.s.current=0;f.s.penalty=penalty;f.s.highest=penalty?6:0;engine(f.r,21000).startTurn();advance(f.r,36000);
    assert.equal(p.missedTurns,2);assert.equal(p.idleBot,true);assert.equal(f.s.players[0].hand.length,count+(penalty||1));assert.equal(f.s.current,3);assert.equal(f.s.penalty,0);
    const v=gameView(f.r,p.id,36000);assert.equal(v.actions.reclaim,true);assert.equal(v.players[0].substituted,true);assert.equal(v.players[0].name,p.name);assert.equal(v.actions.draw,false);conserve(f.s);
  }
});
test('ação válida no próprio turno zera sequência de expiração; comando inválido não zera',()=>{
  const f=fixture({timeout:15}),p=f.actor(0);p.missedTurns=1;assert.throws(()=>perform(f.r,p,'play',{cardId:-1},5000));assert.equal(p.missedTurns,1);
  perform(f.r,p,'play',{cardId:f.s.players[0].hand[0].id},5000);assert.equal(p.missedTurns,0);
});
test('tempo esgotado nunca joga automaticamente a carta válida recém-comprada',()=>{
  const f=fixture({timeout:15}),c=f.card();f.s.deck.push(c);f.seal();const discard=f.s.discard.length,hand=f.s.players[0].hand.length;
  engine(f.r,5000).startTurn();advance(f.r,20000);assert.equal(f.s.discard.length,discard);assert.equal(f.s.players[0].hand.length,hand+1);assert.ok(f.s.players[0].hand.some(q=>q.id===c.id));assert.equal(f.s.current,3);conserve(f.s);
});
test('sem limite: bot assume em 120000 ms sem ação válida e aguarda sua ação agendada',()=>{
  const f=fixture(),p=f.actor(0);engine(f.r,5000).startTurn();advance(f.r,5000);assert.equal(f.s.idleAt,125000);assert.equal(nextWake(f.r,5000),125000);
  assert.throws(()=>perform(f.r,p,'play',{cardId:-1},124999));advance(f.r,124999);assert.equal(p.idleBot,false);const cards=JSON.stringify(f.s.players);
  advance(f.r,125000);assert.equal(p.idleBot,true);assert.equal(JSON.stringify(f.s.players),cards);assert.equal(f.s.botAt,125700);
  advance(f.r,125699);assert.equal(JSON.stringify(f.s.players),cards);advance(f.r,125700);assert.notEqual(JSON.stringify(f.s.players),cards);conserve(f.s);
});
test('compra válida sem limite renova inatividade; anúncio fora do turno não renova outro jogador',()=>{
  const f=fixture();engine(f.r,5000).startTurn();f.s.deck.push(f.card());f.seal();perform(f.r,f.actor(0),'draw',{},10000);assert.equal(f.s.idleAt,130000);
  f.s.players[1].hand=f.s.players[1].hand.slice(0,2);f.seal();perform(f.r,f.actor(1),'announce',{},11000);assert.equal(f.s.idleAt,130000);
});
test('pausa congela a inatividade e retorno de conexão durante pausa não libera bot antes da retomada',()=>{
  const f=fixture();engine(f.r,5000).startTurn();advance(f.r,5000);pauseMatch(f.r,124000);assert.equal(f.s.frozen.idleAt,1000);advance(f.r,999999);assert.equal(f.actor(0).idleBot,false);
  const p=f.actor(0);p.connected=false;refreshAutomation(f.r,999999);assert.equal(f.s.botAt,0);assert.equal(f.s.frozen.botAt,700);p.connected=true;refreshAutomation(f.r,999999);assert.equal(f.s.frozen.botAt,0);
  resumeMatch(f.r,1000000);advance(f.r,1003000);assert.equal(f.s.idleAt,1123000);assert.equal(p.idleBot,false);
});
test('sem desconexão, os 1000 ms restantes de inatividade são preservados integralmente na pausa',()=>{
  const f=fixture();engine(f.r,5000).startTurn();advance(f.r,5000);pauseMatch(f.r,124000);resumeMatch(f.r,1000000);advance(f.r,1003000);
  assert.equal(f.s.idleAt,1004000);advance(f.r,1003999);assert.equal(f.actor(0).idleBot,false);advance(f.r,1004000);assert.equal(f.actor(0).idleBot,true);conserve(f.s);
});
test('primeiro comando de retomada apenas reassume, sem jogar, comprar ou mudar prazo em andamento',()=>{
  const f=fixture({timeout:15}),p=f.actor(0);p.idleBot=true;p.missedTurns=2;f.s.deadline=10000;refreshAutomation(f.r,5000);const cards=JSON.stringify(f.s.players),token=f.s.token;
  assert.throws(()=>perform(f.r,p,'draw',{},5000),e=>e.code==='CONTROL_REQUIRED');assert.equal(JSON.stringify(f.s.players),cards);
  reclaim(f.r,p,5001);assert.equal(p.idleBot,false);assert.equal(p.missedTurns,0);assert.equal(f.s.deadline,10000);assert.equal(f.s.botAt,0);assert.equal(f.s.token,token);assert.equal(JSON.stringify(f.s.players),cards);
  assert.throws(()=>reclaim(f.r,p,5002),e=>e.code==='ILLEGAL_MOVE');perform(f.r,p,'draw',{},5002);assert.notEqual(JSON.stringify(f.s.players),cards);conserve(f.s);
});
test('retomada de controle durante pausa conserva todos os prazos congelados e não permite jogar',()=>{
  const f=fixture({timeout:15}),p=f.actor(0);f.s.deadline=20000;p.idleBot=true;refreshAutomation(f.r,5000);pauseMatch(f.r,5500);const remaining=f.s.frozen.deadline;reclaim(f.r,p,100000);
  assert.equal(f.s.paused,true);assert.equal(f.s.frozen.deadline,remaining);assert.equal(f.s.frozen.botAt,0);assert.throws(()=>perform(f.r,p,'draw',{},100000),e=>e.code==='GAME_PAUSED');
});

async function live(t,name){
  const {mf,url}=await startRuntime({name,unsafeInspectDurableObjects:true});t.after(()=>mf.dispose());const users=[];for(let i=0;i<4;i++)users.push(await session(url,name+i,'Participante '+i));
  const code=await create(url,users[0]),clients=[];for(const u of users)clients.push(await connect(url,code,u));for(const c of clients)await c.command('ready',{ready:true});await clients[0].command('start');
  const registry=await mf.getDurableObjectNamespace('REGISTRY'),route=await registry.getByName('codes').lookup(code);
  const storage=await mf.unsafeGetDurableObjectStorage(name,'LobbyRoom',{name:route.roomId});
  const read=async()=>JSON.parse((await storage.exec('SELECT value FROM lobby WHERE id=1'))[0].value);
  const write=async room=>{await storage.exec('UPDATE lobby SET value=? WHERE id=1',JSON.stringify(room));await mf.unsafeEvictDurableObject(name,'LobbyRoom',{name:route.roomId,webSockets:'hibernate'});};
  return {mf,url,users,code,clients,read,write,roomId:route.roomId,name};
}
test('hibernação explícita restaura SQLite, pausa, mãos, controle e deduplicação nas mesmas conexões',async t=>{
  const f=await live(t,'hibernation'),host=f.clients[0];await host.command('pause');const before=await f.read(),id=crypto.randomUUID();await host.command('sync',{},id);const saved=await f.read();saved.notice='Reconstruído do SQLite';await f.write(saved);
  const ack=await host.send('sync',{},0,id);assert.equal(ack.duplicate,true);assert.equal(host.state.notice,'Reconstruído do SQLite');assert.equal(host.state.game.paused,true);assert.deepEqual(host.state.game.remaining,{turn:before.game.frozen.deadline,cut:before.game.frozen.unlockAt});
  for(const c of f.clients){await c.command('sync');assert.equal(c.closed,null);assert.equal(c.state.game.players.filter(p=>p.hand).length,1);}
  const after=await f.read();assert.deepEqual(after.game,before.game);assert.equal(after.hostId,before.hostId);for(const user of f.users)assert.ok(!JSON.stringify(host.messages).includes(user.token));await host.command('close-room');
});
test('somente anfitrião pausa/retoma; novo anfitrião retoma pausa e todos desconectados encerram',async t=>{
  const f=await live(t,'pause-host'),[host,other]=f.clients;await assert.rejects(other.command('pause'),e=>e.code==='NOT_HOST');await host.command('pause');await assert.rejects(other.command('resume'),e=>e.code==='NOT_HOST');
  await assert.rejects(other.command('draw'),e=>e.code==='GAME_PAUSED');host.ws.close();await waitFor(()=>other.state.hostId!==host.selfId);const successor=f.clients.find(c=>c.selfId===other.state.hostId);assert.ok(successor);
  const back=await connect(f.url,f.code,f.users[0]);assert.notEqual(back.state.hostId,host.selfId);assert.equal(back.state.game.paused,true);await successor.command('resume');await waitFor(()=>back.state.game.resumeAt);assert.equal(back.state.game.paused,true);
  for(const c of [...f.clients.slice(1),back])c.ws.close();await waitFor(async()=> (await fetch(f.url+'/v1/rooms/'+f.code)).status===404);
});
test('duas intenções concorrentes da mesma versão só alteram as cartas uma vez; ACK repetido não reaplica',async t=>{
  const f=await live(t,'race-cut'),saved=await f.read(),s=saved.game;const {core}=engine(saved,Date.now());
  Object.assign(s,{deck:[],discard:[core.make('draw2','red')],penalty:2,highest:2,current:3,lastActor:0,cutOpen:true,unlockAt:Date.now()+2200,deadline:0,countdownAt:0,idleAt:0,botAt:0,botCutAt:0,reportAt:0});
  for(const p of s.players)p.hand=[core.make('draw2','red'),core.make('num','blue',3)];s.cardCount=s.discard.length+s.players.flatMap(p=>p.hand).length;await f.write(saved);
  for(const c of f.clients)await c.command('sync');const cutters=f.clients.filter(c=>[1,2].includes(c.state.game.self)),version=cutters[0].state.version,ids=cutters.map(()=>crypto.randomUUID());
  const data=cutters.map(c=>({cardId:c.state.game.players[c.state.game.self].hand[0].id}));const results=await Promise.allSettled(cutters.map((c,i)=>c.send('cut',data[i],version,ids[i])));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='STALE_STATE').length,1);
  const winner=results.findIndex(r=>r.status==='fulfilled'),after=await f.read();assert.equal(after.game.penalty,4);assert.equal(after.game.discard.length,2);conserve(after.game);
  const ack=await cutters[winner].send('cut',data[winner],0,ids[winner]);assert.equal(ack.duplicate,true);assert.deepEqual((await f.read()).game,after.game);await f.clients[0].command('close-room');
});
test('anúncio e denúncia concorrentes obedecem a primeira intenção válida, sem penalidade dupla',async t=>{
  const f=await live(t,'race-uno'),saved=await f.read(),s=saved.game,{core}=engine(saved,Date.now());
  Object.assign(s,{deck:Array.from({length:10},()=>core.make('num','blue',2)),discard:[core.make('num','red',7)],current:3,lastActor:0,unoWindow:{id:0},unlockAt:Date.now()+2200,countdownAt:0,cutOpen:true,deadline:0,idleAt:0,botAt:0,botCutAt:0,reportAt:0});
  for(const p of s.players)p.hand=Array.from({length:p.id===0?1:3},()=>core.make('num','red',7));s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length;await f.write(saved);
  for(const c of f.clients)await c.command('sync');const caller=f.clients.find(c=>c.state.game.self===0),reporter=f.clients.find(c=>c.state.game.self===1),version=caller.state.version;
  const results=await Promise.allSettled([caller.send('announce',{},version),reporter.send('report',{},version)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='STALE_STATE').length,1);
  const after=await f.read();assert.equal(after.game.unoWindow,null);assert.equal(after.game.players[0].hand.length,results[0].status==='fulfilled'?1:3);conserve(after.game);await f.clients[0].command('close-room');
});
test('clientes da Fase 2 precisam atualizar antes de iniciar sem perder identidade nem código',async t=>{
  const {mf,url}=await startRuntime();t.after(()=>mf.dispose());const user=await session(url,'cliente-fase2'),code=await create(url,user),old=await connect(url,code,{...user,clientPhase:2});
  for(let i=0;i<3;i++)await old.command('add-bot');await old.command('ready',{ready:true});assert.equal(old.state.canStart,false);await assert.rejects(old.command('start'),e=>e.code==='UPGRADE_REQUIRED');
  const updated=await connect(url,code,user);assert.equal(updated.selfId,old.selfId);assert.equal(updated.state.code,code);assert.equal(updated.state.canStart,true);await updated.command('close-room');
});
