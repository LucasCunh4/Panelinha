/* Apresentação da mesa: só lê o estado recebido, sem ações ou temporizadores de jogo. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const colorNames = { red:'Vermelho', blue:'Azul', yellow:'Amarelo', green:'Verde' };
  const avatarColors = ['#c6a1fa', '#f0a783', '#91d7c5', '#9dbef5'];
  let previous = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stopDirectionAnimation = () => $('directionGlyph').getAnimations().forEach(animation => animation.cancel());
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopDirectionAnimation(); });

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

  function render(state) {
    const center = $('burner').parentElement;
    center.dataset.activeColor = state.activeColor;
    $('burner').setAttribute('aria-label', `Boca do fogão · cor ativa: ${colorNames[state.activeColor]}`);
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
    for (const player of state.players) {
      const seat = $(`player${player.id}`);
      seat.insertAdjacentHTML('afterbegin', panAvatar(player.id));
      seat.setAttribute('aria-label', `${player.id === 0 ? 'Você' : `Bot ${player.id}`}, ${player.hand.length} cartas${state.current === player.id && state.phase === 'playing' ? ', na vez' : ''}`);
      const back = seat.querySelector('.back');
      if (back) {
        back.setAttribute('aria-hidden', 'true');
        back.innerHTML = Array.from({ length:Math.min(5, player.hand.length) }, (_, i) => `<span class="hidden-card" style="--fan-angle:${(i - Math.min(4, player.hand.length - 1) / 2) * 8}deg"></span>`).join('');
      }
      const subhand = seat.querySelector('.subhand');
      if (subhand) fan(subhand, 9);
    }
    fan($('hand'), innerWidth < 360 ? 6 : 8);
  }
  addEventListener('resize', () => {
    fan($('hand'), innerWidth < 360 ? 6 : 8);
    document.querySelectorAll('.subhand').forEach(hand => fan(hand, 9));
  });
  window.PanelasMesa = { render };
})();
