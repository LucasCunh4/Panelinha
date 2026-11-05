export const VERSION = 1;
export const MAX_BYTES = 4096;
export const HANDSHAKE_MS = 15000;
export const AVATARS = Object.freeze(['frigideira-chef','leiteira-bigode','panela-pressao','panela-dj','wok-monoculo','panela-aventureira','panela-gamer','panela-piloto','panela-escoteira']);
export const DEFAULT_RULES = Object.freeze({duo:false,single:false,goal:10,timeout:0,infinite:false,cut:true,challenge:true,wild6:true,dist:true,rotate:true});
export const MESSAGES = {
  BAD_PAYLOAD:'Dados inválidos.', AUTH_INVALID:'Identificação privada inválida. Entre novamente.',
  ROOM_NOT_FOUND:'Esta sala não existe ou já foi encerrada.', ROOM_CLOSED:'A sala foi encerrada.',
  ROOM_NOT_READY:'O anfitrião ainda está conectando.', ROOM_FULL:'A sala já possui quatro jogadores.',
  BANNED:'Sua identificação foi removida desta sala.', NOT_HOST:'Somente o anfitrião pode fazer isso.',
  TEAM_FULL:'Esta equipe já possui dois jogadores humanos.', RATE_LIMIT:'Muitas solicitações. Aguarde um pouco e tente novamente.',
  STALE_STATE:'A sala mudou. Confira a atualização e tente novamente.', REQUEST_REUSED:'O identificador desta ação já foi usado com outros dados.',
  PHASE_UNAVAILABLE:'Partidas online serão habilitadas na Fase 2.', SESSION_REPLACED:'Esta identificação foi conectada em outra janela.',
  MESSAGE_TOO_LARGE:'A mensagem excede o tamanho permitido.', INTERNAL_ERROR:'Não foi possível concluir agora. Tente novamente.',
  ORIGIN_DENIED:'Esta origem não está autorizada para o multiplayer.', NO_CAPACITY:'Não há códigos disponíveis agora.'
};
export class LobbyError extends Error {
  constructor(code,status=400){super(MESSAGES[code]||MESSAGES.BAD_PAYLOAD);this.code=code;this.status=status;}
}
export function requireValue(condition,code='BAD_PAYLOAD',status=400){if(!condition)throw new LobbyError(code,status);}
export function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
export function exact(value,keys){requireValue(plain(value)&&Object.keys(value).every(key=>keys.includes(key)));return value;}
export function requestId(id){requireValue(typeof id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(id));return id;}
export function profile(value){
  exact(value,['name','avatar']);requireValue(typeof value.name==='string'&&value.name.length<=32&&!/[\u0000-\u001f\u007f]/.test(value.name));
  const name=value.name.replace(/\s+/g,' ').trim();requireValue(name.length>0&&AVATARS.includes(value.avatar));return {name,avatar:value.avatar};
}
export function rules(value){
  exact(value,Object.keys(DEFAULT_RULES));requireValue(Object.keys(value).length===Object.keys(DEFAULT_RULES).length);
  for(const key of ['duo','single','infinite','cut','challenge','wild6','dist','rotate'])requireValue(typeof value[key]==='boolean');
  requireValue((value.duo?[5,10,15]:[10,20,30,50]).includes(value.goal)&&[0,15,30,45,60].includes(value.timeout));
  return Object.fromEntries(Object.keys(DEFAULT_RULES).map(key=>[key,value[key]]));
}
export function envelope(raw){
  requireValue(typeof raw==='string','MESSAGE_TOO_LARGE');requireValue(new TextEncoder().encode(raw).length<=MAX_BYTES,'MESSAGE_TOO_LARGE');
  let value;try{value=JSON.parse(raw);}catch{throw new LobbyError('BAD_PAYLOAD');}
  exact(value,['v','id','type','version','data']);requireValue(value.v===VERSION&&typeof value.type==='string');requestId(value.id);
  requireValue(plain(value.data));if(value.type!=='auth')requireValue(Number.isSafeInteger(value.version)&&value.version>=0);
  return value;
}
export function randomInt(limit){
  const range=0x100000000,maximum=range-range%limit,bytes=new Uint32Array(1);let n;
  do{crypto.getRandomValues(bytes);n=bytes[0];}while(n>=maximum);return n%limit;
}
export function randomCode(){return String(randomInt(1000000)).padStart(6,'0');}
export function privateToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
export function errorMessage(error,id){const code=error instanceof LobbyError?error.code:'INTERNAL_ERROR';return {v:VERSION,type:'error',id:id||null,code,message:MESSAGES[code],recoverable:!['AUTH_INVALID','BANNED','ROOM_CLOSED','ROOM_NOT_FOUND'].includes(code)};}
export function reserveCode(sql,nextCode,roomId,owner,now){
  for(let attempt=0;attempt<128;attempt++){
    const code=nextCode();requireValue(/^\d{6}$/.test(code));
    if(sql.exec('SELECT code FROM codes WHERE code = ?',code).toArray().length)continue;
    sql.exec('INSERT INTO codes(code,room_id,owner,status,expires) VALUES(?,?,?,?,?)',code,roomId,owner,'pending',now+HANDSHAKE_MS);
    return code;
  }
  throw new LobbyError('NO_CAPACITY',503);
}
