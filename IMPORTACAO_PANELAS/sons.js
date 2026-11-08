/* SFX locais por eventos confirmados. Nunca aguarda áudio para resolver uma regra. */
(() => {
  'use strict';
  const storageKey='panelinha.sfx.v1',base='assets/menu-oficial/audio/';
  const files={play:'01_jogar_carta',draw:'02_comprar_carta',wild6:'03_mais6',dist:'04_panela_de_pressao',rotate:'05_liquidificador',draw2:'06_mais2',wild4:'07_mais4',skip:'08_bloqueio',reverse:'09_inverter',wild:'10_coringa_escolher_cor',cut:'11_corte',last:'12_ultima_carta',penalty2:'13_punicao_2',penalty4:'13_punicao_4',penalty6:'13_punicao_6',penalty12:'13_punicao_12',tick:'14_tick_contagem',final:'14_tick_final',win:'15_vitoria',lose:'16_derrota',click:'17_botao_clique',confirm:'17_botao_confirmar',open:'18_menu_abrir',close:'18_menu_fechar',shuffle:'19_embaralhar',deal:'19_distribuir',start:'20_inicio_rodada',color:'21_escolher_cor',ready:'22_jogador_pronto'};
  let volume=.7,muted=false,context=null,master=null,unlocked=false,generation=0,dealing=false,lastDraw=-Infinity,clockKey=null;
  let loading=0,route=null;const buffers=new Map(),loads=new Map(),loadQueue=[],voices=new Set(),timers=new Set(),announcements=new Set(),errors=new Set();
  try{const stored=JSON.parse(localStorage.getItem(storageKey));if(Number.isFinite(stored?.volume))volume=Math.max(0,Math.min(1,stored.volume));muted=stored?.muted===true;}catch{}
  function pump(){
    while(loading<2&&loadQueue.length){
      const job=loadQueue.shift();loading++;
      fetch(base+files[job.key]+'.mp3').then(r=>{if(!r.ok)throw Error('MP3 '+r.status);return r.arrayBuffer();}).then(bytes=>new Promise((resolve,reject)=>context.decodeAudioData(bytes,resolve,reject))).then(buffer=>{buffers.set(job.key,buffer);job.resolve(buffer);}).catch(()=>{errors.add(job.key);loads.delete(job.key);job.resolve(null);}).finally(()=>{loading--;pump();});
    }
  }
  function load(key){
    if(buffers.has(key))return Promise.resolve(buffers.get(key));
    if(!loads.has(key))loads.set(key,new Promise(resolve=>{loadQueue.push({key,resolve});pump();}));
    return loads.get(key);
  }
  function stopVoice(voice){try{voice.source.stop();}catch{}voices.delete(voice);}
  function stopAll(){generation++;lastDraw=-Infinity;timers.forEach(clearTimeout);timers.clear();voices.forEach(stopVoice);}
  function later(callback,ms){const id=setTimeout(()=>{timers.delete(id);callback();},ms);timers.add(id);}
  function setGain(){if(master)master.gain.setTargetAtTime(muted?0:volume*.65,context.currentTime,.015);}
  async function unlock(){
    if(unlocked){if(context?.state==='suspended'&&!document.hidden)context.resume().catch(()=>{});return;}
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    try{
      if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);setGain();}
      await context.resume();unlocked=context.state==='running';
      if(unlocked)for(const key of ['click','confirm','open','close','play','draw','tick','final'])load(key);
    }catch{errors.add('unlock');}
  }
  async function play(key,channel='effect',gain=1){
    if(!files[key]||!context||!unlocked||muted||volume===0||document.hidden)return false;
    const epoch=generation,buffer=await load(key);
    if(!buffer||generation!==epoch||muted||volume===0||document.hidden||context.state!=='running')return false;
    // Uma voz por canal, duas compras no máximo e seis fontes no total.
    const same=[...voices].filter(v=>v.channel===channel),limit=channel==='draw'?2:1;
    while(same.length>=limit)stopVoice(same.shift());
    while(voices.size>=6)stopVoice(voices.values().next().value);
    const source=context.createBufferSource(),level=context.createGain();source.buffer=buffer;level.gain.value=gain;source.connect(level);level.connect(master);
    const voice={source,channel,key};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();level.disconnect();};source.start();
    document.dispatchEvent(new CustomEvent('panelinha:sfx',{detail:{key,channel}}));return true;
  }
  function event(type,data={}){
    switch(type){
      case 'round-prepare':stopAll();clockKey=null;dealing=true;break;
      case 'round-start':
        dealing=false;play('shuffle','round-shuffle',.35);later(()=>play('deal','round-deal',.4),160);later(()=>play('start','round-start',.5),420);break;
      case 'card-played':play(data.cut?'cut':files[data.cardType]?data.cardType:'play','play');break;
      case 'card-drawn':
        if(!dealing&&performance.now()-lastDraw>=85){lastDraw=performance.now();play('draw','draw',.65);}break;
      case 'penalty-resolved':
        if(data.amount>0)play(data.amount>=12?'penalty12':data.amount>=6?'penalty6':data.amount>=4?'penalty4':'penalty2','penalty');break;
      case 'round-result':stopAll();play(data.won?'win':'lose','result');break;
      case 'color-chosen':play('color','color');break;
      case 'deck-refilled':play('shuffle','shuffle',.65);break;
      // Reservado para um evento real futuro; nenhum lobby/Pronto é fabricado.
      case 'player-ready':play('ready','ready');break;
      case 'menu-open':play('open','ui');break;
      case 'menu-close':play('close','ui');break;
    }
  }
  function clock(state,now){
    const left=state.deadline-now;
    if(state.phase!=='playing'||!state.o.timeout||!state.deadline||left<=0||left>5000){clockKey=null;return;}
    const value=Math.ceil(left/1000),key=`${state.token}:${state.current}:${state.deadline}:${value}`;
    if(key!==clockKey){clockKey=key;play(value===1?'final':'tick','timer',.8);}
  }
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify({volume,muted}));}catch{}setGain();syncControls();}
  function setMuted(value){muted=!!value;if(muted)stopAll();persist();}
  function setVolume(value){if(!Number.isFinite(Number(value)))return;volume=Math.max(0,Math.min(1,Number(value)));if(volume===0)stopAll();persist();}
  function syncControls(){document.querySelectorAll('[data-sfx-mute]').forEach(e=>{e.checked=muted;});document.querySelectorAll('[data-sfx-volume]').forEach(e=>{e.value=String(Math.round(volume*100));});document.querySelectorAll('[data-sfx-value]').forEach(e=>{e.textContent=Math.round(volume*100)+'%';});}
  function controls(parent,suffix){
    const panel=document.createElement('fieldset');panel.className='sound-controls';panel.innerHTML=`<legend>Efeitos sonoros</legend><label><span>Silenciar</span><input type="checkbox" data-sfx-mute aria-label="Silenciar efeitos sonoros"></label><label for="soundVolume-${suffix}">Volume <output data-sfx-value></output></label><input id="soundVolume-${suffix}" type="range" min="0" max="100" step="5" data-sfx-volume aria-label="Volume dos efeitos sonoros">`;
    panel.querySelector('[data-sfx-mute]').addEventListener('change',e=>setMuted(e.target.checked));panel.querySelector('[data-sfx-volume]').addEventListener('input',e=>setVolume(Number(e.target.value)/100));parent.append(panel);
  }
  const settings=document.createElement('details');settings.id='soundSettings';settings.className='sound-settings';
  const summary=document.createElement('summary');summary.textContent='⚙';summary.setAttribute('aria-label','Configurações');summary.title='Configurações';settings.append(summary);controls(settings,'menu');document.body.append(settings);
  controls(document.querySelector('.table-menu-panel'),'mesa');syncControls();
  function closeSettings(){if(!settings.open)return false;settings.open=false;return true;}
  document.addEventListener('pointerdown',e=>{unlock();if(settings.open&&!settings.contains(e.target))closeSettings();},{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(!e.repeat)unlock();},{capture:true});
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled||button.matches('[data-card]')||button.closest('.ingredient-button')||button.id==='buyBtn')return;
    // Som da ação real substitui o clique nos controles com efeito próprio.
    if(['unoBtn','reportBtn','challengeBtn','nextRound','newMatch','tableMenuBtn','closeTableMenu'].includes(button.id)||button.hasAttribute('data-color'))return;
    play(['startBtn','profileContinueBtn','confirmLeaveBtn'].includes(button.id)?'confirm':'click','ui-click');
  });
  document.addEventListener('panelinha:ultima-carta-confirmada',e=>{const data=e.detail;if(!data?.id||announcements.has(data.id))return;announcements.add(data.id);if(announcements.size>128)announcements.delete(announcements.values().next().value);play('last','announcement');});
  function navigate(next){
    closeSettings();if(next===route)return;
    if(route==='game'&&next!=='game')stopAll();
    else if(next!=='game')voices.forEach(v=>{if(v.channel==='ui')stopVoice(v);});
    if(route!==null&&next!=='game')event(['home','profile','multiplayer'].includes(next)?'menu-close':'menu-open');route=next;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAll();context?.suspend().catch(()=>{});}else if(unlocked)context?.resume().catch(()=>{});});
  addEventListener('pagehide',stopAll);
  window.PanelinhaSFX={event,clock,navigate,closeSettings,setMuted,setVolume,stopAll,
    get status(){return {unlocked,muted,volume,voices:voices.size,loaded:[...buffers.keys()],errors:[...errors]};}};
})();
