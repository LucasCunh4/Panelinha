/* Lobby real conectado ao Worker. A mesa offline e seu motor não são usados aqui. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),connection=PanelinhaLobbyConnection;
  let view=connection.current,dialogKind=null,returnFocus=null,busy=false,entryRoute=null;
  const dialog=document.createElement('div');dialog.id='lobbyDialog';dialog.className='lobby-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','lobbyDialogTitle');
  dialog.innerHTML='<div class="lobby-dialog-panel"><h2 id="lobbyDialogTitle"></h2><div class="lobby-dialog-content"></div><p id="lobbyDialogError" class="mp-error" role="alert"></p><div class="lobby-dialog-footer"><button id="lobbyDialogCancel" class="btn alt">Voltar</button><button id="lobbyDialogConfirm" class="btn good">Confirmar</button></div></div>';document.body.append(dialog);
  const content=dialog.querySelector('.lobby-dialog-content');
  const entryNotice=document.createElement('p');entryNotice.className='mp-server-status';entryNotice.setAttribute('role','status');$('multiplayer').append(entryNotice);
  function notice(text){$('lobbyNotice').textContent=text;}
  function isHost(){return view.state?.hostId===view.selfId;}
  function closeDialog(){if(dialog.hidden)return false;PanelinhaMatchUI.closeHelp(false);PanelinhaSelects.close({animate:false});dialog.hidden=true;dialogKind=null;content.textContent='';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});return true;}
  function openDialog(title,kind,confirm,label='Confirmar'){
    closeDialog();returnFocus=document.activeElement;dialogKind=kind;$('lobbyDialogTitle').textContent=title;$('lobbyDialogError').textContent='';$('lobbyDialogConfirm').textContent=label;$('lobbyDialogConfirm').hidden=!confirm;$('lobbyDialogConfirm').disabled=false;dialog.hidden=false;
    $('lobbyDialogConfirm').onclick=async()=>{const button=$('lobbyDialogConfirm');button.disabled=true;try{await confirm();closeDialog();}catch(e){$('lobbyDialogError').textContent=e.message;}finally{button.disabled=false;}};
    $('lobbyDialogCancel').focus({preventScroll:true});return content;
  }
  $('lobbyDialogCancel').onclick=closeDialog;dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button,input,select,[tabindex="0"]')].filter(e=>!e.disabled&&e.getClientRects().length&&!e.hidden),first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  async function action(type,data={}){try{await connection.command(type,data);}catch(e){notice(e.message);throw e;}}
  function confirmAction(title,text,type,data={}){const body=openDialog(title,'confirm',()=>action(type,data));const p=document.createElement('p');p.textContent=text;body.append(p);}
  const cards=Array.from({length:4},(_,i)=>{
    const root=document.createElement('article');root.className='lobby-player';root.setAttribute('role','listitem');root.dataset.slot=String(i);
    root.innerHTML='<span class="lobby-player-avatar"></span><strong class="lobby-player-name"></strong><span class="lobby-player-role"></span><span class="lobby-player-state"></span><span class="lobby-player-team"></span><div class="lobby-team-choice"><button type="button" data-team="1">Equipe 1</button><button type="button" data-team="2">Equipe 2</button></div><button type="button" class="btn lobby-moderate"></button>';
    $('lobbyPlayers').append(root);return root;
  });
  function render(){
    const state=view.state;if(!state)return;
    $('lobbyCode').textContent=state.code;const connected=view.status==='connected',host=isHost(),self=state.players.find(p=>p?.id===view.selfId);
    $('lobbyConnectionStatus').textContent=connected?'Conectado':view.status==='reconnecting'?'Reconectando…':'Conectando…';
    $('lobbyReadyBtn').textContent=self?.ready?'Não estou pronto':'Pronto';$('lobbyReadyBtn').disabled=!connected||!self;
    $('lobbyCloseBtn').hidden=!host;$('lobbyCloseBtn').disabled=!connected;$('lobbyRulesBtn').disabled=!connected;$('lobbyProfileBtn').disabled=!connected;
    $('lobbyStartBtn').disabled=!connected||!host||!state.canStart;
    $('shareRoomLink').disabled=!connection.invite();$('shareRoomLink').title=connection.invite()?'Compartilhar convite sem identificação privada':'Compartilhe o código; o link web precisa ser configurado.';
    cards.forEach((root,i)=>{
      const p=state.players[i],name=root.querySelector('.lobby-player-name'),avatar=root.querySelector('.lobby-player-avatar'),moderate=root.querySelector('.lobby-moderate');
      root.classList.toggle('is-empty',!p);root.classList.toggle('is-ready',!!p?.ready);root.dataset.playerId=p?.id||'';
      name.textContent=p?.name||'Vaga livre';name.title=p?.name||'Vaga livre';
      const image=p?PanelinhaProfile.avatarHTML(p.avatar):'';if(avatar.dataset.avatar!==(p?.avatar||'')){avatar.innerHTML=image;avatar.dataset.avatar=p?.avatar||'';}
      root.querySelector('.lobby-player-role').textContent=p?(p.id===state.hostId?'Anfitrião':p.bot?'Bot':p.id===view.selfId?'Você':'Jogador'):'Convide alguém';
      root.querySelector('.lobby-player-state').textContent=p?(p.ready?'✓ Pronto':'Não pronto'):'';
      root.querySelector('.lobby-player-team').textContent=state.rules.duo&&p?'Equipe '+p.team:'';
      const teams=root.querySelector('.lobby-team-choice');teams.hidden=!state.rules.duo||!p||p.bot||p.id!==view.selfId;
      teams.querySelectorAll('button').forEach(button=>{button.setAttribute('aria-pressed',String(Number(button.dataset.team)===p?.team));button.disabled=!connected;button.onclick=()=>action('team',{team:Number(button.dataset.team)}).catch(()=>{});});
      moderate.hidden=!host||p?.id===view.selfId;moderate.disabled=!connected;
      moderate.textContent=!p?'Adicionar bot':p.bot?'Remover bot':'Expulsar';
      moderate.onclick=()=>!p?action('add-bot').catch(()=>{}):p.bot?action('remove-bot',{playerId:p.id}).catch(()=>{}):confirmAction('Expulsar participante?',p.name+' não poderá voltar com esta identificação enquanto a sala existir.','kick',{playerId:p.id});
    });
    if(dialogKind==='rules'&&!host)closeDialog();
  }
  function serverStatus(){return connection.configError||(!connection.configured?'Servidor multiplayer ainda não configurado. Um jogador continua disponível offline.':'Partidas online disponíveis. Um jogador continua funcionando offline.');}
  document.querySelectorAll('[data-mp-server-status]').forEach(e=>e.textContent=serverStatus());
  $('createLobbyBtn').disabled=!connection.configured;$('roomCode').disabled=!connection.configured;
  function joinEnabled(){$('joinLobbyBtn').disabled=busy||!connection.configured||!/^\d{6}$/.test($('roomCode').value);}
  $('roomCode').addEventListener('input',joinEnabled);
  async function enter(create){
    if(busy)return;busy=true;entryRoute=PanelinhaNavigation.current;const output=$(create?'createLobbyError':'joinLobbyError');output.textContent='';$('createLobbyBtn').disabled=true;joinEnabled();
    try{await (create?connection.create():connection.join($('roomCode').value));}
    catch(e){if(e.code!=='ENTRY_CANCELLED')output.textContent=e.message;}finally{busy=false;entryRoute=null;$('createLobbyBtn').disabled=!connection.configured;joinEnabled();}
  }
  $('createLobbyBtn').onclick=()=>enter(true);$('joinLobbyForm').onsubmit=event=>{event.preventDefault();enter(false);};
  $('lobbyReadyBtn').onclick=()=>{const me=view.state?.players.find(p=>p?.id===view.selfId);if(me)action('ready',{ready:!me.ready}).catch(()=>{});};
  $('lobbyCloseBtn').onclick=()=>confirmAction('Encerrar a sala?','Todos voltarão ao menu e este código deixará de funcionar.','close-room');
  $('lobbyStartBtn').onclick=()=>action('start').catch(()=>{});
  $('lobbyPhaseNotice').textContent='Preencha os quatro lugares e confirme Pronto. O anfitrião inicia a partida.';
  async function copy(text){
    if(navigator.clipboard?.writeText)try{await navigator.clipboard.writeText(text);return;}catch{}
    const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();if(!ok)throw Error('Não foi possível copiar automaticamente. Anote o código mostrado na tela.');
  }
  $('copyRoomCode').onclick=()=>copy(view.state.code).then(()=>notice('Código copiado.')).catch(e=>notice(e.message));
  $('shareRoomLink').onclick=async()=>{const url=connection.invite();if(!url)return;try{if(navigator.share)await navigator.share({title:'Panelinha',text:'Entre na minha sala do Panelinha.',url});else{await copy(url);notice('Link de convite copiado.');}}catch(e){if(e.name!=='AbortError')notice(e.message);}};
  $('lobbyRulesBtn').onclick=()=>{
    const host=isHost(),body=openDialog('Regras da sala','rules',host?async()=>{await action('rules',{rules:read()});}:null,'Salvar regras');
    const grid=$('menu').querySelector('.settings-grid').cloneNode(true);
    grid.querySelectorAll('.panelinha-select').forEach(wrapper=>wrapper.replaceWith(wrapper.querySelector('select')));
    grid.querySelectorAll('[id]').forEach(node=>node.id='mpRule-'+node.id);
    grid.querySelectorAll('select').forEach(node=>{node.classList.remove('select-native-model');node.removeAttribute('aria-hidden');node.tabIndex=0;});body.append(grid);
    const field=id=>grid.querySelector('#mpRule-'+id),r=view.state.rules;
    field('mode').querySelector('[value=duo]').textContent='Duplas';field('mode').value=r.duo?'duo':'solo';field('duration').value=r.single?'single':'points';field('timeout').value=String(r.timeout);
    for(const id of ['infinite','cut','challenge','wild6','dist','rotate'])field(id).checked=r[id];
    function goals(){const duo=field('mode').value==='duo',old=Number(field('goal').value),values=duo?[5,10,15]:[10,20,30,50];field('goal').innerHTML=values.map(v=>'<option value="'+v+'">'+v+' pontos</option>').join('');field('goal').value=String(values.includes(old)?old:values[0]);field('goal').disabled=!host||field('duration').value==='single';}
    goals();field('goal').value=String(r.goal);field('mode').onchange=goals;field('duration').onchange=goals;
    field('wild6').onchange=()=>field('challengeSettingLabel').textContent=field('wild6').checked?'Desafiar +4 e +6':'Desafiar +4';field('wild6').onchange();
    if(!host)grid.querySelectorAll('input,select').forEach(e=>e.disabled=true);
    PanelinhaSelects.enhance(body);
    function read(){return {duo:field('mode').value==='duo',single:field('duration').value==='single',goal:Number(field('goal').value),timeout:Number(field('timeout').value),...Object.fromEntries(['infinite','cut','challenge','wild6','dist','rotate'].map(id=>[id,field(id).checked]))};}
  };
  $('lobbyProfileBtn').onclick=()=>{
    let selected=PanelinhaProfile.current.avatar;
    const body=openDialog('Seu nome e avatar','profile',async()=>{const value={name:input.value,avatar:selected};await action('profile',value);PanelinhaProfile.save(value);},'Salvar perfil');
    const label=document.createElement('label');label.textContent='Seu nome';const input=document.createElement('input');input.className='lobby-profile-name';input.id='lobbyProfileName';input.maxLength=32;input.value=PanelinhaProfile.current.name;label.htmlFor=input.id;body.append(label,input);
    const gallery=document.createElement('div');gallery.className='lobby-avatar-gallery';gallery.setAttribute('role','group');gallery.setAttribute('aria-label','Avatares oficiais');body.append(gallery);
    for(const {id,label}of PanelinhaProfile.avatars){const button=document.createElement('button');button.type='button';button.dataset.lobbyAvatar=id;button.setAttribute('aria-label',label);button.innerHTML=PanelinhaProfile.avatarHTML(id);const text=document.createElement('span');text.textContent=label;button.append(text);button.setAttribute('aria-pressed',String(id===selected));button.onclick=()=>{selected=id;gallery.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lobbyAvatar===id)));};gallery.append(button);}
  };
  function requestLeave(after=()=>PanelinhaNavigation.go('multiplayer')){
    const body=openDialog('Sair da sala?','leave',async()=>{await connection.leave();after();},'Sair da sala');const p=document.createElement('p');p.textContent=view.state?.game?'Um bot assume sua posição. Você pode retornar com a identificação deste aparelho enquanto a sala existir. Se todos os humanos saírem, a sala será encerrada.':'Sua vaga será liberada. Se você for o último humano conectado, a sala será encerrada.';body.append(p);
  }
  window.PanelinhaMultiplayer={requestLeave,confirmClose(){confirmAction('Encerrar a sala?','Todos voltarão ao menu e este código deixará de funcionar.','close-room');},routeChanged(route){if(busy&&route!==entryRoute&&route!=='lobby'&&route!=='game')connection.cancelEntry();},handleBack(route){if(closeDialog())return true;if(route==='lobby'&&this.active){requestLeave();return true;}return false;},get active(){return !!view.state&&!['closed','idle'].includes(view.status);}};
  connection.subscribe(value=>{
    const before=view;view=value;
    if(value.status==='connected'&&value.state){
      render();if(value.state.game){closeDialog();PanelinhaOnline.receive(value);}else{if(PanelinhaOnline.active)PanelinhaOnline.receive(value);if(PanelinhaNavigation.current!=='lobby')PanelinhaNavigation.go('lobby');}
      notice(value.message||value.state.notice||(value.state.allReady?'Mesa preparada. O anfitrião pode iniciar.':''));
    }else if(value.state){render();if(value.state.game)PanelinhaOnline.receive(value);notice(value.message);}
    if(value.event?.type==='player-ready')PanelinhaSFX.event('player-ready');
    if(value.status==='closed'&&(before.state||PanelinhaNavigation.current==='lobby')){closeDialog();entryNotice.textContent=value.message;view={...value,state:null};if(PanelinhaOnline.active)PanelinhaOnline.end();if(PanelinhaNavigation.current==='lobby')PanelinhaNavigation.go('multiplayer');}
  });
  const invited=new URL(location.href).searchParams.get('sala');
  if(invited&&/^\d{6}$/.test(invited)){ $('roomCode').value=invited;PanelinhaNavigation.openInvite(invited); }
  else if(connection.lastCode)$('roomCode').value=connection.lastCode;
  joinEnabled();
})();
