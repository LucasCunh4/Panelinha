import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import WebSocketClient from 'ws';
import {createHash} from 'node:crypto';
import {reserveCode,randomCode,DEFAULT_RULES} from '../src/protocol.mjs';
import {balanceTeams,chooseHost} from '../src/lobby-model.mjs';
import {startRuntime,waitFor,session,create,connect} from './runtime.mjs';

async function fixture(t){const runtime=await startRuntime();t.after(()=>runtime.mf.dispose());const host=await session(runtime.url,'host');const code=await create(runtime.url,host);const a=await connect(runtime.url,code,host);return {...runtime,host,code,a};}

test('alocação SQLite: zeros, colisões e unicidade, sem sorteio isolado',()=>{
  const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE codes(code TEXT PRIMARY KEY,room_id TEXT UNIQUE,owner TEXT,status TEXT,expires INTEGER)');
  const sql={exec(q,...values){const rows=db.prepare(q).all(...values);return {toArray:()=>rows};}};
  assert.equal(reserveCode(sql,()=> '000007','one','a',1),'000007');
  const sequence=['000007','000007','000008'];assert.equal(reserveCode(sql,()=>sequence.shift(),'two','b',1),'000008');
  assert.throws(()=>reserveCode(sql,()=> '000007','three','c',1),e=>e.code==='NO_CAPACITY');
  assert.equal(db.prepare('SELECT count(*) n FROM codes').get().n,2);db.close();
  for(let i=0;i<100;i++)assert.match(randomCode(),/^\d{6}$/);
  const players=[{id:'h1',bot:false,team:1},{id:'h2',bot:false,team:1},{id:'b1',bot:true,team:1},{id:'b2',bot:true,team:2}];balanceTeams(players,true);assert.deepEqual(players.map(p=>p.team),[1,1,2,2]);
  assert.equal(chooseHost(players,()=>0),'h1');assert.equal(chooseHost(players,()=>1),'h2');
  const gap=[{id:'new',bot:false,team:null},{id:'a',bot:false,team:1},{id:'b',bot:false,team:1},{id:'c',bot:false,team:2}];balanceTeams(gap,true);assert.deepEqual(gap.map(p=>p.team),[2,1,1,2]);
});

test('criação simultânea no workerd real, idempotência HTTP e códigos exclusivos',async t=>{
  const {mf,url}=await startRuntime();t.after(()=>mf.dispose());
  const users=await Promise.all(Array.from({length:12},(_,i)=>session(url,'user-'+i)));
  const codes=await Promise.all(users.map(u=>create(url,u)));assert.equal(new Set(codes).size,12);assert.ok(codes.every(c=>/^\d{6}$/.test(c)));
  const same=await Promise.all([create(url,users[0],'same-request'),create(url,users[0],'same-request')]);assert.equal(same[0],same[1]);
});

test('quatro clientes, quinto rejeitado, nomes iguais e snapshots sem credenciais',async t=>{
  const f=await fixture(t),clients=[f.a],users=[f.host];
  for(let i=1;i<4;i++){const u=await session(f.url,'u'+i);users.push(u);clients.push(await connect(f.url,f.code,u));}
  await waitFor(()=>clients.every(c=>c.state.players.filter(Boolean).length===4));
  assert.equal(new Set(clients.map(c=>c.selfId)).size,4);assert.ok(clients[0].state.players.every(p=>p.name==='Chef'));
  const fifth=await session(f.url,'fifth');await assert.rejects(connect(f.url,f.code,fifth),e=>e.code==='ROOM_FULL');
  const payload=JSON.stringify(clients.flatMap(c=>c.messages));for(const u of users)assert.ok(!payload.includes(u.token));
  assert.ok(!/identity|connectionId|creatorProfile|token|deck|hand/i.test(JSON.stringify(clients[0].state)));
});

test('bots prontos, humano substitui bot, configurações e resets seletivos de Pronto',async t=>{
  const f=await fixture(t);await f.a.command('add-bot');await f.a.command('add-bot');await f.a.command('add-bot');await f.a.command('ready',{ready:true});
  assert.ok(f.a.state.allReady);assert.equal(f.a.state.canStart,true);
  const u=await session(f.url,'second'),b=await connect(f.url,f.code,u);
  await waitFor(()=>f.a.state.players.some(p=>p?.id===b.selfId));assert.equal(f.a.state.players.find(p=>p.id===f.a.selfId).ready,true);assert.equal(b.state.players.find(p=>p.id===b.selfId).ready,false);
  await b.command('ready',{ready:true});await f.a.command('profile',{name:'Novo nome',avatar:'panela-dj'});assert.equal(f.a.state.players.find(p=>p.id===f.a.selfId).ready,true);
  await f.a.command('rules',{rules:{...DEFAULT_RULES,duo:true,goal:5}});assert.ok(f.a.state.players.filter(p=>!p.bot).every(p=>!p.ready));assert.ok(f.a.state.players.filter(p=>p.bot).every(p=>p.ready));
  await f.a.command('ready',{ready:true});await b.command('ready',{ready:true});
  const oldTeam=b.state.players.find(p=>p.id===b.selfId).team;await b.command('team',{team:oldTeam===1?2:1});
  assert.equal(b.state.players.find(p=>p.id===b.selfId).ready,false);assert.equal(b.state.players.find(p=>p.id===f.a.selfId).ready,true);
  assert.equal(b.state.players.filter(p=>p.team===1).length,2);assert.equal(b.state.players.filter(p=>p.team===2).length,2);
  await f.a.command('rules',{rules:{...f.a.state.rules}});assert.equal(f.a.state.players.find(p=>p.id===f.a.selfId).ready,true);
  const bot=f.a.state.players.find(p=>p.bot);await f.a.command('remove-bot',{playerId:bot.id});assert.equal(f.a.state.players.find(p=>p?.id===f.a.selfId).ready,true);
});

test('autoridade do anfitrião, equipes no máximo dois humanos e início exige quatro prontos',async t=>{
  const f=await fixture(t),b=await connect(f.url,f.code,await session(f.url,'second')),c=await connect(f.url,f.code,await session(f.url,'third'));
  for(const [type,data] of [['rules',{rules:DEFAULT_RULES}],['add-bot',{}],['kick',{playerId:f.a.selfId}],['close-room',{}],['start',{}]])await assert.rejects(b.command(type,data),e=>e.code==='NOT_HOST');
  await f.a.command('rules',{rules:{...DEFAULT_RULES,duo:true,goal:5}});await f.a.command('team',{team:1});await c.command('team',{team:2});await b.command('team',{team:1});await assert.rejects(c.command('team',{team:1}),e=>e.code==='TEAM_FULL');
  await assert.rejects(f.a.command('start'),e=>e.code==='NOT_READY');assert.equal(f.a.state.phase,'lobby');
  await assert.rejects(f.a.command('play',{cardId:1}),e=>e.code==='BAD_PAYLOAD');assert.equal(f.a.state.phase,'lobby');
});

test('token privado, troca de controladora, desconexão libera e host antigo não recupera cargo',async t=>{
  const f=await fixture(t),user=await session(f.url,'second'),b=await connect(f.url,f.code,user);
  await f.a.command('ready',{ready:true});const replacement=await connect(f.url,f.code,f.host);
  await waitFor(()=>f.a.closed===4001);assert.equal(replacement.selfId,f.a.selfId);assert.equal(replacement.state.players.find(p=>p.id===replacement.selfId).ready,true);
  replacement.ws.close();await waitFor(()=>b.state.hostId===b.selfId);assert.equal(b.state.players.filter(Boolean).length,1);
  const returned=await connect(f.url,f.code,f.host);assert.equal(returned.selfId,f.a.selfId);assert.equal(returned.state.hostId,b.selfId);assert.equal(returned.state.players.find(p=>p.id===returned.selfId).ready,false);
  await assert.rejects(connect(f.url,f.code,{...f.host,token:'0'.repeat(64)}),e=>e.code==='AUTH_INVALID');
});

test('expulsão bloqueia a identidade pela vida da sala; nome/código não recuperam vaga',async t=>{
  const f=await fixture(t),u=await session(f.url,'second'),b=await connect(f.url,f.code,u);
  await f.a.command('kick',{playerId:b.selfId});await waitFor(()=>b.closed===4003);
  await assert.rejects(connect(f.url,f.code,u),e=>e.code==='BANNED');
  const other=await connect(f.url,f.code,await session(f.url,'new-identity'));assert.notEqual(other.selfId,b.selfId);
});

test('mesmo token possui uma só controladora inclusive entre salas diferentes',async t=>{
  const f=await fixture(t),b=await connect(f.url,f.code,await session(f.url,'second'));
  const otherCode=await create(f.url,f.host),other=await connect(f.url,otherCode,f.host);
  await waitFor(()=>f.a.closed===4001);await waitFor(()=>b.state.hostId===b.selfId);assert.equal(b.state.players.filter(Boolean).length,1);
  const returned=await connect(f.url,f.code,f.host);await waitFor(()=>other.closed===4001);assert.equal(returned.selfId,f.a.selfId);assert.equal(returned.state.hostId,b.selfId);
  await waitFor(async()=> (await fetch(f.url+'/v1/rooms/'+otherCode)).status===404);
});

test('saída/encerramento invalidam código e nenhum bot mantém sala sozinho',async t=>{
  const f=await fixture(t);await f.a.command('add-bot');await f.a.command('leave');
  await waitFor(async()=> (await fetch(f.url+'/v1/rooms/'+f.code)).status===404);
  const code=await create(f.url,f.host),a=await connect(f.url,code,f.host),b=await connect(f.url,code,await session(f.url,'second'));
  await a.command('close-room');await waitFor(()=>b.messages.some(m=>m.type==='closed'));await waitFor(async()=> (await fetch(f.url+'/v1/rooms/'+code)).status===404);
});

test('ordem/versão/idempotência e limite de mensagens recuperável',async t=>{
  const f=await fixture(t),initial=f.a.state.version,id='only-once';await f.a.send('add-bot',{},initial,id);const version=f.a.state.version;
  const duplicate=await f.a.send('add-bot',{},initial,id);assert.ok(duplicate.duplicate);assert.equal(f.a.state.players.filter(p=>p?.bot).length,1);assert.equal(f.a.state.version,version);
  await assert.rejects(f.a.send('ready',{ready:true},initial),e=>e.code==='STALE_STATE');
  await assert.rejects(f.a.send('ready',{ready:true},version,id),e=>e.code==='REQUEST_REUSED');
  await f.a.command('ready',{ready:true});assert.ok(f.a.state.players.find(p=>p?.id===f.a.selfId).ready);
  for(let i=0;i<35;i++)f.a.ws.send('{bad json');await waitFor(()=>f.a.messages.some(m=>m.code==='RATE_LIMIT'));
  assert.equal(f.a.state.players.filter(p=>p?.bot).length,1);
});

test('origens, dados inválidos, segredo ausente, tamanho e limite HTTP',async t=>{
  const {mf,url}=await startRuntime();t.after(()=>mf.dispose());
  assert.equal((await fetch(url+'/v1/sessions',{method:'POST',headers:{Origin:'https://outro.example','Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(url+'/v1/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  assert.equal((await fetch(url+'/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'large'},body:JSON.stringify({data:'x'.repeat(5000)})})).status,413);
  for(let i=0;i<10;i++)assert.equal((await fetch(url+'/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'limited'},body:'{}'})).status,201);
  assert.equal((await fetch(url+'/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'limited'},body:'{}'})).status,429);
});

test('campos e versão inválidos não alteram sala; limite WebSocket usa bytes UTF-8; silêncio não desconecta',async t=>{
  const f=await fixture(t),b=await connect(f.url,f.code,await session(f.url,'second'));
  await f.a.command('ready',{ready:true});const version=f.a.state.version;
  await assert.rejects(f.a.command('profile',{name:'',avatar:'panela-dj'}),e=>e.code==='BAD_PAYLOAD');
  await assert.rejects(f.a.command('profile',{name:'Chef',avatar:'https://fora.example/imagem'}),e=>e.code==='BAD_PAYLOAD');
  await assert.rejects(f.a.command('rules',{rules:{...DEFAULT_RULES,goal:999}}),e=>e.code==='BAD_PAYLOAD');
  await assert.rejects(f.a.command('ready',{ready:true,hostId:'forjado'}),e=>e.code==='BAD_PAYLOAD');assert.equal(f.a.state.version,version);
  await new Promise(r=>setTimeout(r,500));assert.equal(f.a.closed,null);assert.ok(f.a.state.players.find(p=>p.id===f.a.selfId).ready);
  f.a.ws.send('é'.repeat(3000));await waitFor(()=>f.a.closed===1009);await waitFor(()=>b.state.hostId===b.selfId);
});

test('SQLite guarda estado e tokens só como hash; restart sem conexões não cria sala fantasma',async t=>{
  const persist=await mkdtemp(path.join(tmpdir(),'panelinha-lobby-'));let runtime=await startRuntime({durableObjectsPersist:persist});t.after(()=>runtime.mf.dispose());
  const user=await session(runtime.url),code=await create(runtime.url,user),a=await connect(runtime.url,code,user);await a.command('ready',{ready:true});
  const entries=await readdir(persist,{recursive:true});let found=false,hashed=false;
  for(const name of entries.filter(n=>n.endsWith('.sqlite'))){
    const db=new DatabaseSync(path.join(persist,name),{readOnly:true});const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    if(tables.some(t=>t.name==='lobby')){const row=db.prepare('SELECT value FROM lobby WHERE id=1').get();if(row){const saved=JSON.parse(row.value);assert.equal(saved.code,code);assert.ok(saved.players.find(p=>p&&!p.bot).ready);assert.ok(!row.value.includes(user.token));found=true;}}
    if(tables.some(t=>t.name==='identities')){const rows=db.prepare('SELECT token_hash FROM identities').all();assert.ok(rows.every(row=>row.token_hash!==user.token));hashed=rows.some(row=>row.token_hash===createHash('sha256').update(user.token).digest('hex'));}db.close();
  }
  assert.ok(found&&hashed);await runtime.mf.dispose();runtime=await startRuntime({durableObjectsPersist:persist});
  const r=await fetch(runtime.url+'/v1/rooms/'+code);if(r.status===200){await assert.rejects(connect(runtime.url,code,user));await waitFor(async()=> (await fetch(runtime.url+'/v1/rooms/'+code)).status===404);}else assert.equal(r.status,404);
});

test('reserva abandonada e socket sem autenticação expiram; humano autenticado ocioso continua conectado',async t=>{
  const f=await fixture(t);await f.a.command('ready',{ready:true});const abandoned=await create(f.url,f.host);
  // workerd local envia Close no prazo, mas pode reter o TCP depois do handshake.
  // O cliente limita essa espera; continua exigindo o código real 4008 do servidor.
  const ws=new WebSocketClient(f.url.replace(/^http/,'ws')+'/v1/rooms/'+f.code+'/ws',{closeTimeout:1000});let closed=null;ws.on('close',code=>closed=code);
  await waitFor(()=>closed===4008,20000);await waitFor(async()=> (await fetch(f.url+'/v1/rooms/'+abandoned)).status===404);
  assert.equal(f.a.closed,null);assert.ok(f.a.state.players.find(p=>p.id===f.a.selfId).ready);assert.equal(f.a.state.hostId,f.a.selfId);
});
