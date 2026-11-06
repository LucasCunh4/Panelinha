/* Resultado oficial fornecido pelo motor/servidor. Não recalcula posições ou pontos. */
(() => {'use strict';
  const cache=new WeakMap();
  function html(state,name){
    if(state.phase!=='gameOver'||!state.finalStandings)return '';
    const key=JSON.stringify([state.round,state.finalStandings,state.players.map(p=>[p.id,p.name,p.avatar])]);
    if(cache.get(state)?.key===key)return '<div data-podium-slot></div>';
    const section=document.createElement('section');section.className='final-podium'+(state.o.duo?' duo-podium':'');section.setAttribute('aria-label','Pódio final da partida');
    const heading=document.createElement('h2');heading.textContent=state.o.duo?'Dupla campeã!':'Pódio do Panelinha';section.append(heading);
    const scene=document.createElement('div');scene.className='podium-scene';scene.setAttribute('role','list');section.append(scene);
    for(const group of state.finalStandings){
      const extra=group.place>=4,node=document.createElement('article');node.className=extra?'podium-fourth':'podium-tier';node.dataset.place=group.place;node.setAttribute('role','listitem');
      node.classList.toggle('podium-champion',group.place===1);node.classList.toggle('podium-tied',!state.o.duo&&group.playerIds.length>1);
      const people=document.createElement('div');people.className='podium-people';node.append(people);
      for(const id of group.playerIds){
        const player=state.players.find(p=>p.id===id),person=document.createElement('div');person.className='podium-person';person.dataset.player=id;
        const avatar=player.avatar||(id===0?state.identity?.avatar:PanelinhaProfile.avatars[id]?.id);
        person.innerHTML=PanelinhaProfile.avatarHTML(avatar);const label=document.createElement('strong');label.className='podium-name';label.textContent=name(id);person.append(label);people.append(person);
      }
      const platform=document.createElement('div');platform.className='podium-platform';const rank=document.createElement('b');rank.className='podium-place';rank.textContent=group.place+'º'+(!state.o.duo&&group.playerIds.length>1?' · empate':'');platform.append(rank);
      if(!state.o.single){const score=document.createElement('span');score.className='podium-score';score.textContent=group.total+' pontos · '+group.victories+' vitória(s)';platform.append(score);}
      node.append(platform);(extra?section:scene).append(node);
      node.setAttribute('aria-label',group.place+'º lugar'+(node.classList.contains('podium-tied')?', empatados':'')+': '+group.playerIds.map(name).join(' e '));
      if(group.place===1){const stars=document.createElement('span');stars.className='podium-sparkles';stars.setAttribute('aria-hidden','true');stars.textContent='✦  ✧  ✦';node.prepend(stars);}
    }
    cache.set(state,{key,node:section});return '<div data-podium-slot></div>';
  }
  function mount(state,allowed=true){const slot=document.querySelector('[data-podium-slot]'),record=cache.get(state);if(!slot||!record||!allowed)return;if(record.mounted)record.node.classList.add('podium-revisited');slot.replaceWith(record.node);record.mounted=true;}
  window.PanelinhaPodium={html,mount};
})();
