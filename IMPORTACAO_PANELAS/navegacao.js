/* Navegação local e apresentação. Não implementa rede nem altera o relógio do jogo. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const routes={
    home:{id:'home',parent:null,hash:'inicio',focus:'singlePlayerBtn'},
    solo:{id:'menu',parent:'home',hash:'um-jogador',focus:'settingsTitle'},
    multiplayer:{id:'multiplayer',parent:'home',hash:'multiplayer',focus:'multiplayerTitle'},
    create:{id:'createRoom',parent:'multiplayer',hash:'criar-sala',focus:'createTitle'},
    join:{id:'joinRoom',parent:'multiplayer',hash:'entrar-na-sala',focus:'joinTitle'},
    game:{id:'game',parent:'solo',hash:'mesa',focus:'tableMenuBtn'}
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current='home',hooks=null,dialogAction=null,previousFocus=null,ghost=null,returningToSettings=false;
  const entrance=new Set();
  function animate(node,keyframes,options){
    if(reduced.matches||!node?.animate)return;
    const a=node.animate(keyframes,options);entrance.add(a);
    a.addEventListener('finish',()=>entrance.delete(a),{once:true});a.addEventListener('cancel',()=>entrance.delete(a),{once:true});return a;
  }
  function clearEntrance(){entrance.forEach(a=>a.cancel());entrance.clear();ghost?.remove();ghost=null;}
  function writeHistory(route,replace=false){history[replace?'replaceState':'pushState']({panelinha:route},'',`#${routes[route].hash}`);}
  function show(route,focus=true){
    current=route;document.body.dataset.screen=route;
    for(const [name,r] of Object.entries(routes))$(r.id).classList.toggle('hide',name!==route);
    if(route!=='game'){
      const screen=$(routes[route].id);animate(screen,[{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
      if(focus){const target=$(routes[route].focus);target.setAttribute('tabindex',target.matches('button')?'0':'-1');target.focus({preventScroll:true});}
    }
  }
  function go(route){
    if(!routes[route]||route==='game'||current==='game')return false;
    clearEntrance();writeHistory(route);show(route);return true;
  }
  function hideDialog(){
    $('navDialog').hidden=true;dialogAction=null;
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  function ask({title,text,cancel,confirm,action}){
    previousFocus=document.activeElement;dialogAction=action;
    $('navDialogTitle').textContent=title;$('navDialogText').textContent=text;
    $('cancelLeaveBtn').textContent=cancel;$('confirmLeaveBtn').textContent=confirm;
    $('navDialog').hidden=false;$('cancelLeaveBtn').focus({preventScroll:true});
    animate($('navDialog').firstElementChild,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'ease-out'});
  }
  function requestLeave(){
    const state=hooks?.getState();
    if(!state)return;
    if(state.phase!=='playing'){hooks.leaveMatch();return;}
    ask({title:'Sair da mesa?',text:'A partida atual será encerrada. Deseja voltar às configurações?',cancel:'Continuar jogando',confirm:'Encerrar partida',action:()=>hooks.leaveMatch()});
  }
  function back({native=false}={}){
    if(!$('navDialog').hidden){hideDialog();return true;}
    if(current==='game'){
      if($('cancelColor')){$('cancelColor').click();return true;}
      if(!$('tableMenu').classList.contains('hide')){PanelasMesa.closeMenu();return true;}
      requestLeave();return true;
    }
    const parent=routes[current].parent;
    if(parent){history.back();return true;}
    if(native)ask({title:'Sair do Panelinha?',text:'Você pode voltar à cozinha quando quiser.',cancel:'Continuar',confirm:'Sair',action:()=>window.PanelinhaWindow?.backgroundApp().catch(()=>{})});
    return true;
  }
  function returnToSettings(){
    hideDialog();clearEntrance();show('solo');
    if(history.state?.panelinha==='game'){returningToSettings=true;history.back();}else writeHistory('solo',true);
  }
  function captureSettings(){
    clearEntrance();if(reduced.matches||current!=='solo')return;
    const source=$('menu'),r=source.getBoundingClientRect();ghost=source.cloneNode(true);
    [ghost,...ghost.querySelectorAll('[id]')].forEach(n=>n.removeAttribute('id'));
    ghost.querySelectorAll('button,input,select').forEach(n=>n.disabled=true);
    ghost.className='panel front-screen route-ghost settings-ghost';ghost.setAttribute('aria-hidden','true');ghost.inert=true;
    Object.assign(ghost.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height}px`,padding:getComputedStyle(source).padding,background:'#302039',borderRadius:'26px'});
    document.body.append(ghost);
  }
  function enterGame(){
    if(current==='game')return;
    if(current!=='solo')writeHistory('solo');
    writeHistory('game');show('game',false);
    if(ghost){const outgoing=ghost,fade=animate(outgoing,[{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});const remove=()=>{outgoing.remove();if(ghost===outgoing)ghost=null;};if(fade){fade.addEventListener('finish',remove,{once:true});fade.addEventListener('cancel',remove,{once:true});}else remove();}
    // Somente opacidade: geometria e controles já estão corretos; nenhum timer é atrasado.
    animate($('stoveScene'),[{opacity:.15},{opacity:1}],{duration:240,easing:'ease-out'});
    ['player2','player3','player1'].forEach((id,i)=>animate($(id),[{opacity:0},{opacity:1}],{duration:180,delay:35+i*25,easing:'ease-out'}));
    animate(document.querySelector('.hand-panel'),[{opacity:0},{opacity:1}],{duration:200,delay:60,easing:'ease-out'});
  }
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.route)));
  document.querySelectorAll('[data-nav-back]').forEach(b=>b.addEventListener('click',()=>back()));
  $('startBtn').addEventListener('click',captureSettings,true);
  $('cancelLeaveBtn').onclick=hideDialog;
  $('confirmLeaveBtn').onclick=()=>{const action=dialogAction;hideDialog();action?.();};
  $('navDialog').addEventListener('click',event=>{if(event.target===$('navDialog'))hideDialog();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(current==='game'&&$('tableMenu').classList.contains('hide')&&$('navDialog').hidden&&!$('cancelColor'))return;
      event.preventDefault();back();
    }
    if(event.key==='Tab'&&!$('navDialog').hidden){
      const first=$('cancelLeaveBtn'),last=$('confirmLeaveBtn');
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  addEventListener('popstate',event=>{
    const target=routes[event.state?.panelinha]?event.state.panelinha:'home';
    if(current==='game'&&hooks?.getState()){
      // Restaura a âncora da mesa antes de perguntar; cancelar nunca abandona a partida.
      writeHistory('game');back();return;
    }
    const settling=returningToSettings;returningToSettings=false;
    const destination=target==='game'?'solo':target;
    if(target==='game')writeHistory('solo',true);
    if(target!=='game'&&destination===current&&current!=='home'&&!settling){history.back();return;}
    clearEntrance();show(destination);
  });
  reduced.addEventListener('change',()=>{if(reduced.matches)clearEntrance();});
  writeHistory('home',true);show('home',false);
  window.PanelinhaNavigation={go,back,requestLeave,returnToSettings,enterGame,attach:value=>{hooks=value;},get current(){return current;}};
})();
