/* Apresentação limitada ao snapshot privado recebido. Não decide nem altera regras. */
(() => {'use strict';
  const $=id=>document.getElementById(id),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const back='assets/padronizadas/verso_oficial_400x850.png';
  let owner=null,round=null,previous=null,pressure=null,frame=0,decision=null,lastOrigin=null;
  const draws=new Set(),masked=new Set(),nodes=new Set();
  const bridge=()=>window.PanelinhaTableBridge;
  function cardNode(card,visible){
    const wrap=document.createElement('div');wrap.className='table-effect-card';
    if(visible&&card&&!card.hidden)wrap.innerHTML=bridge().cardHTML(card);
    else{const image=new Image();image.src=back;image.alt='Carta virada para baixo';image.draggable=false;wrap.append(image);}
    return wrap;
  }
  function sprite(card,visible,point,kind){
    const node=cardNode(card,visible);node.classList.add('table-flight');node.dataset.effect=kind;
    Object.assign(node.style,{left:point.x+'px',top:point.y+'px',width:point.width+'px',height:point.height+'px'});
    $('playAnimations').append(node);nodes.add(node);return node;
  }
  function remove(node){for(const a of node.getAnimations())a.cancel();node.remove();nodes.delete(node);}
  function visible(s,id){return id===0||s.reveal||(s.o.duo&&id===2);}
  function point(actor,id){return PanelasMesa.handPoint(actor,id,true);}
  function center(){const r=$('discard').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height};}
  function closeDecision(){if(!decision)return;lastOrigin={id:decision.id,...decision.point,node:decision.node.querySelector('.card'),angle:0};masked.delete(decision.id);remove(decision.node);decision=null;}
  function reset(){clearTimeout(frame);pressure=null;previous=null;owner=null;round=null;closeDecision();lastOrigin=null;draws.clear();masked.clear();for(const n of [...nodes])remove(n);$('table').classList.remove('pressure-transition','pressure-hands-hidden');}
  function clock(s){return pressure.duration-(s.paused?s.remaining?.presentation||0:Math.max(0,(s.presentationUntil||0)-Date.now()));}
  function animatePressure(s,p,elapsed){
    if(motion.matches)return;
    const middle=center(),collectAt=690,mixAt=1080,dealAt=1260,endAt=1900;
    if(elapsed<collectAt||p.collecting)return;
    p.collecting=true;
    p.old.forEach((hand,actor)=>hand.forEach((card,i)=>{
      const start=p.points[actor][i]||point(actor,card.id),n=sprite(card,visible(s,actor),start,'pressure-collect');
      n.dataset.actor=actor;
      const a=n.animate([{transform:`translate(-50%,-50%) rotate(${start.angle||0}deg)`,opacity:1},{transform:`translate(calc(-50% + ${middle.x-start.x}px),calc(-50% + ${middle.y-start.y}px)) rotate(${(i%5-2)*7}deg) scale(.8)`,opacity:1}],{duration:Math.max(100,mixAt-elapsed),easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
      a.onfinish=()=>{if(!nodes.has(n))return;const b=n.animate([{translate:'0 0',rotate:'0deg'},{translate:'12px -5px',rotate:'12deg'},{translate:'-8px 4px',rotate:'-10deg'},{translate:'0 0',rotate:'0deg'}],{duration:180,fill:'forwards'});b.onfinish=()=>remove(n);};
    }));
    p.dealAt=dealAt;p.endAt=endAt;
  }
  function dealPressure(s,p,elapsed){
    if(motion.matches||p.dealing||elapsed<1260)return;p.dealing=true;
    const middle=center();
    s.players.forEach(player=>player.hand.forEach((card,i)=>{
      const end=point(player.id,card.id),n=sprite(card,visible(s,player.id),middle,'pressure-deal');n.dataset.actor=player.id;
      const delay=Math.min(180,i*12),duration=Math.max(120,1900-elapsed-delay);
      const a=n.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.8)'},{offset:.1,opacity:1},{opacity:1,transform:`translate(calc(-50% + ${end.x-middle.x}px),calc(-50% + ${end.y-middle.y}px)) rotate(${end.angle||0}deg) scale(${end.width/middle.width},${end.height/middle.height})`}],{duration,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});a.onfinish=()=>remove(n);
    }));
  }
  function paint(s,render){
    if(owner!==s||round!==s.round){reset();owner=s;round=s.round;}
    if(decision&&(!bridge().canPlayDraw(decision.id)||s.pendingAction))closeDecision();
    const actual=s.players.map(p=>p.hand),meta=s.lastDistribution;
    if(meta?.serial&&(!pressure||pressure.serial!==meta.serial)&&((s.presentationUntil||0)>Date.now()||s.paused&&s.remaining?.presentation)){
      for(const entry of draws)remove(entry.node);draws.clear();masked.clear();
      // Nunca reaproveitar uma mão secreta de outro cliente. Reconexões usam versos.
      const old=previous||meta.beforeCounts.map((n,actor)=>Array.from({length:n},(_,i)=>({id:-1000000-actor*10000-i,hidden:true})));
      const top=s.discard.at(-1);
      pressure={serial:meta.serial,duration:meta.duration,old:old.map(h=>h.filter(c=>c.id!==top.id)),points:old.map((h,actor)=>h.filter(c=>c.id!==top.id).map(c=>point(actor,c.id)))};
    }
    const elapsed=pressure?Math.max(0,clock(s)):Infinity,busy=!!pressure&&elapsed<pressure.duration;
    $('table').classList.toggle('pressure-transition',busy);
    $('table').classList.toggle('pressure-hands-hidden',busy&&elapsed>=690);
    if(busy&&elapsed<1260)s.players.forEach((p,i)=>p.hand=pressure.old[i]);
    try{render();lastOrigin=null;}finally{s.players.forEach((p,i)=>p.hand=actual[i]);}
    previous=actual.map(h=>h.map(c=>({...c})));
    if(!busy&&!decision&&!draws.size&&s.drawn!==null)showDecision(s);
    if(busy){
      animatePressure(s,pressure,elapsed);dealPressure(s,pressure,elapsed);
      for(const n of nodes)if(n.dataset.effect?.startsWith('pressure-'))for(const a of n.getAnimations())s.paused?a.pause():a.play();
      clearTimeout(frame);if(!s.paused){const next=[690,1260,2000].find(t=>t>elapsed+1)||2000;frame=setTimeout(()=>{if(bridge().getState()===s)bridge().render();},Math.max(16,next-elapsed));}
    }else if(pressure){for(const n of [...nodes])if(n.dataset.effect?.startsWith('pressure-'))remove(n);}
  }
  function animateDraws(events,s){
    const ends=new Map();if(!events.length||s.lastDistribution&&Date.now()<(s.presentationUntil||0))return ends;
    if(motion.matches){showDecision(s);return ends;}
    let elapsed=0;
    events.forEach((event,i)=>{
      const end=point(event.actor,event.id),eligible=event.actor===0&&s.drawn===event.id&&bridge().canPlayDraw(event.id);
      const step=Math.max(12,Math.min(240,2400/events.length)*Math.pow(.98,i)),delay=elapsed;
      const duration=events.length===1||eligible?820:Math.max(45,Math.min(620,step*2.5));
      elapsed+=step;
      const card=event.card,front=visible(s,event.actor),present=s.players[event.actor].hand.some(c=>c.id===event.id);
      const start={x:event.x,y:event.y,width:event.width,height:event.height};
      const n=sprite(card,front,start,'draw');Object.assign(n.dataset,{actor:event.actor,cardId:event.id});
      const height=Math.min(innerHeight*.5,300),width=height*400/850,cx=innerWidth/2,cy=innerHeight*.46;
      const transform=(x,y,w,h)=>`translate(calc(-50% + ${x-start.x}px),calc(-50% + ${y-start.y}px)) scale(${w/start.width},${h/start.height})`;
      const preview=transform(cx,cy,width,height),destination=transform(end.x,end.y,end.width,end.height);
      const frames=[{opacity:0,transform:'translate(-50%,-50%) scale(.96)'},{offset:.08,opacity:1},{offset:.35,opacity:1,transform:preview},{offset:.69,opacity:1,transform:preview},{opacity:1,transform:eligible?preview:destination}];
      const a=n.animate(frames,{duration,delay,easing:'cubic-bezier(.2,.7,.25,1)',fill:'both'});
      if(present)masked.add(event.id);const entry={id:event.id,node:n};draws.add(entry);ends.set(event.id,delay+duration);
      a.onfinish=()=>{draws.delete(entry);if(eligible&&bridge().getState()===s&&bridge().canPlayDraw(event.id)&&!s.pendingAction){remove(n);showDecision(s,card);}else{masked.delete(event.id);remove(n);PanelasMesa.maskCards();}};
    });return ends;
  }
  function showDecision(s,card=s.players[0].hand.find(c=>c.id===s.drawn)){
    if(decision||!card||!bridge().canPlayDraw(card.id)||s.pendingAction)return;
    const height=Math.min(innerHeight*.5,300),width=height*400/850,p={x:innerWidth/2,y:innerHeight*.46,width,height};
    const n=sprite(card,true,p,'draw-choice');n.classList.add('draw-choice');
    const controls=document.createElement('div');controls.className='draw-choice-actions';
    for(const [label,run] of [['Jogar',()=>bridge().playDraw(card.id)],['Guardar',()=>bridge().keepDraw()]]){const b=document.createElement('button');b.type='button';b.className='btn '+(label==='Jogar'?'good':'alt');b.textContent=label;b.onclick=run;controls.append(b);}
    n.append(controls);n.setAttribute('role','group');n.setAttribute('aria-label','Carta comprada: jogar ou guardar');decision={node:n,id:card.id,point:p};masked.add(card.id);PanelasMesa.maskCards();
  }
  motion.addEventListener('change',()=>{for(const n of [...nodes])if(n.dataset.effect!=='draw-choice')remove(n);draws.clear();masked.clear();});
  window.PanelinhaTableEffects={paint,reset,animateDraws,drawing:id=>masked.has(id),playOrigin:id=>decision?.id===id?{...decision.point,node:decision.node.querySelector('.card'),angle:0}:lastOrigin?.id===id?lastOrigin:null};
})();
