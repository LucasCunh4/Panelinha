/* Apresentação da mesa: só lê o estado recebido, sem ações ou temporizadores de jogo. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const colorNames = { red:'Vermelho', blue:'Azul', yellow:'Amarelo', green:'Verde' };
  const avatarColors = ['#c6a1fa', '#f0a783', '#91d7c5', '#9dbef5'];
  let previous = null;
  let snapshot = null, pendingPlay = null;
  let displayedTop = null;
  const flights = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stopDirectionAnimation = () => $('directionGlyph').getAnimations().forEach(animation => animation.cancel());
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) {stopDirectionAnimation();clearFlights();} });

  // Avatar provisório de panela sem rosto, reutilizado no verso das cartas.
  function panAvatar(id = 0) {
    const accessory = [
      '<path d="M24 12l-4-7 9 3 7-6 6 6 9-3-4 7" fill="#ffdb86" stroke="#62442e" stroke-width="2"/>',
      '<path d="M22 8q14-13 28 0l-5 3H27z" fill="#fff1df"/>',
      '<path d="M21 9l7-6 8 5 8-5 7 6" fill="none" stroke="#ffdc93" stroke-width="4"/>',
      '<path d="M25 11V4h22v7m-26 0h30" fill="#392443" stroke="#d5baee" stroke-width="2"/>'
    ][id];
    return `<span class="pan-avatar" style="--avatar-color:${avatarColors[id]}" aria-hidden="true"><svg viewBox="0 0 72 58" fill="none"><path d="M15 24H5v10h12m40-10h10v10H55" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 23h40l-3 24q-17 10-34 0z" fill="currentColor" stroke="#201326" stroke-width="2"/><path d="M23 28v15" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/><path d="M13 23q23-18 46 0z" fill="currentColor" stroke="#201326" stroke-width="2"/><path d="M31 13h10" stroke="#f5e4ff" stroke-width="4" stroke-linecap="round"/>${accessory}</svg></span>`;
  }

  function fan(container, largeAt) {
    const children = [...container.children];
    const scroll = children.length > largeAt;
    container.classList.toggle('scroll-hand', scroll);
    children.forEach((card, index) => {
      const position = children.length < 2 ? 0 : (index / (children.length - 1) - .5) * 2;
      card.style.setProperty('--fan-angle', `${scroll ? 0 : position * 7}deg`);
      card.style.setProperty('--fan-lift', `${scroll ? 0 : position * position * 7}px`);
    });
    // Se o leque não couber, mantenha todas as cartas alcançáveis pela rolagem.
    if (!scroll && container.scrollWidth > container.clientWidth + 1) {
      container.classList.add('scroll-hand');
      children.forEach(card => { card.style.setProperty('--fan-angle', '0deg'); card.style.setProperty('--fan-lift', '0px'); });
    }
  }

  function clearFlights() {
    pendingPlay = null;
    for (const flight of flights) { flight.animation.cancel(); flight.node.remove(); }
    flights.clear();
    $('discard').classList.remove('receiving-card');
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
    let node, area, angle = 0, hidden = false;
    if (actor === 0) {
      node = $('hand').querySelector(`[data-card="${card.id}"]`);
      area = $('hand');
      if (node) angle = rotation(node);
      node = node?.querySelector('.card') || node;
    } else {
      const seat = $(`player${actor}`), open = seat.querySelector('.subhand');
      const index = snapshot.hands[actor].indexOf(card.id);
      hidden = !open;
      area = open || seat.querySelector('.back') || seat;
      node = open && index >= 0 ? open.children[index] : area.lastElementChild;
      angle = (actor === 3 ? 90 : actor === 1 ? -90 : hidden ? 180 : 0) + rotation(node);
    }
    area = area || $(`player${actor}`);
    node = node || area;
    const r = node.getBoundingClientRect(), clip = area.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
    const x = clamp(r.x+r.width/2,Math.max(0,clip.left),Math.min(innerWidth,clip.right));
    const y = clamp(r.y+r.height/2,Math.max(0,clip.top),Math.min(innerHeight,clip.bottom));
    pendingPlay = {id:card.id,actor,x,y,width:node.offsetWidth || r.width,
      height:node.offsetHeight || r.height,angle,hidden,
      back: hidden ? node.cloneNode(true) : null};
  }

  function animatePlay(play) {
    const target = $('discard').firstElementChild;
    if (!target || reducedMotion.matches || typeof target.animate !== 'function') return;
    const r = target.getBoundingClientRect(), tx = r.x+r.width/2, ty = r.y+r.height/2;
    const dx = tx-play.x, dy = ty-play.y;
    const sx = target.offsetWidth/play.width, sy = target.offsetHeight/play.height;
    const arc = Math.min(54,Math.hypot(dx,dy)*.15);
    const sprite = document.createElement('div');
    sprite.className = 'played-card';
    Object.assign(sprite.style,{left:`${play.x-play.width/2}px`,top:`${play.y-play.height/2}px`,width:`${play.width}px`,height:`${play.height}px`});
    Object.assign(sprite.dataset,{actor:String(play.actor),cardId:String(play.id),originX:String(play.x),originY:String(play.y),targetX:String(tx),targetY:String(ty)});
    const front = document.createElement('div');front.className='flight-front';front.append(target.cloneNode(true));
    front.querySelectorAll('img').forEach(img=>{img.loading='eager';});
    sprite.append(front);
    if (play.hidden && play.back) {
      const back=document.createElement('div');back.className='flight-back';back.append(play.back);sprite.append(back);
      back.animate([{opacity:1},{offset:.35,opacity:1},{offset:.57,opacity:0},{opacity:0}],{duration:560,fill:'forwards'});
      front.animate([{opacity:0},{offset:.35,opacity:0},{offset:.57,opacity:1},{opacity:1}],{duration:560,fill:'forwards'});
    }
    $('playAnimations').append(sprite);
    $('discard').classList.add('receiving-card');
    const animation=sprite.animate([
      {transform:`translate(0px,0px) rotate(${play.angle}deg) scale(1)`},
      {offset:.55,transform:`translate(${dx*.55}px,${dy*.55-arc}px) rotate(${play.angle*.35}deg) scale(${1+(sx-1)*.55},${1+(sy-1)*.55})`},
      {transform:`translate(${dx}px,${dy}px) rotate(-3deg) scale(${sx},${sy})`}
    ],{duration:560,easing:'cubic-bezier(.22,.64,.25,1)',fill:'forwards'});
    const flight={node:sprite,animation};flights.add(flight);
    animation.onfinish=()=>{
      sprite.remove();flights.delete(flight);
      if(displayedTop===play.id){
        $('discard').classList.remove('receiving-card');
        const landed=$('discard').firstElementChild;
        if(landed&&!reducedMotion.matches)landed.animate([
          {transform:'rotate(-3deg) scale(1.035)'},{transform:'rotate(-3deg) scale(1)'}
        ],{duration:150,easing:'ease-out'});
      }
    };
  }

  function layout() {
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

  function render(state) {
    document.body.classList.add('playing');
    const center = document.querySelector('.center');
    $('table').dataset.activeColor = state.activeColor || '';
    $('table').dataset.phase = state.phase;
    $('table').setAttribute('aria-label', `Mesa de jogo · ${state.activeColor ? colorNames[state.activeColor] : 'sem cor ativa'}`);
    layout();
    $('turnCue').textContent = state.phase === 'playing' ? `Vez de ${state.current === 0 ? 'Você' : 'Bot ' + state.current}` : 'Rodada concluída';
    center.dataset.activeColor = state.activeColor;
    $('burner').setAttribute('aria-label', `Boca do fogão · cor ativa: ${colorNames[state.activeColor] || 'nenhuma'}`);
    const penalty = $('penaltyDisplay');
    penalty.hidden = !state.penalty;
    penalty.textContent = state.penalty ? `+${state.penalty}` : '';
    penalty.setAttribute('aria-label', `Penalidade acumulada: ${state.penalty} cartas`);

    const clockwise = state.direction === 1;
    $('directionGlyph').textContent = clockwise ? '↻' : '↺';
    $('directionLabel').textContent = clockwise ? 'Horário' : 'Anti-horário';
    $('directionIndicator').setAttribute('aria-label', `Sentido ${clockwise ? 'horário' : 'anti-horário'}`);
    if (reducedMotion.matches) stopDirectionAnimation();
    if (previous && previous.state === state && previous.round === state.round && previous.direction !== state.direction && !reducedMotion.matches) {
      const glyph = $('directionGlyph');
      glyph.getAnimations().forEach(animation => animation.cancel());
      glyph.animate([
        { transform:'rotate(0deg) scale(1)', color:'#e5c9fa' },
        { offset:.5, transform:`rotate(${state.direction * 180}deg) scale(1.5)`, color:'#ffe0a2' },
        { transform:`rotate(${state.direction * 360}deg) scale(1)`, color:'#e5c9fa' }
      ], { duration:850, easing:'ease-in-out' });
    }
    previous = { state, round:state.round, direction:state.direction };

    $('pile').innerHTML = `<div class="card deck-back">${panAvatar()}<span class="deck-brand">PANELAS</span><span class="deck-count">${state.deck.length}</span></div>`;
    $('pile').setAttribute('aria-label', `Monte de compra: ${state.deck.length} cartas`);
    document.querySelector('.draw-stack .stack-label').textContent = state.penalty ? `COMPRAR +${state.penalty}` : 'COMPRAR';
    for (const player of state.players) {
      const seat = $(`player${player.id}`);
      if (player.id === 0) {
        if (!seat.querySelector('.pan-avatar')) seat.insertAdjacentHTML('afterbegin',panAvatar(player.id));
      } else if (!seat.querySelector('.seat-identity')) {
        const identity=document.createElement('div');identity.className='seat-identity';
        identity.innerHTML=panAvatar(player.id);
        const name=seat.querySelector('.name'),sub=seat.querySelector('.sub');
        if(name)identity.append(name);if(sub)identity.append(sub);
        seat.prepend(identity);
      }
      seat.setAttribute('aria-label', `${player.id === 0 ? 'Você' : `Bot ${player.id}`}, ${player.hand.length} cartas${state.current === player.id && state.phase === 'playing' ? ', na vez' : ''}`);
      const back = seat.querySelector('.back');
      if (back) {
        back.setAttribute('aria-hidden', 'true');
        back.innerHTML = Array.from({ length:Math.min(7, player.hand.length) }, (_, i) => `<span class="hidden-card" style="--fan-angle:${(i - Math.min(6, player.hand.length - 1) / 2) * 5}deg"></span>`).join('');
      }
      const subhand = seat.querySelector('.subhand');
      if (subhand) fan(subhand, 9);
    }
    fan($('hand'), innerWidth < 360 ? 6 : 8);
    const top=state.discard[state.discard.length-1];
    displayedTop=top?.id ?? null;
    const play=pendingPlay;pendingPlay=null;
    snapshot={state,round:state.round,top:displayedTop,art:$('useCardArt').checked,hands:state.players.map(p=>p.hand.map(c=>c.id))};
    if(play&&play.id===displayedTop)animatePlay(play);
  }
  addEventListener('resize', () => {
    clearFlights();
    layout();
    fan($('hand'), innerWidth < 360 ? 6 : 8);
    document.querySelectorAll('.subhand').forEach(hand => fan(hand, 9));
  });
  window.PanelasMesa = { render, beforeRender, closeMenu, reset:() => {clearFlights();closeMenu();document.body.classList.remove('playing');previous=null;snapshot=null;displayedTop=null;} };
})();
