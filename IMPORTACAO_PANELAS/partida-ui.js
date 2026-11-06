/* Explicações e placar: apresentação comum a partidas locais e snapshots online. */
(() => {'use strict';
  const explanations={
    infinite:['Compra infinita','Compre uma carta por vez até encontrar uma jogável. Você pode jogar a carta encontrada ou guardá-la e passar. Penalidades continuam sendo compradas integralmente.'],
    cut:['Cortes + cartas idênticas','Permite cortar com uma carta idêntica à do descarte durante a janela de 2,2 segundos. A segunda carta idêntica também é jogada por um comando separado.'],
    challenge:['Desafiar +4 e +6','Quem recebe a penalidade pode contestar a última +4 ou +6. Se o autor tinha outra jogada legal, ele compra o acumulado; caso contrário, quem desafiou compra o acumulado mais duas cartas.'],
    wild6:['Carta +6','Inclui duas cartas +6 no baralho. Elas escolhem a cor e acumulam seis cartas de penalidade, seguindo as regras da partida.'],
    dist:['Panela de Pressão','Recolhe e redistribui as mãos. Quem jogou recebe de uma a três cartas a menos quando possível; ninguém fica sem cartas pela redistribuição. Não pode ser usada durante penalidades de compra. Não escolhe cor.'],
    rotate:['Liquidificador','Cada mão passa uma posição no sentido atual da partida. As quantidades e cartas são preservadas, sem escolher cor nem redistribuir aleatoriamente.']
  };
  const help=document.createElement('section');help.id='settingHelp';help.className='setting-help';help.hidden=true;help.setAttribute('role','dialog');help.setAttribute('aria-labelledby','settingHelpTitle');
  help.innerHTML='<button type="button" class="setting-help-close" aria-label="Fechar explicação">×</button><h3 id="settingHelpTitle"></h3><p></p>';document.body.append(help);
  let active=null,historyState=null,historyURL=null;
  function closeHelp(focus=true){if(!active)return false;const button=active;active=null;help.hidden=true;button.setAttribute('aria-expanded','false');if(focus&&button.isConnected)button.focus({preventScroll:true});return true;}
  function position(){
    if(!active)return;const r=active.getBoundingClientRect(),v=visualViewport,left=v?.offsetLeft||0,top=v?.offsetTop||0,w=v?.width||innerWidth,h=v?.height||innerHeight;
    help.style.maxHeight=(h-24)+'px';help.style.width=Math.min(330,w-24)+'px';
    const b=help.getBoundingClientRect(),below=r.bottom+8;
    help.style.left=Math.max(left+12,Math.min(r.x+r.width/2-b.width/2,left+w-b.width-12))+'px';
    help.style.top=Math.max(top+12,Math.min(below+b.height<top+h-12?below:r.top-b.height-8,top+h-b.height-12))+'px';
  }
  function enhance(root=document){root.querySelectorAll('.setting input[type=checkbox]').forEach(input=>{
    const key=input.id.replace(/^mpRule-/,''),label=input.closest('label');if(!label||!explanations[key]||label.querySelector('[data-setting-info]'))return;
    const copy=document.createElement('span');copy.className='setting-copy';[...label.childNodes].filter(n=>n!==input).forEach(n=>copy.append(n));label.prepend(copy);
    const button=document.createElement('button');button.type='button';button.className='setting-info';button.dataset.settingInfo=key;button.textContent='i';button.setAttribute('aria-label','Sobre '+explanations[key][0]);button.setAttribute('aria-controls',help.id);button.setAttribute('aria-expanded','false');input.before(button);label.classList.add('has-setting-info');
  });}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-setting-info]');if(!button)return;
    event.preventDefault();event.stopPropagation();if(active===button){closeHelp();return;}closeHelp(false);window.PanelinhaSelects?.close({animate:false});
    const [title,text]=explanations[button.dataset.settingInfo];help.querySelector('h3').textContent=title;help.querySelector('p').textContent=text;
    historyState=history.state;historyURL=location.href;active=button;button.setAttribute('aria-expanded','true');help.hidden=false;position();help.querySelector('button').focus({preventScroll:true});
  },true);
  document.addEventListener('pointerdown',event=>{if(active&&!help.contains(event.target)&&!active.contains(event.target))closeHelp(false);},true);
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeHelp();}},true);
  help.querySelector('button').onclick=()=>closeHelp();addEventListener('resize',position);addEventListener('scroll',position,true);
  function consumeBack(event){if(!active)return false;event.stopImmediatePropagation();closeHelp();history.pushState(historyState,'',historyURL);return true;}

  const charts=new WeakMap(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function scoreHTML(state,name){
    if(state.o.single)return '';
    const key=JSON.stringify([state.round,state.o.goal,state.o.duo,state.roundScore,state.players.map(p=>[p.id,p.score])]);
    let cache=charts.get(state);if(cache?.key===key)return '<div data-round-score-slot></div>';
    const node=document.createElement('section');node.className='round-score';node.setAttribute('aria-label','Pontos da rodada e progresso até a meta');
    const title=document.createElement('h3');title.textContent='Caminho até a vitória';node.append(title);
    const subtitle=document.createElement('p');subtitle.className='score-goal';subtitle.textContent='Meta: '+state.o.goal+' pontos'+(state.o.duo?' por dupla':'');node.append(subtitle);
    const bars=[];
    for(const player of state.players){
      const team=player.id%2;
      // Rodadas já persistidas por versões anteriores podem não ter o delta. Não inventar pontos.
      const score=state.o.duo?state.roundScore?.teams[team]:state.roundScore?.players.find(p=>p.id===player.id);
      const total=score?.total??(state.o.duo?state.teams[team]:player.score),before=score?.before??total,earned=score?.earned;
      const row=document.createElement('article');row.className='score-player';row.dataset.player=player.id;row.style.setProperty('--score-hue',String([38,275,162,215][player.id]));
      const header=document.createElement('div');header.className='score-player-heading';const label=document.createElement('strong');label.textContent=name(player.id);const value=document.createElement('span');value.textContent=(earned===undefined?'':`+${earned} na rodada · `)+total+' no total'+(state.o.duo?' · dupla':'');header.append(label,value);row.append(header);
      const track=document.createElement('div');track.className='score-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',name(player.id)+' — pontos acumulados'+(state.o.duo?' da dupla':''));track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',state.o.goal);track.setAttribute('aria-valuenow',Math.min(total,state.o.goal));track.setAttribute('aria-valuetext',total+' de '+state.o.goal+' pontos');
      const fill=document.createElement('span');fill.className='score-fill';track.append(fill);row.append(track);node.append(row);
      const start=Math.min(1,Math.max(0,before/state.o.goal)),end=Math.min(1,Math.max(0,total/state.o.goal));fill.style.transform=`scaleX(${start})`;fill.dataset.before=start;fill.dataset.total=end;bars.push({fill,start,end});
    }
    charts.set(state,{key,node,bars,started:false});return '<div data-round-score-slot></div>';
  }
  function mountScore(state,animate=true){
    const cache=charts.get(state),slot=document.querySelector('[data-round-score-slot]');if(!cache||!slot)return;slot.replaceWith(cache.node);
    if(!animate||cache.started)return;cache.started=true;
    for(const {fill,start,end} of cache.bars){fill.style.transform=`scaleX(${end})`;if(!reduced.matches)fill.animate([{transform:`scaleX(${start})`},{transform:`scaleX(${end})`}],{duration:1100,easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'});}
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)document.querySelectorAll('.score-fill').forEach(n=>n.getAnimations().forEach(a=>a.finish()));});
  enhance();window.PanelinhaMatchUI={enhance,closeHelp,consumeBack,scoreHTML,mountScore,mountPodium:(...args)=>PanelinhaPodium.mount(...args)};
})();
