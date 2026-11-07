/* Adapta snapshots privados à Mesa V1. Nenhuma jogada é resolvida neste arquivo. */
(() => { 'use strict';
  const $=id=>document.getElementById(id),connection=PanelinhaLobbyConnection,bridge=PanelinhaTableBridge;
  let current=null,view=null,matchId=null,picker=null,clockKey='',lastEventId=0,reclaiming=false,consumeClick=false;
  const panel=document.createElement('section');panel.className='online-match-panel';panel.hidden=true;
  panel.innerHTML='<h3>Partida online</h3><p id="onlineRoomStatus" role="status"></p><button class="btn alt" id="onlinePauseToggle">Pausar partida</button><button class="btn warn" id="onlineCloseRoom">Encerrar sala</button>';
  document.querySelector('.table-menu-panel').append(panel);
  const countdown=document.createElement('div');countdown.id='onlineCountdown';countdown.hidden=true;countdown.setAttribute('role','status');countdown.setAttribute('aria-live','polite');$('game').append(countdown);
  const pause=document.createElement('section');pause.id='onlinePause';pause.hidden=true;pause.setAttribute('aria-labelledby','onlinePauseTitle');
  pause.innerHTML='<h2 id="onlinePauseTitle">Partida pausada</h2><p id="onlinePauseText"></p><button id="onlineResumeBtn" class="btn good">Retomar partida</button>';$('table').append(pause);
  const notice=document.createElement('div');notice.id='onlineConnectionNotice';notice.hidden=true;notice.setAttribute('role','status');
  notice.innerHTML='<span id="onlineConnectionText"></span><button id="onlineReconnectBtn" class="btn alt">Reconectar</button><button id="onlineReclaimBtn" class="btn good">Retomar mão</button>';$('table').append(notice);
  const connected=()=>connection.current.status==='connected';
  function message(text){if(current){current.message=text;$('message').textContent=text;}}
  async function command(type,data={}){
    if(current?.actions.reclaim&&!['reclaim','sync','pause','resume','close-room','leave'].includes(type)){await takeControl();return null;}
    try{return await connection.command(type,data);}
    catch(error){message(error.message);return null;}
  }
  async function takeControl(){
    if(reclaiming||!current?.actions.reclaim||!connected())return;
    reclaiming=true;cancelPicker();
    try{await connection.command('reclaim');}
    catch(error){if(error.code==='STALE_STATE'&&current?.actions.reclaim)try{await connection.command('reclaim');}catch(e){message(e.message);}else message(error.message);}
    finally{reclaiming=false;}
  }
  function captureIntent(event){
    if(!connected()){consumeClick=false;return;}
    if(event.type==='pointerdown')consumeClick=false;
    if(event.type==='click'&&consumeClick){consumeClick=false;event.preventDefault();event.stopImmediatePropagation();return;}
    if(!current?.actions.reclaim&&!reclaiming)return;
    if(event.type==='pointerdown')consumeClick=true;
    event.preventDefault();event.stopImmediatePropagation();takeControl();
  }
  $('game').addEventListener('pointerdown',captureIntent,true);$('game').addEventListener('click',captureIntent,true);
  $('onlineReclaimBtn').onclick=takeControl;$('onlineReconnectBtn').onclick=()=>connection.reconnect();
  async function togglePause(){if(!current||!connected())return;cancelPicker();await command(current.paused?'resume':'pause');PanelasMesa.closeMenu();}
  $('onlinePauseToggle').onclick=togglePause;$('onlineResumeBtn').onclick=togglePause;
  function cancelPicker(){picker=null;if(current)current.pendingAction=null;$('cancelColor')?.click();}
  function play(cardId,cut=false){
    if(!current||!connected()||current.paused)return;
    if(current.actions.reclaim){takeControl();return;}
    const cards=cut?current.actions.cuts:current.actions.legal;if(!cards.includes(cardId))return;
    const card=current.players[0].hand.find(c=>c.id===cardId);if(!card)return;
    const type=cut?'cut':'play';
    if(PanelinhaRules.COLOR_CHOOSERS.has(card.type)&&current.players[0].hand.length>1){
      picker={cardId,type,matchId};current.pendingAction=picker;bridge.render();
      PanelinhaColorPicker.open($('modalRoot'),{cardType:card.type,
        choose(color){const pending=picker;picker=null;current.pendingAction=null;if(pending?.matchId===matchId)command(type,{cardId,color});},
        cancel(){picker=null;if(current){current.pendingAction=null;bridge.render();}}
      });
    }else command(type,{cardId});
  }
  function end(route='multiplayer'){
    if(!current)return;cancelPicker();bridge.clearOnline();current=null;view=null;matchId=null;lastEventId=0;reclaiming=false;consumeClick=false;panel.hidden=true;countdown.hidden=true;pause.hidden=true;notice.hidden=true;delete document.body.dataset.online;
    PanelinhaNavigation.exitOnline(route);
  }
  function receive(value){
    const g=value.state?.game;
    if(!g){if(current)end(value.status==='closed'?'multiplayer':'lobby');return;}
    view=value;const fresh=matchId!==g.matchId,roundChanged=current?.round!==g.round;
    if(fresh){if(current)bridge.clearOnline();current={online:true,pendingAction:null,reveal:false,modal:null};matchId=g.matchId;lastEventId=g.events[g.events.length-1]?.id||0;picker=null;bridge.setOnline(current);PanelinhaAnnouncements.start(current);PanelinhaSFX.event('round-prepare');if(!g.countdownAt||g.countdownAt<=g.serverNow)PanelinhaSFX.event('round-start');}
    const local=seat=>Number.isInteger(seat)?(seat-g.self+4)%4:seat,deadline=time=>connection.localDeadline(time,g.serverNow);
    Object.assign(current,{roomCode:value.state.code,o:g.o,round:g.round,phase:g.phase,activeColor:g.activeColor,direction:g.direction,current:local(g.current),
      blockedPlayer:g.blockedPlayer===null||g.blockedPlayer===undefined?null:local(g.blockedPlayer),lastPenaltyPurchase:g.lastPenaltyPurchase?{...g.lastPenaltyPurchase,actor:local(g.lastPenaltyPurchase.actor)}:null,finalStandings:g.finalStandings?.map(group=>({...group,playerIds:group.playerIds.map(local)}))||null,penalty:g.penalty,highest:g.highest,finisher:g.finisher===null?null:local(g.finisher),drawn:g.drawn,cutOpen:g.cutOpen,cutAnnounceUntil:deadline(g.cutAnnounceUntil),
      presentationUntil:deadline(g.presentationUntil),lastDistribution:g.lastDistribution?{...g.lastDistribution,active:g.lastDistribution.active.map(local),actor:local(g.lastDistribution.actor),beforeCounts:[0,1,2,3].map(i=>g.lastDistribution.beforeCounts[(i+g.self)%4]),afterCounts:[0,1,2,3].map(i=>g.lastDistribution.afterCounts[(i+g.self)%4])}:null,unlockAt:deadline(g.unlockAt),deadline:deadline(g.deadline),countdownAt:deadline(g.countdownAt),paused:!!g.paused,resumeAt:deadline(g.resumeAt),remaining:g.remaining,
      lastActor:g.lastActor===null?null:local(g.lastActor),preUno:g.preUno,unoWindow:g.unoWindow?{...g.unoWindow,id:local(g.unoWindow.id)}:null,
      lastRotation:g.lastRotation?{...g.lastRotation,actor:local(g.lastRotation.actor),active:g.lastRotation.active.map(local),transfers:g.lastRotation.transfers.map(t=>({...t,from:local(t.from),to:local(t.to)})),beforeCounts:[0,1,2,3].map(i=>g.lastRotation.beforeCounts[(i+g.self)%4]),afterCounts:[0,1,2,3].map(i=>g.lastRotation.afterCounts[(i+g.self)%4])}:null,roundScore:g.roundScore?{players:g.roundScore.players.map(p=>({...p,id:local(p.id)})),teams:g.self%2?[g.roundScore.teams[1],g.roundScore.teams[0]]:g.roundScore.teams}:null,teams:g.self%2?[g.teams[1],g.teams[0]]:g.teams,summary:g.summary.map(p=>({...p,id:local(p.id)})),winner:g.winner,token:g.token,
      deck:Array(g.deckCount).fill(null),discard:g.discard,message:g.message,log:g.log,actions:g.actions});
    current.players=g.players.map(p=>({...p,id:local(p.id),hand:p.hand||Array.from({length:p.count},(_,i)=>({id:-((local(p.id)+1)*100000+i+1),hidden:true}))})).sort((a,b)=>a.id-b.id);
    current.identity={name:current.players[0].name,avatar:current.players[0].avatar};
    if(roundChanged&&!fresh)PanelinhaAnnouncements.round(current);
    if(picker&&(!connected()||g.paused||g.actions.reclaim||!current.players[0].hand.some(c=>c.id===picker.cardId)||!(picker.type==='cut'?g.actions.cuts:g.actions.legal).includes(picker.cardId)))cancelPicker();
    const events=g.events.filter(e=>e.id>lastEventId);for(const event of events){lastEventId=Math.max(lastEventId,event.id);
      if(event.type==='draw')PanelasMesa.recordDraw(current,local(event.actor),event.card||{id:-(event.id+900000)});
    }
    document.body.dataset.online='true';panel.hidden=false;
    $('onlineRoomStatus').textContent='Sala '+value.state.code+' · '+(connected()?'Conectado':'Reconectando…');$('onlineCloseRoom').hidden=value.state.hostId!==value.selfId;
    $('onlineCloseRoom').onclick=()=>PanelinhaMultiplayer.confirmClose();
    if(PanelinhaNavigation.current!=='game')PanelinhaNavigation.enterOnline();
    bridge.render();
    for(const event of events){
      if(event.type==='last-card')PanelinhaAnnouncements.announce(current,local(event.actor),event.name,event.stage);
      if(event.type==='sound'){
        const data={...event.data};if(event.name==='round-result')data.won=g.o.duo?(g.winnerTeam??g.finisher%2)===g.self%2:(g.winnerId??g.finisher)===g.self;
        PanelinhaSFX.event(event.name,data);
      }
    }
    tick();
  }
  function resultHTML(){
    const state=connection.current.state,me=state?.players.find(p=>p?.id===connection.current.selfId),host=state?.hostId===connection.current.selfId;
    const rows=PanelinhaMatchUI.scoreHTML(current,id=>current.players[id].name)+current.summary.map(p=>`<div class="notice"><strong>${p.place}º — ${PanelinhaProfile.escape(current.players[p.id].name)}</strong> · ${p.cost} pontos nas cartas restantes (${p.remaining} cartas)</div>`).join('');
    return `${PanelinhaPodium.html(current,id=>current.players[id].name)}<div class="banner" ${current.phase==='gameOver'?'hidden':''}>${current.phase==='gameOver'?'Partida concluída':'Rodada concluída'}${current.winner?' · '+PanelinhaProfile.escape(current.winner):''}</div>${current.phase==='gameOver'?'<details class="final-details"><summary>Placar e última rodada</summary>':''}${rows}${current.phase==='gameOver'?'</details>':''}<div class="controls"><button id="onlineReadyResult" class="btn good">${me?.ready?'Não estou pronto':current.phase==='gameOver'?'Voltar à sala':'Pronto para a próxima rodada'}</button>${host&&current.phase==='roundOver'?`<button id="onlineNextRound" class="btn good" ${state.allReady?'':'disabled'}>Iniciar próxima rodada</button>`:''}</div><p class="help">${current.phase==='gameOver'?'Todos confirmam para retornar ao lobby da mesma sala.':'Todos confirmam Pronto; o anfitrião inicia a próxima rodada.'}</p>`;
  }
  async function readyForResult(){
    if(!current||!connected())return;
    const scope={match:matchId,round:current.round,phase:current.phase},me=view.state.players.find(p=>p?.id===view.selfId),ready=!me.ready;
    // STALE_STATE confirma que esta intenção NÃO foi aplicada. Só o Pronto,
    // dentro do mesmo resultado, pode ser reenviado com a versão atual. Timeout
    // ou qualquer outra resposta ambígua nunca provoca reenvio de ações.
    for(let attempt=0;attempt<4;attempt++){
      if(!current||!connected()||matchId!==scope.match||current.round!==scope.round||current.phase!==scope.phase)return;
      if(view.state.players.find(p=>p?.id===view.selfId)?.ready===ready)return;
      try{await connection.command('ready',{ready});return;}
      catch(error){if(error.code!=='STALE_STATE'){message(error.message);return;}}
    }
    message('A sala mudou. Confirme Pronto novamente.');
  }
  function bindResults(){
    const host=view.state.hostId===view.selfId,live=connected();
    $('onlinePauseToggle').hidden=!host||current.phase!=='playing';$('onlinePauseToggle').textContent=current.paused?'Retomar partida':'Pausar partida';$('onlinePauseToggle').disabled=!live||!!current.resumeAt;
    $('onlineResumeBtn').hidden=!host;$('onlineResumeBtn').disabled=!live||!!current.resumeAt;
    pause.hidden=!current.paused||!!current.resumeAt;
    $('onlinePauseText').textContent=host?'O tempo e as janelas de jogada estão congelados.':'Aguardando o anfitrião retomar. O tempo está congelado.';
    notice.hidden=live&&!current.actions.reclaim;
    $('onlineConnectionText').textContent=!live?'Sem conexão.':'Bot no controle. Primeiro toque só retoma.';
    $('onlineReconnectBtn').hidden=live;$('onlineReconnectBtn').disabled=['connecting','reconnecting'].includes(connection.current.status);
    $('onlineReclaimBtn').hidden=!live||!current.actions.reclaim;
    for(const [id,action] of [['passBtn','pass'],['challengeBtn','challenge'],['unoBtn','announce'],['reportBtn','report']])if($(id))$(id).disabled=!live||!current.actions[action];
    if($('onlineReadyResult'))$('onlineReadyResult').disabled=!live||current.actions.reclaim;
    if($('onlineNextRound'))$('onlineNextRound').disabled=!live||!view.state.allReady;
    $('onlineReadyResult')?.addEventListener('click',readyForResult);
    $('onlineNextRound')?.addEventListener('click',()=>command('next-round'));
  }
  function tick(){
    if(!current)return;const now=Date.now(),left=Math.max(0,Math.ceil(((current.resumeAt||current.countdownAt)-now)/1000));countdown.hidden=!left;countdown.textContent=left?String(left):'';
    const key=`${current.token}:${now>=current.unlockAt}:${connected()}:${current.paused}:${current.actions.reclaim}`;
    if(key!==clockKey){clockKey=key;bridge.render();}
    PanelasMesa.updateClock(current,now);
  }
  window.PanelinhaOnline={receive,play,command,resultHTML,bindResults,tick,end,get active(){return !!current;},get connected(){return connected();}};
})();
