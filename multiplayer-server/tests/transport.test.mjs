import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {waitFor} from './runtime.mjs';
const source=readFileSync(new URL('../../IMPORTACAO_PANELAS/multiplayer-connection.js',import.meta.url),'utf8');
function transport(){
  const stored=new Map(),sockets=[],wall={now:()=>Date.now()};let lookups=0,release=null,blocked=false;
  const state=()=>({code:'123456',version:1,serverNow:Date.now(),phase:'lobby',players:[]});
  class Socket{
    static OPEN=1;
    constructor(){this.readyState=0;this.listeners={};sockets.push(this);queueMicrotask(()=>{this.readyState=1;this.emit('open',{});});}
    addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
    emit(type,event){for(const fn of this.listeners[type]||[])fn(event);}
    send(raw){const m=JSON.parse(raw);queueMicrotask(()=>this.emit('message',{data:JSON.stringify({v:1,type:m.type==='auth'?'joined':'ack',id:m.id,selfId:'self',state:state()})}));}
    close(code=1000){this.readyState=3;queueMicrotask(()=>this.emit('close',{code}));}
  }
  const window={PanelinhaServerConfig:{serverUrl:'http://127.0.0.1:8788',inviteBaseUrl:'http://127.0.0.1:8000'}};
  runInNewContext(source,{window,PanelinhaProfile:{current:{name:'Teste',avatar:'frigideira-chef'}},URL,WebSocket:Socket,crypto,performance,Date:{now:()=>wall.now()},AbortController,setTimeout,clearTimeout,addEventListener(){},document:{addEventListener(){}},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},fetch:async url=>{
    if(url.endsWith('/v1/rooms/123456')){lookups++;if(blocked)await new Promise(resolve=>release=resolve);}
    return {ok:true,json:async()=>url.endsWith('/v1/sessions')?{token:'1'.repeat(64)}:{code:'123456'}};
  }});
  return {connection:window.PanelinhaLobbyConnection,sockets,wall,get lookups(){return lookups;},block(){blocked=true;},release(){blocked=false;release?.();}};
}
test('sair enquanto uma reconexão HTTP está pendente não ressuscita a sala nem as tentativas',async()=>{
  const t=transport();await t.connection.join('123456');t.block();t.sockets[0].close(1012);await waitFor(()=>t.lookups===2);
  assert.equal(t.connection.current.status,'connecting');await t.connection.leave();assert.equal(t.connection.current.status,'closed');t.release();await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(t.connection.current.status,'closed');assert.equal(t.connection.current.state,null);assert.equal(t.sockets.length,1);
});
test('relógio monotônico mantém tempo restante após mudança de uma hora no relógio local',async()=>{
  const t=transport();await t.connection.join('123456');const serverDeadline=Date.now()+10000;
  const first=t.connection.localDeadline(serverDeadline)-t.wall.now();t.wall.now=()=>Date.now()+3600000;
  const second=t.connection.localDeadline(serverDeadline)-t.wall.now();assert.ok(Math.abs(first-second)<10);assert.ok(Math.abs(second-10000)<50);t.connection.stop();
});
