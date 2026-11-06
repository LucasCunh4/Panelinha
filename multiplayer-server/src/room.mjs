import {DurableObject} from 'cloudflare:workers';
import {VERSION,HANDSHAKE_MS,DEFAULT_RULES,LobbyError,requireValue,exact,envelope,profile,rules,hash,randomInt,errorMessage} from './protocol.mjs';

import {balanceTeams,chooseHost} from './lobby-model.mjs';
import {createMatch,nextRound,settleReady,perform,pauseMatch,resumeMatch,reclaim,refreshAutomation,advance,nextWake,gameView} from './game.mjs';

export class LobbyRoom extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);this.sql=ctx.storage.sql;this.room=null;
    ctx.blockConcurrencyWhile(async()=>{
      this.sql.exec('CREATE TABLE IF NOT EXISTS lobby(id INTEGER PRIMARY KEY CHECK(id=1),value TEXT NOT NULL)');
      const row=this.sql.exec('SELECT value FROM lobby WHERE id=1').toArray()[0];this.room=row?JSON.parse(row.value):null;
      if(!['lobby','match'].includes(this.room?.status))return;
      const live=new Set(ctx.getWebSockets().filter(ws=>ws.readyState===1).map(ws=>ws.deserializeAttachment()?.connectionId));
      let changed=false;
      this.room.players=this.room.players.map(p=>{if(p&&!p.bot&&!live.has(p.connectionId)&&p.connected!==false){changed=true;if(this.room.status==='match')return {...p,connected:false,connectionId:null,ready:this.room.game.phase!=='playing'};return null;}return p;});
      if(changed){
        if(!this.room.players.some(p=>p?.id===this.room.hostId&&p.connected!==false))this.room.hostId=this.successor(this.room.players);
        if(this.room.status==='lobby')balanceTeams(this.room.players,this.room.rules.duo);else refreshAutomation(this.room);
        this.room.version++;this.persist();
        if(!this.room.hostId)await this.closeRoom();
        else await this.schedule();
      }
    });
  }
  registry(){return this.env.REGISTRY.getByName('codes');}
  successor(players){const live=new Set(this.ctx.getWebSockets().filter(ws=>ws.readyState===1).map(ws=>ws.deserializeAttachment()?.connectionId));return chooseHost(players.filter(p=>p&&!p.bot&&live.has(p.connectionId)));}
  persist(){this.sql.exec('INSERT INTO lobby(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',JSON.stringify(this.room));}
  async initialize({code,roomId,owner,creator}){
    if(this.room)return {ok:this.room.status!=='closed'};
    this.room={code,roomId,creator:owner,creatorProfile:creator,status:'pending',expires:Date.now()+HANDSHAKE_MS,version:0,hostId:null,players:[null,null,null,null],rules:{...DEFAULT_RULES},bans:[],requests:{},notice:''};
    this.persist();await this.schedule();return {ok:true};
  }
  snapshot(viewer=null){
    const r=this.room,players=r.players.map(p=>p?{id:p.id,name:p.name,avatar:p.avatar,bot:p.bot,team:p.team,ready:p.ready,connected:p.connected!==false}:null),allReady=players.every(p=>p&&p.ready);
    const upgradeRequired=r.players.some(p=>p&&!p.bot&&(p.clientPhase||1)<3);
    return {v:VERSION,code:r.code,version:r.version,serverNow:Date.now(),phase:r.status,hostId:r.hostId,rules:{...r.rules},players,notice:upgradeRequired?'Atualize a página em todos os aparelhos para iniciar partidas online.':r.notice,allReady,canStart:r.status==='lobby'&&allReady&&!upgradeRequired,capabilities:{phase:3},upgradeRequired,...(viewer&&r.game?{game:gameView(r,viewer.id)}:{})};
  }
  send(ws,value){try{if(ws.readyState===1)ws.send(JSON.stringify(value));}catch{}}
  broadcast(event=null){for(const ws of this.ctx.getWebSockets()){const actor=this.controller(ws);if(actor)this.send(ws,{v:VERSION,type:'state',state:this.snapshot(actor),event});}}
  tick(now=Date.now()){if(!this.room?.game)return false;const next=structuredClone(this.room);if(advance(next,now)){this.room=next;this.room.version++;this.persist();this.broadcast();return true;}return false;}
  controller(ws){const a=ws.deserializeAttachment();return a?.playerId&&this.room?.players.find(p=>p?.id===a.playerId&&p.connectionId===a.connectionId)||null;}
  async fetch(request){
    if(!this.room||this.room.status==='closed')return Response.json({code:'ROOM_CLOSED'},{status:410});
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket necessário',{status:426});
    if(this.ctx.getWebSockets().filter(ws=>ws.readyState===1).length>=8)return new Response('Limite de conexões',{status:429});
    const [client,server]=Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({connectionId:crypto.randomUUID(),createdAt:Date.now(),window:Date.now(),count:0,playerId:null});
    await this.schedule();return new Response(null,{status:101,webSocket:client});
  }
  async schedule(){
    let next=this.room?.status==='pending'?this.room.expires:nextWake(this.room);
    for(const ws of this.ctx.getWebSockets()){
      const a=ws.deserializeAttachment();if(ws.readyState===1&&!a?.playerId)next=Math.min(next,(a?.createdAt||Date.now())+HANDSHAKE_MS);
    }
    if(Number.isFinite(next))await this.ctx.storage.setAlarm(Math.max(Date.now()+1,next));else await this.ctx.storage.deleteAlarm();
  }
  async auth(ws,message){
    exact(message.data,['token','profile','clientPhase']);const clientPhase=message.data.clientPhase??1;requireValue([1,2,3].includes(clientPhase));const identity=await this.registry().identity(message.data.token);
    requireValue(identity,'AUTH_INVALID',401);const info=profile(message.data.profile),r=this.room;
    requireValue(r&&r.status!=='closed','ROOM_CLOSED',410);requireValue(!r.bans.includes(identity),'BANNED',403);
    if(r.status==='match')requireValue(clientPhase>=3,'UPGRADE_REQUIRED',409);
    if(r.status==='pending'){
      requireValue(r.creator===identity,'ROOM_NOT_READY',409);
      requireValue(await this.registry().activate(r.code,r.roomId),'ROOM_CLOSED',410);r.status='lobby';r.expires=null;
    }
    const publicId=(await hash(r.roomId+':'+identity)).slice(0,32),a=ws.deserializeAttachment();
    if(r.status==='match')requireValue(r.players.some(p=>p?.identity===identity),'MATCH_STARTED',409);
    requireValue(r.players.some(p=>p?.identity===identity)||r.players.some(p=>!p||p.bot),'ROOM_FULL',409);
    await this.registry().claim(identity,r.roomId,a.connectionId);
    requireValue(await this.registry().current(identity,r.roomId,a.connectionId),'SESSION_REPLACED',409);
    let p=r.players.find(p=>p?.identity===identity);
    if(!p){
      let index=r.players.findIndex(p=>p===null);if(index<0)index=r.players.findIndex(p=>p.bot);requireValue(index>=0,'ROOM_FULL',409);
      const priorTeam=r.players[index]?.team||null;
      p={id:publicId,identity,...info,team:priorTeam,bot:false,ready:false,connectionId:null};r.players[index]=p;
      balanceTeams(r.players,r.rules.duo);r.notice=info.name+' entrou na sala.';
    }else{if(r.status==='lobby')Object.assign(p,info);if(p.connected===false)p.ready=false;}
    p.connected=true;p.clientPhase=clientPhase;if(r.status==='match'){p.idleBot=false;p.missedTurns=0;}
    a.playerId=p.id;p.connectionId=a.connectionId;ws.serializeAttachment(a);
    if(!r.hostId)r.hostId=p.id;
    r.version++;this.persist();
    // O fechamento da conexão antiga não libera a vaga da nova controladora.
    for(const other of this.ctx.getWebSockets())if(other!==ws&&other.deserializeAttachment()?.playerId===p.id){this.send(other,errorMessage(new LobbyError('SESSION_REPLACED')));other.close(4001,'Identificação conectada em outra janela');}
    refreshAutomation(r);this.persist();this.send(ws,{v:VERSION,type:'joined',id:message.id,selfId:p.id,state:this.snapshot(p)});this.broadcast();await this.schedule();
  }
  async webSocketMessage(ws,raw){
    const receivedAt=Date.now(); // Tempo de recebimento no servidor; nunca fornecido pelo cliente.
    return this.ctx.blockConcurrencyWhile(async()=>{
      let message;
      try{
        const a=ws.deserializeAttachment(),now=Date.now();requireValue(a,'AUTH_INVALID',401);
        if(now-a.window>=10000){a.window=now;a.count=0;}a.count++;ws.serializeAttachment(a);
        requireValue(a.count<=30,'RATE_LIMIT',429);message=envelope(raw);
        if(!a.playerId){requireValue(message.type==='auth','AUTH_INVALID',401);await this.auth(ws,message);return;}
        const actor=this.controller(ws);requireValue(actor,'AUTH_INVALID',401);requireValue(['lobby','match'].includes(this.room.status),'ROOM_CLOSED',410);
        requireValue(await this.registry().current(actor.identity,this.room.roomId,a.connectionId),'SESSION_REPLACED',409);
        requireValue(message.type!=='auth');this.tick(receivedAt);await this.action(ws,actor,message,receivedAt);
      }catch(error){
        this.send(ws,{...errorMessage(error,message?.id),...(error.code==='STALE_STATE'?{state:this.snapshot(this.controller(ws))}:{})});
        if(['AUTH_INVALID','BANNED','ROOM_CLOSED','ROOM_FULL','ROOM_NOT_READY','MESSAGE_TOO_LARGE','SESSION_REPLACED'].includes(error.code)||['MATCH_STARTED','UPGRADE_REQUIRED'].includes(error.code)&&!this.controller(ws))ws.close(error.code==='MESSAGE_TOO_LARGE'?1009:error.code==='BANNED'?4003:error.code==='SESSION_REPLACED'?4001:4004,error.code);
        // Uma autenticação concorrente pode perder a controladora após ativar a reserva.
        if(this.room?.status==='lobby'&&!this.room.players.some(p=>p&&!p.bot))await this.closeRoom();
      }
    });
  }
  async action(ws,actor,message,receivedAt=Date.now()){
    const current=this.room,key=actor.identity+':'+message.id,fingerprint=JSON.stringify([message.type,message.data]);
    const previous=current.requests[key];
    if(previous){requireValue(previous.fingerprint===fingerprint,'REQUEST_REUSED');this.send(ws,{v:VERSION,type:'ack',id:message.id,duplicate:true,version:previous.version,state:this.snapshot(actor)});return;}
    requireValue(message.type==='sync'||message.version===current.version,'STALE_STATE',409);
    const data=message.data,next=structuredClone(current),self=next.players.find(p=>p?.id===actor.id);
    let closeTarget=null,leaving=false,closing=false;
    if(['rules','add-bot','remove-bot','kick','close-room','start','next-round','pause','resume'].includes(message.type))requireValue(actor.id===current.hostId,'NOT_HOST',403);
    if(current.status==='match')requireValue(['ready','leave','close-room','next-round','play','cut','draw','pass','challenge','announce','report','pause','resume','reclaim','sync'].includes(message.type),'MATCH_STARTED',409);
    if(current.status==='match'&&!['leave','close-room','sync'].includes(message.type))requireValue((actor.clientPhase||1)>=3,'UPGRADE_REQUIRED',409);
    switch(message.type){
      case 'ready':exact(data,['ready']);requireValue(typeof data.ready==='boolean');requireValue(!next.game||next.game.phase!=='playing','ILLEGAL_MOVE',409);self.ready=data.ready;break;
      case 'profile':Object.assign(self,profile(data));break;
      case 'team':{
        exact(data,['team']);requireValue(next.rules.duo&&[1,2].includes(data.team));
        requireValue(next.players.filter(p=>p&&!p.bot&&p.id!==self.id&&p.team===data.team).length<2,'TEAM_FULL',409);
        if(self.team!==data.team){self.team=data.team;self.ready=false;}balanceTeams(next.players,true);break;
      }
      case 'rules':{
        exact(data,['rules']);const selected=rules(data.rules);
        if(JSON.stringify(selected)!==JSON.stringify(next.rules)){
          next.rules=selected;next.players.filter(p=>p&&!p.bot).forEach(p=>p.ready=false);
          balanceTeams(next.players,next.rules.duo);next.notice='O anfitrião alterou as regras. Confirme Pronto novamente.';
        }break;
      }
      case 'add-bot':{
        exact(data,[]);const index=next.players.findIndex(p=>p===null);requireValue(index>=0,'ROOM_FULL',409);
        next.players[index]={id:'bot-'+crypto.randomUUID(),bot:true,name:'Bot '+(index+1),avatar:'panela-gamer',team:null,ready:true};balanceTeams(next.players,next.rules.duo);break;
      }
      case 'remove-bot':case 'kick':{
        exact(data,['playerId']);requireValue(typeof data.playerId==='string');const index=next.players.findIndex(p=>p?.id===data.playerId);requireValue(index>=0);
        const target=next.players[index];requireValue(message.type==='remove-bot'?target.bot:!target.bot&&target.id!==actor.id);
        if(!target.bot){next.bans.push(target.identity);closeTarget=target;next.notice=target.name+' foi removido pelo anfitrião.';}
        next.players[index]=null;balanceTeams(next.players,next.rules.duo);break;
      }
      case 'leave':{
        exact(data,[]);leaving=true;
        if(next.status==='match'){self.connected=false;self.connectionId=null;self.ready=next.game.phase!=='playing';refreshAutomation(next);}else next.players=next.players.map(p=>p?.id===actor.id?null:p);
        if(next.hostId===actor.id)next.hostId=this.successor(next.players);if(next.status==='lobby')balanceTeams(next.players,next.rules.duo);next.notice=actor.name+' saiu da sala.';break;
      }
      case 'close-room':exact(data,[]);closing=true;break;
      case 'sync':exact(data,[]);break;
      case 'pause':exact(data,[]);pauseMatch(next,receivedAt);break;
      case 'resume':exact(data,[]);resumeMatch(next,receivedAt);break;
      case 'reclaim':exact(data,[]);reclaim(next,self,receivedAt);break;
      case 'start':exact(data,[]);requireValue(next.status==='lobby');requireValue(next.players.every(p=>!p||p.bot||(p.clientPhase||1)>=3),'UPGRADE_REQUIRED',409);createMatch(next,receivedAt);break;
      case 'next-round':exact(data,[]);requireValue(next.status==='match');nextRound(next,receivedAt);break;
      case 'play':case 'cut':case 'draw':case 'pass':case 'challenge':case 'announce':case 'report':requireValue(next.status==='match');perform(next,actor,message.type,data,receivedAt);break;
      default:throw new LobbyError('BAD_PAYLOAD');
    }
    settleReady(next);
    const changed=JSON.stringify([next.players,next.rules,next.hostId,next.status,next.game])!==JSON.stringify([current.players,current.rules,current.hostId,current.status,current.game]);
    if(changed)next.version++;
    next.requests[key]={fingerprint,version:next.version};const keys=Object.keys(next.requests);for(const stale of keys.slice(0,-128))delete next.requests[stale];
    this.room=next;this.persist();
    const event=message.type==='ready'&&self.ready&&!actor.ready?{id:actor.id+':'+message.id,type:'player-ready',playerId:actor.id}:null;
    this.send(ws,{v:VERSION,type:'ack',id:message.id,state:this.snapshot(self),event});if(changed)this.broadcast(event);await this.schedule();
    if(closeTarget){await this.registry().releaseController(closeTarget.identity,next.roomId,closeTarget.connectionId);for(const socket of this.ctx.getWebSockets())if(socket.deserializeAttachment()?.playerId===closeTarget.id){this.send(socket,errorMessage(new LobbyError('BANNED')));socket.close(4003,'Removido pelo anfitrião');}}
    if(leaving){await this.registry().releaseController(actor.identity,next.roomId,actor.connectionId);ws.close(4000,'Saída voluntária');}
    if(closing||!next.players.some(p=>p&&!p.bot&&p.connected!==false))await this.closeRoom();
  }
  async disconnected(ws){
    const actor=this.controller(ws);if(!actor||!['lobby','match'].includes(this.room?.status))return;
    const connectionId=actor.connectionId;
    if(this.room.status==='match'){actor.connected=false;actor.connectionId=null;actor.ready=this.room.game.phase!=='playing';refreshAutomation(this.room);}else this.room.players=this.room.players.map(p=>p?.id===actor.id?null:p);
    if(this.room.hostId===actor.id)this.room.hostId=this.successor(this.room.players);
    settleReady(this.room);
    if(this.room.status==='lobby')balanceTeams(this.room.players,this.room.rules.duo);this.room.version++;this.room.notice=actor.name+' desconectou.';this.persist();
    await this.registry().releaseController(actor.identity,this.room.roomId,connectionId);
    if(!this.room.hostId)await this.closeRoom();else this.broadcast();
  }
  webSocketClose(ws,code){return this.ctx.blockConcurrencyWhile(async()=>{await this.disconnected(ws);try{ws.close(code===1006?1000:code,'Conexão encerrada');}catch{}await this.schedule();});}
  webSocketError(ws){return this.ctx.blockConcurrencyWhile(async()=>{await this.disconnected(ws);try{ws.close(1011,'Conexão interrompida');}catch{}await this.schedule();});}
  revoke(identity,connectionId){return this.ctx.blockConcurrencyWhile(async()=>{
    if(!this.room||!['lobby','match'].includes(this.room.status))return;
    const ws=this.ctx.getWebSockets().find(ws=>{const a=ws.deserializeAttachment();return a?.connectionId===connectionId&&this.room.players.some(p=>p?.identity===identity&&p.connectionId===connectionId);});
    if(ws){this.send(ws,errorMessage(new LobbyError('SESSION_REPLACED')));try{ws.close(4001,'Identificação conectada em outra sala');}catch{}await this.disconnected(ws);}
  });}
  async closeRoom(){
    if(!this.room)return;const r=this.room;r.status='closed';r.version++;r.hostId=null;r.players=[null,null,null,null];r.bans=[];r.requests={};delete r.creatorProfile;delete r.creator;delete r.game;this.persist();
    for(const ws of this.ctx.getWebSockets()){this.send(ws,{v:VERSION,type:'closed',code:'ROOM_CLOSED',message:'A sala foi encerrada.'});try{ws.close(4004,'Sala encerrada');}catch{}}
    try{await this.registry().release(r.code,r.roomId);await this.ctx.storage.deleteAlarm();}catch{await this.ctx.storage.setAlarm(Date.now()+1000);}
  }
  alarm(){return this.ctx.blockConcurrencyWhile(async()=>{
    if(this.room?.status==='closed'){await this.closeRoom();return;}
    if(this.room?.status==='pending'&&this.room.expires<=Date.now()){await this.closeRoom();return;}
    for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment();if(!a?.playerId&&Date.now()>=a.createdAt+HANDSHAKE_MS)try{ws.close(4008,'Identificação não recebida');}catch{}}
    this.tick();
    await this.schedule();
  });}
}
