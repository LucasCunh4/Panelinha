import {VERSION,MAX_BYTES,LobbyError,requireValue,exact,profile,requestId,hash,errorMessage} from './protocol.mjs';
export {RoomRegistry} from './registry.mjs';
export {LobbyRoom} from './room.mjs';

async function body(request){
  requireValue(request.headers.get('Content-Type')?.startsWith('application/json'));
  const reader=request.body?.getReader();requireValue(reader);const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw new LobbyError('MESSAGE_TOO_LARGE',413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new LobbyError('BAD_PAYLOAD');}
}
function cors(response,origin){
  if(response.status===101)return response;
  const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('Vary','Origin');
  if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');}
  return new Response(response.body,{status:response.status,headers});
}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'https://localhost').split(',').map(s=>s.trim());
    if(origin&&origin!==new URL(request.url).origin&&!allowed.includes(origin))return Response.json({v:VERSION,code:'ORIGIN_DENIED',message:'Origem não autorizada.'},{status:403});
    try{
      if(request.method==='OPTIONS')return cors(new Response(null,{status:204}),origin);
      const url=new URL(request.url),registry=env.REGISTRY.getByName('codes');
      if(url.pathname==='/health'&&request.method==='GET')return cors(Response.json({v:VERSION,phase:1,gameplay:false}),origin);
      const ip=await hash(request.headers.get('CF-Connecting-IP')||'local-development');
      if(url.pathname==='/v1/sessions'&&request.method==='POST'){
        requireValue(await registry.rate('session:'+ip,10,60000),'RATE_LIMIT',429);exact(await body(request),[]);
        return cors(Response.json({v:VERSION,...await registry.session()},{status:201}),origin);
      }
      if(url.pathname==='/v1/rooms'&&request.method==='POST'){
        requireValue(await registry.rate('create:'+ip,6,60000),'RATE_LIMIT',429);
        const identity=await registry.identity(request.headers.get('Authorization')?.replace(/^Bearer /,''));requireValue(identity,'AUTH_INVALID',401);
        const data=exact(await body(request),['id','profile']);requestId(data.id);const creator=profile(data.profile);
        const room=await registry.allocate(identity,data.id);if(room.error)throw new LobbyError(room.error,409);
        if(!room.existing){
          try{await env.ROOMS.getByName(room.roomId).initialize({code:room.code,roomId:room.roomId,owner:identity,creator});}
          catch{await registry.release(room.code,room.roomId);throw new LobbyError('INTERNAL_ERROR',503);}
        }
        return cors(Response.json({v:VERSION,code:room.code},{status:201}),origin);
      }
      const roomPath=/^\/v1\/rooms\/(\d{6})(\/ws)?$/.exec(url.pathname);
      if(roomPath&&request.method==='GET'){
        requireValue(await registry.rate('join:'+ip,24,60000),'RATE_LIMIT',429);
        const route=await registry.lookup(roomPath[1]);requireValue(route,'ROOM_NOT_FOUND',404);
        if(!roomPath[2])return cors(Response.json({v:VERSION,code:roomPath[1],phase:route.status}),origin);
        return await env.ROOMS.getByName(route.roomId).fetch(request);
      }
      throw new LobbyError('BAD_PAYLOAD',404);
    }catch(error){return cors(Response.json(errorMessage(error),{status:error.status||500}),origin);}
  }
};
