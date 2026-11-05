/* Eventos públicos de apresentação; sem mãos, cartas secretas ou regras de rede. */
(() => {
  'use strict';
  const type='panelinha:ultima-carta',reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let owner=null,matchId=null,matchSerial=0,sequence=0,seen=new Set(),queue=[];
  let timer=null,animation=null,current=null;
  const element=document.createElement('aside');element.id='lastCardNotice';element.className='last-card-notice';
  element.hidden=true;element.setAttribute('role','status');element.setAttribute('aria-live','polite');element.setAttribute('aria-atomic','true');
  const heading=document.createElement('strong');heading.textContent='ÚLTIMA CARTA!';
  const text=document.createElement('span');element.append(heading,text);document.getElementById('game').append(element);
  function clear(){clearTimeout(timer);timer=null;animation?.cancel();animation=null;queue=[];current=null;element.hidden=true;text.textContent='';delete element.dataset.eventId;}
  function reset(){clear();owner=null;matchId=null;sequence=0;seen.clear();}
  function start(state){reset();owner=state;matchId=`local-${Date.now().toString(36)}-${++matchSerial}`;}
  function round(state){if(owner===state)clear();}
  function next(){
    if(current||!queue.length)return;
    const event=queue.shift();if(!owner||owner.phase!=='playing'||event.round!==owner.round){next();return;}
    current=event;element.dataset.eventId=event.id;text.textContent=event.playerName+' anunciou sua última carta!';text.title=text.textContent;element.hidden=false;
    if(!reduced.matches)animation=element.animate([{opacity:0,transform:'translateY(4px) scale(.97)'},{opacity:1,transform:'none'}],{duration:160,easing:'ease-out'});
    timer=setTimeout(()=>{
      animation?.cancel();animation=null;
      const finish=()=>{element.hidden=true;current=null;animation=null;next();};
      if(reduced.matches){finish();return;}
      animation=element.animate([{opacity:1},{opacity:0,transform:'translateY(-3px)'}],{duration:180,easing:'ease-in'});animation.onfinish=finish;
    },3000);
  }
  function receive(event){
    if(!event||typeof event.id!=='string'||!owner||owner.phase!=='playing'||event.matchId!==matchId||event.round!==owner.round||seen.has(event.id))return false;
    if(!Number.isInteger(event.playerId)||event.playerId<0||event.playerId>3||typeof event.playerName!=='string')return false;
    seen.add(event.id);queue.push(Object.freeze({...event}));next();
    document.dispatchEvent(new CustomEvent('panelinha:ultima-carta-confirmada',{detail:event}));return true;
  }
  document.addEventListener(type,event=>receive(event.detail));
  function announce(state,playerId,playerName,stage){
    if(state!==owner||state.phase!=='playing')return;
    const event=Object.freeze({id:`${matchId}:${++sequence}`,matchId,type:'last-card-announced',round:state.round,playerId,playerName,stage});
    document.dispatchEvent(new CustomEvent(type,{detail:event}));return event;
  }
  window.PanelinhaAnnouncements={start,round,reset,announce,receive};
})();
