/* Apresentação da mesa: só lê o estado recebido, sem ações ou temporizadores de jogo. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const colorNames = { red:'Vermelho', blue:'Azul', yellow:'Amarelo', green:'Verde' };
  const avatarColors = ['#c6a1fa', '#f0a783', '#91d7c5', '#9dbef5'];
  let previous = null;
  let cueOwner=null,cueRound=null,wasHumanTurn=false,cueAnimation=null,cueLayoutFrame=null;
  let snapshot = null, pendingPlay = null;
  let displayedTop = null;
  const flights = new Set();
  let pendingDraws = [], handLayout = null, nativePlaying = null, clockKey = null;
  const drawingIds = new Set();
  let discardTrail=[],trailState=null,trailRound=null,visualSequence=0;
  function nativeTable(playing) {
    if (nativePlaying === playing) return;
    nativePlaying = playing;
    window.PanelinhaWindow?.setPlaying({playing}).catch(() => {});
  }
  // WebViews antigos ignoram overflow:clip. Foco/toque não deve deslocar a mesa;
  // as mãos e o menu conservam seus próprios contêineres de rolagem.
  $('table').addEventListener('scroll', () => {
    if ($('table').scrollLeft) $('table').scrollLeft = 0;
    if ($('table').scrollTop) $('table').scrollTop = 0;
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stopDirectionAnimation = () => $('directionGlyph').getAnimations().forEach(animation => animation.cancel());
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) {stopDirectionAnimation();clearFlights();} });

  // Avatar provisório de panela sem rosto, independente das artes oficiais das cartas.
  function panAvatar(id = 0) {
    const accessory = [
      '<path d="M24 12l-4-7 9 3 7-6 6 6 9-3-4 7" fill="#ffdb86" stroke="#62442e" stroke-width="2"/>',
      '<path d="M22 8q14-13 28 0l-5 3H27z" fill="#fff1df"/>',
      '<path d="M21 9l7-6 8 5 8-5 7 6" fill="none" stroke="#ffdc93" stroke-width="4"/>',
      '<path d="M25 11V4h22v7m-26 0h30" fill="#392443" stroke="#d5baee" stroke-width="2"/>'
    ][id];
    return `<span class="pan-avatar" style="--avatar-color:${avatarColors[id]}" aria-hidden="true"><svg viewBox="0 0 72 58" fill="none"><path d="M15 24H5v10h12m40-10h10v10H55" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 23h40l-3 24q-17 10-34 0z" fill="currentColor" stroke="#201326" stroke-width="2"/><path d="M23 28v15" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/><path d="M13 23q23-18 46 0z" fill="currentColor" stroke="#201326" stroke-width="2"/><path d="M31 13h10" stroke="#f5e4ff" stroke-width="4" stroke-linecap="round"/>${accessory}</svg></span>`;
  }

  // Elementos persistentes por assento/cartas: turnos não recriam mãos.
  const seatRecords=new WeakMap(),opponentLayouts=new WeakMap();
  function attr(node,name,value){if(node.getAttribute(name)!==String(value))node.setAttribute(name,String(value));}
  function renderSeat(state,id,name,format){
    const seat=$(`player${id}`),player=state.players[id];let record=seatRecords.get(seat);
    if(!record||record.owner!==state){
      seat.textContent='';
      const identity=id===0?seat:document.createElement('div');if(id!==0){identity.className='seat-identity';seat.append(identity);}
      const avatar=document.createElement('div');avatar.innerHTML=id===0?PanelinhaProfile.avatarHTML(state.identity?.avatar):panAvatar(id);identity.append(avatar.firstElementChild);
      const label=document.createElement('div');label.className='name';const text=document.createTextNode('');label.append(text);
      const team=document.createElement('span');team.className='tag';label.append(team);identity.append(label);
      const count=document.createElement('div');count.className='sub';identity.append(count);
      const area=id===0?null:document.createElement('div');if(area)seat.append(area);
      record={owner:state,text,label,team,count,area,cards:new Map()};seatRecords.set(seat,record);
    }
    if(record.text.parentNode!==record.label||record.team.parentNode!==record.label){record.label.textContent='';record.label.append(record.text,record.team);}
    const active=state.phase==='playing'&&state.current===id;seat.classList.toggle('active',active);
    const label=name+(active?' ⏳':'')+(state.o.duo?' ':'');if(record.text.data!==label)record.text.data=label;
    attr(record.label,'title',name);record.team.hidden=!state.o.duo;
    const team=id%2?'B':'A';if(record.team.textContent!==team)record.team.textContent=team;
    const count=`${player.hand.length} cartas${id===0?'':' · bot'}`;if(record.count.textContent!==count)record.count.textContent=count;
    if(!record.area)return;
    const show=state.reveal||(state.o.duo&&id===2),area=record.area;
    let changed=false;
    area.classList.toggle('subhand',!!show);area.classList.toggle('back',!show);
    if(!show)attr(area,'aria-hidden','true');else if(area.hasAttribute('aria-hidden'))area.removeAttribute('aria-hidden');
    const ids=new Set(player.hand.map(c=>c.id));
    for(const [key,node] of record.cards)if(!ids.has(key)){node.remove();record.cards.delete(key);changed=true;}
    player.hand.forEach((card,i)=>{
      const view=show?format(card,true):'back';let node=record.cards.get(card.id);
      if(!node||node._cardView!==view){
        const holder=document.createElement('div');holder.innerHTML=show?view:'<span class="hidden-card"></span>';
        changed=true;const next=holder.firstElementChild;next.dataset.handCard=String(card.id);next._cardView=view;
        if(node)node.replaceWith(next);node=next;record.cards.set(card.id,node);
      }
      if(area.children[i]!==node){area.insertBefore(node,area.children[i]||null);changed=true;}
    });
    if(changed)opponentLayouts.delete(area);
  }

  // Organização visual: os botões permanecem filhos do mesmo leque e conservam IDs.
  let expandedColor=null,handPinned=false,hoverTimer=null,leaveTimer=null,handOwner=null,handRound=null,handScrollFrame=null,handLayoutVersion=0;
  function cancelHandTimers(){cancelAnimationFrame(handScrollFrame);clearTimeout(hoverTimer);clearTimeout(leaveTimer);hoverTimer=leaveTimer=null;}
  function layoutHand(savedScroll,instant=true,focusId=null){
    cancelAnimationFrame(handScrollFrame);const version=++handLayoutVersion;
    const hand=$('hand'),cards=[...hand.children],n=cards.length;
    hand.classList.toggle('layout-instant',instant);
    if(!n){hand.classList.remove('grouped-hand','hand-overflow','scroll-hand');expandedColor=null;delete hand.dataset.expandedColor;return;}
    const style=getComputedStyle(hand),width=parseFloat(getComputedStyle(cards[0]).width);
    const room=hand.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const normalStep=n<2?width:Math.min(width*.60,Math.max(0,(room-width-10)/(n-1)));
    const compact=n>1&&(normalStep<Math.max(22,width*.34)||(n>(innerWidth<360?7:9)&&normalStep<width*.42));
    if(!compact||!cards.some(c=>c.dataset.handColor===expandedColor)){expandedColor=null;handPinned=false;}
    hand.classList.toggle('grouped-hand',compact);hand.classList.toggle('scroll-hand',compact);
    if(expandedColor)hand.dataset.expandedColor=expandedColor;else delete hand.dataset.expandedColor;
    let steps=Array(n).fill(normalStep);
    if(compact){
      if(!expandedColor){steps.fill(Math.max(0,(room-width-24)/(n-1)));}
      else{
        const edges=cards.slice(0,-1).filter(c=>c.dataset.handColor===expandedColor).length;
        const context=n-1-edges,reserve=Math.min(room*.22,context*8);
        const small=context?reserve/context:0;
        const fit=edges?(room-width-24-reserve)/edges:width*.6;
        const large=Math.max(Math.min(30,width*.38),Math.min(width*.62,fit));
        steps=cards.map((c,i)=>i&&cards[i-1].dataset.handColor===expandedColor?large:small);
      }
    }
    const positions=[0];for(let i=1;i<n;i++)positions[i]=positions[i-1]+steps[i];
    const total=positions[n-1]+width,overflow=total>room+1;
    hand.classList.toggle('hand-overflow',overflow);
    cards.forEach((card,i)=>{
      if(card.dataset.ruleDisabled===undefined){card.dataset.ruleDisabled=String(card.disabled);card.dataset.ruleLabel=card.getAttribute('aria-label')||'';}
      const selected=compact&&card.dataset.handColor===expandedColor;
      card.disabled=compact?false:card.dataset.ruleDisabled==='true';
      card.setAttribute('aria-disabled',String(selected&&handPinned?card.dataset.ruleDisabled==='true':!compact&&card.disabled));
      card.setAttribute('aria-label',compact&&!selected?`${card.dataset.ruleLabel} · Expandir ${colorNames[card.dataset.handColor]||'cartas sem cor fixa'}`:card.dataset.ruleLabel);
      card.classList.toggle('group-expanded',selected);
      card.style.marginLeft=i?`${steps[i]-width}px`:'0px';
      const position=n<2?0:(i/(n-1)-.5)*2;
      card.style.setProperty('--fan-angle',`${position*(compact?3:6)}deg`);
      card.style.setProperty('--fan-lift',`${position*position*(compact?3:6)+(selected?-8:0)}px`);
    });
    // Somente uma cor excepcionalmente grande usa a rolagem interna da mão.
    if(overflow){
      const focus=cards.findIndex(c=>c.dataset.card===String(focusId));
      if(focus>=0)hand.scrollLeft=positions[focus]+width/2-room/2;
      else if(savedScroll!==undefined&&handLayout?.color===expandedColor)hand.scrollLeft=savedScroll;
      else{
        const active=cards.map((c,i)=>c.dataset.handColor===expandedColor?i:-1).filter(i=>i>=0);
        const midpoint=active.length?(positions[active[0]]+positions[active[active.length-1]]+width)/2:total/2;
        hand.scrollLeft=midpoint-room/2;
      }
    }else hand.scrollLeft=0;
    if(overflow&&!instant){
      const anchor=cards.find(c=>c.dataset.card===String(focusId))||cards.find(c=>c.dataset.handColor===expandedColor);
      const align=()=>{if(!anchor||version!==handLayoutVersion)return;const a=anchor.getBoundingClientRect(),b=hand.getBoundingClientRect();hand.scrollLeft+=(a.left+a.width/2)-(b.left+b.width/2);};
      let frames=0;const follow=()=>{if(version!==handLayoutVersion)return;align();if(++frames<18)handScrollFrame=requestAnimationFrame(follow);};follow();
      Promise.all(cards.flatMap(c=>c.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))).then(()=>{if(version===handLayoutVersion){cancelAnimationFrame(handScrollFrame);align();}});
    }
    handLayout={count:n,overflow,compact,color:expandedColor};
    hand.setAttribute('aria-label',compact?'Suas cartas em um leque contínuo. Toque uma cor para expandir e depois escolha a carta. Deslize a mão se necessário.':'Suas cartas');
    if(instant){hand.getBoundingClientRect();requestAnimationFrame(()=>hand.classList.remove('layout-instant'));}
    followTurnCue(!instant);
  }
  function openHandGroup(color,pinned,focusId=null){
    cancelHandTimers();expandedColor=color;handPinned=pinned;layoutHand(undefined,false,focusId);
  }
  function closeHandGroup(){
    cancelHandTimers();if(!expandedColor)return;expandedColor=null;handPinned=false;layoutHand(undefined,false);
  }
  const hand=$('hand');
  hand.addEventListener('click',event=>{
    if(!hand.classList.contains('grouped-hand'))return;
    const card=event.target.closest('[data-card]');if(!card){closeHandGroup();return;}
    // A faca continua acessível de imediato, inclusive durante a janela de corte.
    if(event.target.closest('.cut-bubble'))return;
    if(expandedColor!==card.dataset.handColor||!handPinned){
      event.preventDefault();event.stopImmediatePropagation();openHandGroup(card.dataset.handColor,true,card.dataset.card);return;
    }
    if(card.dataset.ruleDisabled==='true'){event.preventDefault();event.stopImmediatePropagation();$('message').textContent='Esta carta não pode ser jogada agora.';}
  },true);
  let lastPointer=null;
  hand.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||event.buttons||!matchMedia('(hover:hover)').matches||!hand.classList.contains('grouped-hand'))return;
    if(lastPointer&&Math.hypot(event.clientX-lastPointer.x,event.clientY-lastPointer.y)<5)return;
    lastPointer={x:event.clientX,y:event.clientY};
    clearTimeout(leaveTimer);clearTimeout(hoverTimer);const card=event.target.closest('[data-card]');
    if(!card||handPinned||card.dataset.handColor===expandedColor)return;
    const color=card.dataset.handColor,id=card.dataset.card;
    hoverTimer=setTimeout(()=>{if(!handPinned&&hand.contains(card))openHandGroup(color,false,id)},180);
  });
  hand.addEventListener('pointerenter',()=>{lastPointer=null;clearTimeout(leaveTimer)});
  hand.addEventListener('pointerleave',()=>{
    clearTimeout(hoverTimer);if(!handPinned)leaveTimer=setTimeout(()=>closeHandGroup(),500);
  });
  document.addEventListener('pointerdown',event=>{if(!hand.contains(event.target))closeHandGroup()},true);
  document.addEventListener('click',event=>{if(!hand.contains(event.target))closeHandGroup()},true);
  hand.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeHandGroup()}});
  function fan(container,largeAt,savedScroll){
    if(container.id==='hand'){layoutHand(savedScroll);return;}
    const cards=[...container.children],n=cards.length;if(!n)return;
    const sidePortrait=innerHeight>innerWidth&&container.closest('.seat.left,.seat.right');
    const style=getComputedStyle(container),room=container.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const width=parseFloat(getComputedStyle(cards[0]).width);
    const layoutKey=`${room}:${width}:${!!sidePortrait}:${cards.map(c=>c.dataset.handCard).join(',')}`;
    if(opponentLayouts.get(container)===layoutKey)return;opponentLayouts.set(container,layoutKey);
    const step=n<2?width:Math.min(width*.60,Math.max(0,(room-width-(sidePortrait?12:Math.max(22,width*.7)))/(n-1)));
    cards.forEach((card,i)=>{
      const position=n<2?0:(i/(n-1)-.5)*2;
      card.style.marginLeft=i?`${step-width}px`:'0px';
      card.style.setProperty('--fan-angle',`${position*(sidePortrait?3:8)}deg`);
      card.style.setProperty('--fan-lift',`${position*position*3}px`);
    });
  }

  function discardPose(id) {
    return {x:(id*17%9)-4,y:(id*13%5)-2,angle:(id*37%11)-5};
  }
  function discardHTML(cards,format,state) {
    const entry=card=>({card,key:++visualSequence,pose:discardPose(card.id+visualSequence*11)});
    const latest=cards[cards.length-1],old=discardTrail[discardTrail.length-1];
    if(trailState!==state||trailRound!==state.round){discardTrail=cards.slice(-3).map(entry);trailState=state;trailRound=state.round;}
    else if(latest?.id!==old?.card.id){
      const previousIndex=cards.findIndex(card=>card.id===old?.card.id);
      discardTrail=previousIndex<0?cards.slice(-3).map(entry):[...discardTrail,...cards.slice(previousIndex+1).map(entry)].slice(-3);
    }
    return [...discardTrail].reverse().map(({card,key,pose},i)=>{
      const x=pose.x-i*9,y=pose.y+i*4,angle=pose.angle-i*4.5;
      return `<div class="discard-layer ${i?'discard-under':'discard-top'}" data-discard-id="${card.id}" data-visual-key="${key}" style="z-index:${3-i};transform:translate(${x}px,${y}px) rotate(${angle}deg)">${format(card)}</div>`;
    }).join('');
  }
  function maskCards() {
    const playing=new Set([...flights].filter(f=>f.kind==='play').map(f=>f.key));
    document.querySelectorAll('.discard-layer').forEach(node=>node.classList.toggle('in-flight',playing.has(Number(node.dataset.visualKey))));
    $('discard').classList.toggle('receiving-card',playing.has(Number($('discard').querySelector('.discard-top')?.dataset.visualKey)));
    document.querySelectorAll('[data-card],[data-hand-card]').forEach(node=>node.classList.toggle('drawing-card',drawingIds.has(Number(node.dataset.card||node.dataset.handCard))));
  }
  function handPoint(actor,id,target=false) {
    const seat=$(`player${actor}`),area=actor===0?$('hand'):(seat.querySelector('.subhand,.back')||seat);
    let node=actor===0?area.querySelector(`[data-card="${id}"]`):area.querySelector(`[data-hand-card="${id}"]`);
    node=node||area.lastElementChild||area;
    const angle=(area===node?0:rotation(area))+rotation(node);
    if(actor===0)node=node.querySelector('.card')||node;
    const r=node.getBoundingClientRect(),clip=area.getBoundingClientRect();
    const matrix=actor===0?getComputedStyle(area).transform.match(/^matrix\(([^)]+)\)$/):null;
    const values=matrix?matrix[1].split(',').map(Number):[1,0];
    const actualScale=Math.hypot(values[0],values[1])||1;
    const scale=target&&actor===0?Number(area.dataset.turnScale)||1:actualScale;
    const adjust=scale/actualScale,anchorX=clip.x+clip.width/2,anchorY=clip.bottom;
    const centerX=anchorX+(r.x+r.width/2-anchorX)*adjust,centerY=anchorY+(r.y+r.height/2-anchorY)*adjust;
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    return {x:clamp(centerX,Math.max(0,clip.left),Math.min(innerWidth,clip.right)),y:clamp(centerY,Math.max(0,clip.top),Math.min(innerHeight,clip.bottom)),width:(node.offsetWidth||r.width)*scale,height:(node.offsetHeight||r.height)*scale,angle,node};
  }
  function recordDraw(state,actor,card) {
    if(!snapshot||snapshot.state!==state||snapshot.round!==state.round||reducedMotion.matches)return;
    const r=$('pile').getBoundingClientRect();
    if(!r.width||!r.height)return;
    pendingDraws.push({actor,id:card.id,x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height});
  }
  function animateDraws(events,state) {
    if(!events.length||reducedMotion.matches||typeof $('pile').animate!=='function')return new Map();
    const count=events.length,ends=new Map();let elapsed=0;
    const intervals=events.map((_,i)=>8+84*Math.pow(.91,i));
    const factor=Math.min(1,1400/intervals.reduce((a,b)=>a+b,0));
    events.forEach((event,i)=>{
      const delay=elapsed;elapsed+=intervals[i]*factor;
      const duration=Math.max(240,420-count*1.6);
      const end=handPoint(event.actor,event.id,true),present=state.players[event.actor].hand.some(c=>c.id===event.id);
      if(!end.width||!end.height)return;
      const face=event.actor===0||state.reveal||(state.o.duo&&event.actor===2);
      const sprite=document.createElement('div');sprite.className='drawn-card flying-card';
      Object.assign(sprite.dataset,{actor:String(event.actor),cardId:String(event.id),sequence:String(i),delay:String(delay),duration:String(duration)});
      Object.assign(sprite.style,{left:`${event.x-event.width/2}px`,top:`${event.y-event.height/2}px`,width:`${event.width}px`,height:`${event.height}px`});
      const back=document.createElement('span');back.className='card deck-back';sprite.append(back);
      if(face&&present){const card=end.node.matches('.card')?end.node:end.node.querySelector('.card');if(card){const front=document.createElement('div');front.className='flight-front';front.append(card.cloneNode(true));sprite.append(front);front.animate([{opacity:0},{offset:.4,opacity:0},{opacity:1}],{duration,delay,fill:'both'});}}
      $('playAnimations').append(sprite);if(present)drawingIds.add(event.id);
      const dx=end.x-event.x,dy=end.y-event.y,sx=end.width/event.width,sy=end.height/event.height;
      const animation=sprite.animate([{opacity:0,transform:'translate(0,0) scale(.96)'},{offset:.08,opacity:1,transform:'translate(0,-4px) scale(1)'},{offset:.87,opacity:1,transform:`translate(${dx}px,${dy}px) rotate(${end.angle}deg) scale(${sx*1.035},${sy*1.035})`},{opacity:1,transform:`translate(${dx}px,${dy}px) rotate(${end.angle}deg) scale(${sx},${sy})`}],{duration,delay,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'});
      const flight={node:sprite,animation,kind:'draw',id:event.id};flights.add(flight);ends.set(event.id,delay+duration);
      animation.onfinish=()=>{sprite.remove();flights.delete(flight);drawingIds.delete(event.id);maskCards();};
    });
    maskCards();return ends;
  }
  function updateClock(state,now=Date.now()) {
    const remaining=state.deadline-now;
    let badge=$('turnClock');
    if(!badge){badge=document.createElement('span');badge.id='turnClock';badge.className='turn-clock';badge.setAttribute('role','timer');$('table').append(badge);}
    const visible=state.phase==='playing'&&state.o.timeout&&state.deadline&&remaining>0&&remaining<=5000;
    badge.hidden=!visible;
    if(!visible){badge.textContent='';badge.removeAttribute('data-actor');clockKey=null;return;}
    const value=Math.ceil(remaining/1000);
    badge.dataset.actor=String(state.current);
    badge.textContent=String(value);badge.setAttribute('aria-label',`${value} segundos restantes no turno`);
    const key=`${state.token}:${state.current}:${value}`;
    if(key!==clockKey&&!reducedMotion.matches)badge.animate([{transform:'translateY(-50%) scale(1.12)'},{transform:'translateY(-50%) scale(1)'}],{duration:180,easing:'ease-out'});
    clockKey=key;
  }

  function animateBlock(play,delay) {
    if(play.blocked===null||reducedMotion.matches)return;
    const seat=$(`player${play.blocked}`),r=seat.getBoundingClientRect(),cx=innerWidth/2,cy=parseFloat($('table').style.getPropertyValue('--burner-y'));
    const tx=r.x+r.width/2,ty=r.y+r.height/2;
    const effect=document.createElement('div');effect.className='block-effect';effect.dataset.blocked=String(play.blocked);
    effect.innerHTML=`<svg viewBox="0 0 ${innerWidth} ${innerHeight}" width="100%" height="100%"><defs><marker id="blockArrow-${play.id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#ffe4a0"/></marker></defs><line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="#ffe4a0" stroke-width="3" stroke-dasharray="7 4" marker-end="url(#blockArrow-${play.id})"/></svg><span style="left:${cx}px;top:${cy}px">⊘</span>`;
    $('playAnimations').append(effect);
    const animation=effect.animate([{opacity:0},{offset:.22,opacity:1},{offset:.75,opacity:1},{opacity:0}],{duration:850,delay,fill:'both'});
    const flight={node:effect,animation,kind:'effect'};flights.add(flight);
    animation.onfinish=()=>{effect.remove();flights.delete(flight);};
    (seat.querySelector('.seat-identity')||seat).animate([{filter:'brightness(1)'},{offset:.35,filter:'brightness(1.8)',color:'#ffbe9b'},{filter:'brightness(1)'}],{duration:700,delay,easing:'ease-out'});
  }

  function clearFlights() {
    pendingPlay = null;pendingDraws=[];drawingIds.clear();
    for (const flight of flights) { flight.animation.cancel(); flight.node.remove(); }
    flights.clear();
    $('discard').classList.remove('receiving-card');maskCards();
  }

  function rotation(node) {
    if (!node) return 0;
    const match = getComputedStyle(node).transform.match(/^matrix\(([^)]+)\)$/);
    if (!match) return 0;
    const [a,b] = match[1].split(',').map(Number);
    return Math.atan2(b,a) * 180 / Math.PI;
  }

  // Chamado antes de o render existente substituir a mão: lê geometria, não regras.
  function beforeRender(state) {
    pendingPlay = null;
    const card = state.discard[state.discard.length - 1];
    if (!snapshot || snapshot.state !== state || snapshot.round !== state.round ||
        snapshot.art !== $('useCardArt').checked || reducedMotion.matches) {
      clearFlights(); return;
    }
    if (!card || card.id === snapshot.top) return;
    const appended = state.discard.slice(0,-1).some(c => c.id === snapshot.top);
    const actor = state.lastActor;
    if (!appended || !Number.isInteger(actor) || actor < 0 || actor > 3) {
      clearFlights(); return;
    }
    const point=handPoint(actor,card.id),hidden=actor!==0&&!$(`player${actor}`).querySelector('.subhand');
    if(!point.width||!point.height)return;
    let blocked=null;
    const repeated=snapshot.lastActor===actor&&snapshot.topCard?.type===card.type&&snapshot.topCard?.color===card.color&&snapshot.topCard?.num===card.num;
    if(card.type==='skip'&&!repeated){let id=actor;for(let n=0;n<4;n++){id=(id+state.direction+4)%4;if(state.players[id].hand.length){blocked=id;break;}}}
    pendingPlay={id:card.id,actor,...point,hidden,back:hidden?point.node.cloneNode(true):null,blocked};
  }

  function animatePlay(play,delay=0) {
    // Se o humano joga antes de a compra pousar, continua do ponto visual atual.
    // No fluxo bot compra+jogada do mesmo render, o voo de saída aguarda só a
    // cópia visual da compra; o motor e a janela de corte continuam independentes.
    if(!delay)for(const flight of [...flights])if(flight.kind==='draw'&&flight.id===play.id){
      const r=flight.node.getBoundingClientRect();
      Object.assign(play,{x:r.x+r.width/2,y:r.y+r.height/2,width:flight.node.offsetWidth,height:flight.node.offsetHeight,angle:rotation(flight.node)});
      flight.animation.cancel();flight.node.remove();flights.delete(flight);drawingIds.delete(play.id);
    }
    const target=$('discard').querySelector('.discard-top');
    if(!target||reducedMotion.matches||typeof target.animate!=='function')return;
    const card=target.querySelector('.card'),r=card.getBoundingClientRect();
    if(!r.width||!r.height||!play.width||!play.height)return;
    const tx=r.x+r.width/2,ty=r.y+r.height/2;
    const dx=tx-play.x,dy=ty-play.y,sx=card.offsetWidth/play.width,sy=card.offsetHeight/play.height;
    const key=Number(target.dataset.visualKey),angle=rotation(target),arc=Math.min(46,Math.hypot(dx,dy)*.12),duration=540;
    const sprite=document.createElement('div');sprite.className='played-card flying-card';
    Object.assign(sprite.style,{left:`${play.x-play.width/2}px`,top:`${play.y-play.height/2}px`,width:`${play.width}px`,height:`${play.height}px`});
    Object.assign(sprite.dataset,{actor:String(play.actor),cardId:String(play.id),originX:String(play.x),originY:String(play.y),targetX:String(tx),targetY:String(ty)});
    const front=document.createElement('div');front.className='flight-front';front.append(card.cloneNode(true));front.querySelectorAll('img').forEach(img=>img.loading='eager');sprite.append(front);
    if(play.hidden&&play.back){const back=document.createElement('div');back.className='flight-back';back.append(play.back);sprite.append(back);back.animate([{opacity:1},{offset:.3,opacity:1},{offset:.6,opacity:0},{opacity:0}],{duration,delay,fill:'both'});front.animate([{opacity:0},{offset:.3,opacity:0},{offset:.6,opacity:1},{opacity:1}],{duration,delay,fill:'both'});}
    $('playAnimations').append(sprite);
    const transform=(x,y,a,xs,ys,tilt=0)=>`perspective(700px) translate(${x}px,${y}px) rotate(${a}deg) rotateX(${tilt}deg) scale(${xs},${ys})`;
    const animation=sprite.animate([
      {opacity:0,transform:transform(0,0,play.angle,1,1)},
      {offset:.01,opacity:1,transform:transform(0,0,play.angle,1,1)},
      {offset:.16,opacity:1,transform:transform(dx*.07,dy*.07-arc*.5,play.angle+6,1.09,1.09,-9)},
      {offset:.72,opacity:1,transform:transform(dx*.88,dy*.88-arc*.4,angle+3,1+(sx-1)*.88,1+(sy-1)*.88,-4)},
      {opacity:1,transform:transform(dx,dy,angle,sx,sy)}
    ],{duration,delay,easing:'cubic-bezier(.22,.55,.25,1)',fill:'both'});
    const flight={node:sprite,animation,kind:'play',id:play.id,key};flights.add(flight);maskCards();
    animation.onfinish=()=>{
      sprite.remove();flights.delete(flight);maskCards();
      const landed=$('discard').querySelector(`[data-visual-key="${key}"] .card`);
      if(landed&&!reducedMotion.matches)landed.animate([{transform:'scale(1.035)'},{transform:'scale(1)'}],{duration:140,easing:'ease-out'});
    };
    animateBlock(play,delay+duration*.7);
  }

  function tableDirection(direction) {
    const table=$('table'),flows=[...document.querySelectorAll('.stove-flow')];
    const changed=table.dataset.direction&&table.dataset.direction!==String(direction);
    const phases=flows.map(el=>{const a=el.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity);return a?{elapsed:Number(a.currentTime)||0,duration:Number(a.effect.getTiming().duration)||7500}:null});
    table.dataset.direction=String(direction);
    // A mesma direção do motor orienta todas as camadas; espelha a fase ao inverter.
    if(changed&&!reducedMotion.matches)flows.forEach((el,i)=>{
      const a=el.getAnimations().find(a=>a.effect.getTiming().iterations===Infinity),p=phases[i];
      if(a&&p)a.currentTime=Math.floor(p.elapsed/p.duration)*p.duration+p.duration-p.elapsed%p.duration;
    });
  }

  function fitTopIdentity(){
    const identity=$('player2').querySelector('.seat-identity');
    if(identity)identity.classList.toggle('long-name',(identity.querySelector('.name')?.textContent.trim().length||0)>26);
  }

  function layout() {
    fitTopIdentity();
    const table = $('table');
    const width = table.clientWidth, height = table.clientHeight;
    if (!width || !height) return;
    // Cover uniforme: imagem e chamas ficam no mesmo plano nativo 1672 × 941.
    const scale = Math.max(width / 1672, height / 941);
    const x = (width - 1672 * scale) / 2, y = (height - 941 * scale) / 2;
    table.style.setProperty('--scene-scale', scale);
    table.style.setProperty('--scene-x', `${x}px`);
    table.style.setProperty('--scene-y', `${y}px`);
    table.style.setProperty('--burner-y', `${y + 451 * scale}px`);
    const pileWidth=Math.max(44,$('buyBtn').offsetWidth),pileHeight=$('buyBtn').offsetHeight;
    const safeLeft=parseFloat(getComputedStyle(table).getPropertyValue('--pile-safe-left'))||14;
    const nativeX=x+500*scale;
    const px=Math.max(safeLeft+pileWidth/2,Math.min(nativeX,width/2-100));
    const portrait=height>width;
    const py=portrait?y+451*scale-Math.max(88,($('hand').querySelector('.card')?.offsetWidth||50)*1.55):y+451*scale;
    table.style.setProperty('--pile-left',`${px-pileWidth/2}px`);
    table.style.setProperty('--pile-top',`${Math.max(pileHeight/2+12,py)}px`);
  }

  function closeMenu() {
    const wasOpen = !$('tableMenu').classList.contains('hide');
    $('tableMenu').classList.add('hide');
    $('tableMenuBtn').setAttribute('aria-expanded', 'false');
    if (wasOpen) $('tableMenuBtn').focus({preventScroll:true});
  }
  $('tableMenuBtn').onclick = () => {
    $('tableMenu').classList.remove('hide');
    $('tableMenuBtn').setAttribute('aria-expanded', 'true');
    $('closeTableMenu').focus({preventScroll:true});
  };
  $('closeTableMenu').onclick = closeMenu;
  $('tableMenu').onclick = event => { if (event.target === $('tableMenu')) closeMenu(); };
  $('tableMenu').addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
    if (event.key !== 'Tab') return;
    const focusable = [...$('tableMenu').querySelectorAll('button,select,input,summary,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first=focusable[0], last=focusable[focusable.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });

  function render(state, savedScroll, {mustBuy=false}={}) {
    nativeTable(true);
    if(handOwner!==state||handRound!==state.round){cancelHandTimers();expandedColor=null;handPinned=false;handLayout=null;handOwner=state;handRound=state.round;}
    document.body.classList.add('playing');
    const humanTurn=state.phase==='playing'&&state.current===0&&Date.now()>=state.unlockAt;
    $('hand').dataset.turnScale=humanTurn?'1.06':'1';
    $('hand').classList.toggle('human-turn',humanTurn);
    $('buyBtn').classList.toggle('mandatory-buy',mustBuy);
    $('buyBtn').setAttribute('data-mandatory',String(mustBuy));
    const cue=$('turnCue'),newTurn=cueOwner!==state||cueRound!==state.round||!wasHumanTurn;
    cue.hidden=!humanTurn;
    if(humanTurn&&newTurn){cueAnimation?.cancel();cue.innerHTML='<span>SUA VEZ!</span>';if(!reducedMotion.matches)cueAnimation=cue.firstElementChild.animate([{opacity:0,transform:'translateY(6px) scale(.82)'},{offset:.15,opacity:1,transform:'scale(1.08)'},{offset:.65,opacity:1,transform:'scale(1)'},{opacity:.85,transform:'scale(.82)'}],{duration:1400,easing:'ease-out',fill:'forwards'});}
    if(!humanTurn){cueAnimation?.cancel();cueAnimation=null;}
    cueOwner=state;cueRound=state.round;wasHumanTurn=humanTurn;
    const center = document.querySelector('.center');
    $('table').dataset.activeColor = state.activeColor || '';
    $('table').dataset.phase = state.phase;
    tableDirection(state.direction);
    const heat=Math.min(1,Math.log1p(Math.max(0,state.penalty))/Math.log(21));
    $('burner').style.setProperty('--heat-scale',String(1+heat*.16));
    $('burner').style.setProperty('--heat-opacity',String(.74+heat*.18));
    $('burner').style.setProperty('--heat-brightness',String(1+heat*.24));
    $('table').dataset.penalty=String(state.penalty);
    $('table').setAttribute('aria-label', `Mesa de jogo · ${state.activeColor ? colorNames[state.activeColor] : 'sem cor ativa'}`);
    layout();
    center.dataset.activeColor = state.activeColor;
    $('burner').setAttribute('aria-label', `Boca do fogão · cor ativa: ${colorNames[state.activeColor] || 'nenhuma'}`);
    const penalty = $('penaltyDisplay');
    penalty.hidden = !state.penalty;
    penalty.textContent = state.penalty ? `+${state.penalty}` : '';
    penalty.setAttribute('aria-label', `Penalidade acumulada: ${state.penalty} cartas`);

    const clockwise = state.direction === -1; // 0 embaixo → 1 direita → 2 cima → 3 esquerda é anti-horário.
    $('directionGlyph').textContent = clockwise ? '↻' : '↺';
    $('directionLabel').textContent = clockwise ? 'Horário' : 'Anti-horário';
    $('directionIndicator').setAttribute('aria-label', `Sentido ${clockwise ? 'horário' : 'anti-horário'}`);
    if (reducedMotion.matches) stopDirectionAnimation();
    if (previous && previous.state === state && previous.round === state.round && previous.direction !== state.direction && !reducedMotion.matches) {
      const glyph = $('directionGlyph');
      glyph.getAnimations().forEach(animation => animation.cancel());
      glyph.animate([
        { transform:'rotate(0deg) scale(1)', color:'#e5c9fa' },
        { offset:.5, transform:`rotate(${(clockwise?1:-1) * 180}deg) scale(1.5)`, color:'#ffe0a2' },
        { transform:`rotate(${(clockwise?1:-1) * 360}deg) scale(1)`, color:'#e5c9fa' }
      ], { duration:850, easing:'ease-in-out' });
    }
    previous = { state, round:state.round, direction:state.direction };

    if(!$('pile').children.length)$('pile').innerHTML = Array.from({length:5},(_,i)=>`<span class="pile-layer deck-back" aria-hidden="true" style="--depth:${5-i}"></span>`).join('')+'<div class="card deck-back"></div>';
    attr($('pile'),'aria-label','Monte de compra');
    document.querySelector('.draw-stack .stack-label').textContent = state.penalty ? `COMPRAR +${state.penalty}` : 'COMPRAR';
    for (const player of state.players) {
      const seat = $(`player${player.id}`);
      if(player.id===2)fitTopIdentity();
      attr(seat,'aria-label', `${player.id === 0 ? state.identity?.name||PanelinhaProfile.current.name : `Bot ${player.id}`}, ${player.hand.length} cartas${state.current === player.id && state.phase === 'playing' ? ', na vez' : ''}`);
      const back = seat.querySelector('.back');
      if (back) {
        fan(back,Infinity);
      }
      const subhand = seat.querySelector('.subhand');
      if (subhand) {
        fan(subhand,Infinity);
      }
    }
    fan($('hand'), innerWidth < 360 ? 7 : 9, savedScroll);
    positionTurnCue();
    const top=state.discard[state.discard.length-1];
    displayedTop=top?.id ?? null;
    const play=pendingPlay;pendingPlay=null;
    snapshot={state,round:state.round,top:displayedTop,art:$('useCardArt').checked,lastActor:state.lastActor,topCard:top,hands:state.players.map(p=>p.hand.map(c=>c.id))};
    const draws=pendingDraws;pendingDraws=[];
    const ends=animateDraws(draws,state);
    if(play&&play.id===displayedTop)animatePlay(play,ends.get(play.id)||0);
    maskCards();updateClock(state);
  }
  function followTurnCue(animated){
    cancelAnimationFrame(cueLayoutFrame);const until=performance.now()+(animated&&!reducedMotion.matches?260:0);
    const step=()=>{positionTurnCue();if(!$('turnCue').hidden&&performance.now()<until)cueLayoutFrame=requestAnimationFrame(step);};step();
  }
  function positionTurnCue(){
    const cue=$('turnCue');if(cue.hidden)return;
    const hand=$('hand'),r=hand.getBoundingClientRect(),table=$('table').getBoundingClientRect();
    const cards=[...hand.querySelectorAll('.card')];if(!cards.length){cue.hidden=true;return;}
    const match=getComputedStyle(hand).transform.match(/^matrix\(([^)]+)\)$/),scale=match?Math.hypot(...match[1].split(',').slice(0,2).map(Number)):1;
    const target=Number(hand.dataset.turnScale)||1;
    const top=Math.min(...cards.map(c=>{const b=c.getBoundingClientRect();return r.bottom-(r.bottom-b.top)*target/(scale||1)}));
    cue.style.left=`${r.x+r.width/2-table.x}px`;cue.style.top=`${top-table.y-cue.offsetHeight-3}px`;
  }
  addEventListener('resize', () => {
    clearFlights();
    layout();
    fan($('hand'), innerWidth < 360 ? 7 : 9);
    document.querySelectorAll('.subhand,.back').forEach(hand => fan(hand,Infinity));
    positionTurnCue();
  });
  nativeTable(false);
  window.PanelasMesa = { render, renderSeat, beforeRender, closeMenu, recordDraw, discardHTML, updateClock, reset:() => {cancelAnimationFrame(cueLayoutFrame);cueAnimation?.cancel();cueAnimation=null;cueOwner=null;cueRound=null;wasHumanTurn=false;$('turnCue').hidden=true;$('hand').classList.remove('human-turn');$('hand').dataset.turnScale='1';$('buyBtn').classList.remove('mandatory-buy');clearFlights();cancelHandTimers();expandedColor=null;handPinned=false;handOwner=null;handRound=null;handLayoutVersion++;nativeTable(false);if($('turnClock'))$('turnClock').hidden=true;handLayout=null;clockKey=null;discardTrail=[];trailState=null;trailRound=null;closeMenu();document.body.classList.remove('playing');previous=null;snapshot=null;displayedTop=null;} };
})();
