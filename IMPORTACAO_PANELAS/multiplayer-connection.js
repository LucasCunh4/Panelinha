/* Transporte e sincronização. Nenhuma regra de cartas é resolvida neste módulo. */
(() => {
  'use strict';
  const config=window.PanelinhaServerConfig,identityKey='panelinha.multiplayer.identities.v1',roomKey='panelinha.multiplayer.room.v1';
  let base='',configError='';
  try{
    if(config.serverUrl){
      const url=new URL(config.serverUrl),local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname);
      const privateLan=/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
      if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/'&&url.pathname!=='')throw Error();
      if(url.protocol!=='https:'&&!(local||config.allowInsecureDevelopment&&privateLan&&location.protocol==='http:'))throw Error();
      base=url.origin;
    }
  }catch{configError='O endereço do servidor multiplayer precisa ser corrigido.';}
  let socket=null,state=null,selfId=null,status='idle',epoch=0,entryEpoch=0,stopping=false,reconnectTimer=null,reconnectAttempts=0,code=null;
  const pending=new Map(),listeners=new Set(),seenEvents=new Set();
  let clockSample=null,retryConnection=null,recoverConnection=null,lastWake=-Infinity;
  function sampleClock(value,sent){
    const server=value?.serverNow??value?.game?.serverNow,received=performance.now();if(!Number.isFinite(server)||!Number.isFinite(sent))return;
    const rtt=received-sent;if(rtt<0||rtt>12000)return;
    if(!clockSample||rtt<=clockSample.rtt||received-clockSample.at>60000)clockSample={offset:server+rtt/2-received,rtt,at:received};
  }
  function localDeadline(server,reference=Date.now()){return server?Date.now()+server-(clockSample?performance.now()+clockSample.offset:reference):0;}
  const uid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  const error=(message,code='NETWORK_ERROR')=>Object.assign(Error(message),{code});
  function notify(message='',event=null){const view={state,selfId,status,code,message,event};listeners.forEach(fn=>fn(view));}
  function apply(value,event){if(value&&(!state||value.code!==state.code||value.version>=state.version))state=value;let fresh=null;if(event?.id&&!seenEvents.has(event.id)){seenEvents.add(event.id);fresh=event;if(seenEvents.size>128)seenEvents.delete(seenEvents.values().next().value);}notify('',fresh);}
  function rejectPending(reason){pending.forEach(job=>{clearTimeout(job.timer);job.reject(reason);});pending.clear();}
  function readIdentities(){try{const value=JSON.parse(localStorage.getItem(identityKey));return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  async function request(path,{method='GET',data,token}={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(base+path,{method,credentials:'omit',cache:'no-store',signal:controller.signal,
        headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});
      const value=await response.json();if(!response.ok)throw error(value.message||'Não foi possível acessar esta sala.',value.code);return value;
    }catch(e){if(e.code)throw e;throw error('Não foi possível conectar ao servidor. Confira a conexão e tente novamente.');}finally{clearTimeout(timer);}
  }
  async function identity(){
    const identities=readIdentities();if(typeof identities[base]==='string'&&/^[a-f0-9]{64}$/.test(identities[base]))return identities[base];
    const result=await request('/v1/sessions',{method:'POST',data:{}});identities[base]=result.token;
    try{localStorage.setItem(identityKey,JSON.stringify(identities));}catch{throw error('Não foi possível salvar sua identificação neste aparelho. Permita o armazenamento local.','STORAGE_UNAVAILABLE');}
    return result.token;
  }
  function remember(){try{localStorage.setItem(roomKey,JSON.stringify({server:base,code}));}catch{}}
  function forget(){try{const saved=JSON.parse(localStorage.getItem(roomKey));if(saved?.server===base)localStorage.removeItem(roomKey);}catch{}}
  function stop(reason='Você saiu da sala.'){
    stopping=true;epoch++;entryEpoch++;clearTimeout(reconnectTimer);reconnectTimer=null;retryConnection=null;recoverConnection=null;socket?.close(1000,'Saída');socket=null;state=null;selfId=null;status='closed';rejectPending(error(reason,'ROOM_CLOSED'));notify(reason);
  }
  async function open(target,token){
    const generation=++epoch;stopping=false;code=target;status='connecting';notify();
    await request('/v1/rooms/'+target);
    if(epoch!==generation)throw error('Entrada cancelada.','ENTRY_CANCELLED');
    return new Promise((resolve,reject)=>{
      const ws=new WebSocket(base.replace(/^http/,'ws')+'/v1/rooms/'+target+'/ws');socket=ws;let joined=false,finished=false,fatal=null,sentAuth=null,recovering=false;
      const finish=(e)=>{if(finished)return;finished=true;clearTimeout(timer);e?reject(e):resolve(state);};
      const timer=setTimeout(()=>{finish(error('O servidor demorou a responder. Tente novamente.'));ws.close();},12000);
      function recover(){
        if(recovering||stopping||epoch!==generation)return;recovering=true;
        status='reconnecting';rejectPending(error('A conexão foi interrompida.'));notify('Conexão interrompida. Tentando voltar à sala…');
        const retry=async()=>{
          if(stopping)return;
          if(reconnectAttempts++>=4){status='disconnected';notify('Sem conexão. Toque em Reconectar para tentar novamente; sua identificação foi preservada.');return;}
          try{await open(target,token);}catch(e){if(stopping||e.code==='ENTRY_CANCELLED')return;if(['ROOM_NOT_FOUND','ROOM_CLOSED','BANNED','AUTH_INVALID','ROOM_FULL'].includes(e.code)){forget();stop(e.message);return;}status='reconnecting';notify('Tentando voltar à sala…');reconnectTimer=setTimeout(retry,Math.min(5000,500*2**reconnectAttempts));}
        };
        retryConnection=retry;reconnectTimer=setTimeout(retry,500);
      }
      ws.addEventListener('open',()=>{if(epoch!==generation){ws.close();return;}sentAuth=performance.now();ws.send(JSON.stringify({v:1,id:uid(),type:'auth',data:{token,profile:PanelinhaProfile.current,clientPhase:3}}));});
      ws.addEventListener('message',e=>{
        if(epoch!==generation)return;let m;try{m=JSON.parse(e.data);}catch{return;}
        if(m.v!==1)return;
        if(m.type==='joined'){joined=true;selfId=m.selfId;status='connected';reconnectAttempts=0;retryConnection=null;recoverConnection=recover;sampleClock(m.state,sentAuth);apply(m.state);remember();finish();return;}
        if(m.type==='state'){apply(m.state,m.event);return;}
        if(m.type==='ack'){const job=pending.get(m.id);if(job)sampleClock(m.state,job.sent);apply(m.state,m.event);if(job){pending.delete(m.id);clearTimeout(job.timer);job.resolve(m);}return;}
        if(m.type==='closed'){fatal=error(m.message,'ROOM_CLOSED');forget();finish(fatal);stop(m.message);return;}
        if(m.type==='error'){
          if(m.state)apply(m.state);
          const problem=error(m.message,m.code),job=pending.get(m.id);
          if(job){pending.delete(m.id);clearTimeout(job.timer);job.reject(problem);}
          if(!joined){fatal=problem;finish(problem);}
          if(['BANNED','ROOM_CLOSED','AUTH_INVALID','SESSION_REPLACED'].includes(m.code)){
            fatal=problem;if(m.code==='AUTH_INVALID'){const identities=readIdentities();delete identities[base];try{localStorage.setItem(identityKey,JSON.stringify(identities));}catch{}}
            if(joined){forget();stop(m.message);}else ws.close();
          }else if(joined)notify(m.message);
        }
      });
      ws.addEventListener('error',()=>finish(error('Não foi possível abrir a conexão com esta sala.')));
      ws.addEventListener('close',event=>{
        clearTimeout(timer);if(epoch!==generation){finish(error('Entrada cancelada.','ENTRY_CANCELLED'));return;}
        finish(fatal||error('A conexão com a sala foi interrompida.'));rejectPending(fatal||error('A conexão foi interrompida.'));
        if(!joined&&reconnectAttempts>0&&!fatal){status='reconnecting';return;}
        if(stopping||fatal||!joined||[4000,4001,4003,4004].includes(event.code)){status='closed';notify(fatal?.message||'A sala está indisponível.');return;}
        recover();
      });
    });
  }
  async function enter(target,createRoom=false){
    if(!base)throw error(configError||'O servidor multiplayer ainda não foi configurado. Você pode jogar com bots offline.','NOT_CONFIGURED');
    if(state||status==='connecting')throw error('Você já está conectado ou entrando em uma sala.');
    const attempt=++entryEpoch;
    status='connecting';notify();
    try{
      const token=await identity();
      if(attempt!==entryEpoch)throw error('Entrada cancelada.','ENTRY_CANCELLED');
      if(createRoom)target=(await request('/v1/rooms',{method:'POST',token,data:{id:uid(),profile:PanelinhaProfile.current}})).code;
      if(attempt!==entryEpoch)throw error('Entrada cancelada.','ENTRY_CANCELLED');
      if(!/^\d{6}$/.test(target))throw error('Digite os seis números do código da sala.','BAD_CODE');
      return await open(target,token);
    }catch(e){if(attempt!==entryEpoch)throw error('Entrada cancelada.','ENTRY_CANCELLED');socket?.close();state=null;selfId=null;status='idle';notify(e.message);throw e;}
  }
  function command(type,data={}){
    if(status!=='connected'||!state||socket?.readyState!==WebSocket.OPEN)return Promise.reject(error('Reconecte à sala antes de fazer alterações.'));
    const id=uid();return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(error('A resposta demorou. Confira a sala antes de tentar novamente.'));if(status==='connected'){const old=socket;recoverConnection?.();old?.close(1000,'Sincronizar conexão');}},10000);pending.set(id,{resolve,reject,timer,sent:performance.now()});
      socket.send(JSON.stringify({v:1,id,type,version:state.version,data}));
    });
  }
  async function leave(){try{if(status==='connected')await command('leave');}finally{forget();stop();}}
  function reconnect(){
    const now=performance.now();if(now-lastWake<1000)return;lastWake=now;
    if(['reconnecting','disconnected'].includes(status)&&retryConnection){clearTimeout(reconnectTimer);reconnectAttempts=0;retryConnection();}
    else if(status==='connected')command('sync').catch(()=>{});
  }
  addEventListener('online',reconnect);document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconnect();});
  function invite(){
    if(!code)return null;
    try{const url=new URL(config.inviteBaseUrl||location.href);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;if(url.hostname==='localhost'&&url.protocol==='https:'&&!config.inviteBaseUrl)return null;url.search='';url.hash='';url.searchParams.set('sala',code);return url.href;}catch{return null;}
  }
  let lastCode='';try{const saved=JSON.parse(localStorage.getItem(roomKey));if(saved?.server===base&&/^\d{6}$/.test(saved.code))lastCode=saved.code;}catch{}
  window.PanelinhaLobbyConnection={create:()=>enter(null,true),join:target=>enter(target),command,leave,stop,invite,reconnect,localDeadline,
    cancelEntry(){if(status==='connecting'&&!state)stop('Entrada cancelada.');},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},get current(){return {state,selfId,status,code};},get configured(){return !!base;},get configError(){return configError;},lastCode};
})();
