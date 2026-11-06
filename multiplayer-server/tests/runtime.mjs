import {build} from 'esbuild';
import {Miniflare,Log,LogLevel} from 'miniflare';
import {fileURLToPath} from 'node:url';
let bundle;
export async function startRuntime(options={}){
  if(!bundle){const result=await build({entryPoints:[fileURLToPath(new URL('../src/worker.mjs',import.meta.url))],bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers'],write:false});bundle=result.outputFiles[0].text;}
  const mf=new Miniflare({modules:true,script:bundle,compatibilityDate:'2026-07-01',
    durableObjects:{REGISTRY:{className:'RoomRegistry',useSQLite:true},ROOMS:{className:'LobbyRoom',useSQLite:true}},
    bindings:{ALLOWED_ORIGINS:'http://127.0.0.1:8000,http://localhost:8000,https://localhost'},
    log:new Log(LogLevel.ERROR),port:0,...options});
  const url=String(await mf.ready).replace(/\/$/,'');return {mf,url};
}
export async function waitFor(check,timeout=5000){const until=Date.now()+timeout;while(Date.now()<until){const value=await check();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw Error('Condição de teste não ocorreu');}
export function cardProfile(name='Chef'){return {name,avatar:'frigideira-chef'};}
export async function session(base,ip='local',name='Chef'){
  const response=await fetch(base+'/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':ip},body:'{}'});const body=await response.json();
  if(!response.ok)throw Object.assign(Error(body.message),{code:body.code});return {token:body.token,profile:cardProfile(name),ip};
}
export async function create(base,user,id=crypto.randomUUID()){
  const r=await fetch(base+'/v1/rooms',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':user.ip,Authorization:'Bearer '+user.token},body:JSON.stringify({id,profile:user.profile})});const value=await r.json();if(!r.ok)throw Object.assign(Error(value.message),{code:value.code});return value.code;
}
export async function connect(base,code,user){
  const ws=new WebSocket(base.replace(/^http/,'ws')+'/v1/rooms/'+code+'/ws');const messages=[],pending=new Map();
  let state=null,selfId=null,closed=null;
  ws.addEventListener('message',event=>{
    const m=JSON.parse(event.data);messages.push(m);if(m.state)state=m.state;if(m.selfId)selfId=m.selfId;
    const job=pending.get(m.id);if(job&&(m.type==='ack'||m.type==='joined'||m.type==='error')){pending.delete(m.id);m.type==='error'?job.reject(Object.assign(Error(m.message),{code:m.code})):job.resolve(m);}
  });ws.addEventListener('close',e=>closed=e.code);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  function send(type,data={},version=state?.version,id=crypto.randomUUID()){
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('Resposta não recebida'));},5000);pending.set(id,{resolve:m=>{clearTimeout(timer);resolve(m);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({v:1,id,type,...(type==='auth'?{}:{version}),data}));});
  }
  await send('auth',{token:user.token,profile:user.profile,clientPhase:user.clientPhase??3});
  return {ws,messages,send,get state(){return state;},get selfId(){return selfId;},get closed(){return closed;},async command(type,data={},id){await new Promise(r=>setTimeout(r,15));try{return await send(type,data,state.version,id);}catch(e){if(e.code!=='STALE_STATE')throw e;return send(type,data,state.version);}}};
}
