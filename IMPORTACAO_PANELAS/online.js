/* Adapta snapshots privados à Mesa V1. Nenhuma jogada é resolvida neste arquivo. */
(() => { 'use strict';
  const $=id=>document.getElementById(id),connection=PanelinhaLobbyConnection,bridge=PanelinhaTableBridge;
  let current=null,view=null,matchId=null,picker=null,clockKey='',lastEventId=0;
  const panel=document.createElement('section');panel.className='online-match-panel';panel.hidden=true;
  panel.innerHTML='<h3>Partida online</h3><p id="onlineRoomStatus" role="status"></p><button class="btn warn" id="onlineCloseRoom">Encerrar sala</button>';
  document.querySelector('.table-menu-panel').append(panel);
  const countdown=document.createElement('div');countdown.id='onlineCountdown';countdown.hidden=true;countdown.setAttribute('role','status');countdown.setAttribute('aria-live','polite');$('game').append(countdown);
  const connected=()=>connection.current.status==='connected';
  function message(text){if(current){current.message=text;$('message').textContent=text;}}
  async function command(type,data={}){
    try{return await connection.command(type,data);}
    catch(error){message(error.message);return null;}
  }
  function cancelPicker(){picker=null;if(current)current.pendingAction=null;$('cancelColor')?.click();}
  function play(cardId,cut=false){
    if(!current||!connected())return;
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
    if(!current)return;cancelPicker();bridge.clearOnline();current=null;view=null;matchId=null;lastEventId=0;panel.hidden=true;countdown.hidden=true;delete document.body.dataset.online;
    PanelinhaNavigation.exitOnline(route);
  }
  function receive(value){
    const g=value.state?.game;
    if(!g){if(current)end(value.status==='closed'?'multiplayer':'lobby');return;}
    view=value;const fresh=matchId!==g.matchId,roundChanged=current?.round!==g.round;
    if(fresh){if(current)bridge.clearOnline();current={online:true,pendingAction:null,reveal:false,modal:null};matchId=g.matchId;lastEventId=g.events[g.events.length-1]?.id||0;picker=null;bridge.setOnline(current);PanelinhaAnnouncements.start(current);PanelinhaSFX.event('round-prepare');if(!g.countdownAt||g.countdownAt<=g.serverNow)PanelinhaSFX.event('round-start');}
    const local=seat=>Number.isInteger(seat)?(seat-g.self+4)%4:seat,offset=Date.now()-g.serverNow;
    Object.assign(current,{roomCode:value.state.code,o:g.o,round:g.round,phase:g.phase,activeColor:g.activeColor,direction:g.direction,current:local(g.current),
      penalty:g.penalty,highest:g.highest,finisher:g.finisher===null?null:local(g.finisher),drawn:g.drawn,cutOpen:g.cutOpen,
      unlockAt:g.unlockAt?g.unlockAt+offset:0,deadline:g.deadline?g.deadline+offset:0,countdownAt:g.countdownAt?g.countdownAt+offset:0,
      lastActor:g.lastActor===null?null:local(g.lastActor),preUno:g.preUno,unoWindow:g.unoWindow?{id:local(g.unoWindow.id)}:null,
      teams:g.self%2?[g.teams[1],g.teams[0]]:g.teams,summary:g.summary.map(p=>({...p,id:local(p.id)})),winner:g.winner,token:g.token,
      deck:Array(g.deckCount).fill(null),discard:g.discard,message:g.message,log:g.log,actions:g.actions});
    current.players=g.players.map(p=>({...p,id:local(p.id),hand:p.hand||Array.from({length:p.count},(_,i)=>({id:-((local(p.id)+1)*100000+i+1),hidden:true}))})).sort((a,b)=>a.id-b.id);
    current.identity={name:current.players[0].name,avatar:current.players[0].avatar};
    if(roundChanged&&!fresh)PanelinhaAnnouncements.round(current);
    if(picker&&(!current.players[0].hand.some(c=>c.id===picker.cardId)||!(picker.type==='cut'?g.actions.cuts:g.actions.legal).includes(picker.cardId)))cancelPicker();
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
    const rows=current.summary.map(p=>`<div class="notice"><strong>${p.place}º — ${PanelinhaProfile.escape(current.players[p.id].name)}</strong> · ${p.cost} pontos nas cartas restantes (${p.remaining} cartas)</div>`).join('');
    return `<div class="banner">${current.phase==='gameOver'?'Partida concluída':'Rodada concluída'}${current.winner?' · '+PanelinhaProfile.escape(current.winner):''}</div>${rows}<div class="controls"><button id="onlineReadyResult" class="btn good">${me?.ready?'Não estou pronto':current.phase==='gameOver'?'Voltar à sala':'Pronto para a próxima rodada'}</button>${host&&current.phase==='roundOver'?`<button id="onlineNextRound" class="btn good" ${state.allReady?'':'disabled'}>Iniciar próxima rodada</button>`:''}</div><p class="help">${current.phase==='gameOver'?'Todos confirmam para retornar ao lobby da mesma sala.':'Todos confirmam Pronto; o anfitrião inicia a próxima rodada.'}</p>`;
  }
  function bindResults(){
    $('onlineReadyResult')?.addEventListener('click',()=>{const me=connection.current.state.players.find(p=>p?.id===connection.current.selfId);command('ready',{ready:!me.ready});});
    $('onlineNextRound')?.addEventListener('click',()=>command('next-round'));
  }
  function tick(){
    if(!current)return;const now=Date.now(),left=Math.max(0,Math.ceil((current.countdownAt-now)/1000));countdown.hidden=!left;countdown.textContent=left?String(left):'';
    const key=`${current.token}:${now>=current.unlockAt}:${connected()}`;
    if(key!==clockKey){clockKey=key;bridge.render();}
    PanelasMesa.updateClock(current,now);
  }
  window.PanelinhaOnline={receive,play,command,resultHTML,bindResults,tick,end,get active(){return !!current;},get connected(){return connected();}};
})();
