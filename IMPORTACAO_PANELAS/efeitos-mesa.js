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
  function bundlePoint(p,actor){
    const points=p.points[actor],fallback=point(actor,null),width=Math.max(28,Math.min(46,fallback.width)),height=width*850/400;
    const x=points.length?points.reduce((n,v)=>n+v.x,0)/points.length:fallback.x;
    const y=points.length?points.reduce((n,v)=>n+v.y,0)/points.length:fallback.y;
    return {x:Math.max(width/2+10,Math.min(innerWidth-width/2-10,x)),y:Math.max(height/2+8,Math.min(innerHeight-height/2-8,y)),width,height};
  }
  function animateRotation(s,p,elapsed){
    if(motion.matches)return;
    if(elapsed>=690&&!p.collecting){
      p.collecting=true;p.bundles=p.old.map((_,id)=>bundlePoint(p,id));
      p.old.forEach((hand,actor)=>hand.forEach((card,i)=>{
        const start=p.points[actor][i]||point(actor,card.id),end=p.bundles[actor],n=sprite(card,visible(s,actor),start,'rotation-collect');n.dataset.actor=actor;
        const a=n.animate([{opacity:1,transform:`translate(-50%,-50%) rotate(${start.angle||0}deg)`},{opacity:1,transform:`translate(calc(-50% + ${end.x-start.x}px),calc(-50% + ${end.y-start.y}px)) rotate(${(i%3-1)*2}deg) scale(${end.width/start.width},${end.height/start.height})`}],{duration:Math.max(50,940-elapsed),easing:'cubic-bezier(.3,.1,.2,1)',fill:'forwards'});a.onfinish=()=>remove(n);
      }));
    }
    if(elapsed>=940&&!p.moving){
      p.moving=true;p.bundles=p.bundles||p.old.map((_,id)=>bundlePoint(p,id));
      const centerPoint={x:innerWidth/2,y:innerHeight/2},rx=innerWidth*.39,ry=innerHeight*.34;
      p.meta.transfers.forEach(transfer=>{
        const from=p.bundles[transfer.from],to=p.bundles[transfer.to],n=document.createElement('div');n.className='rotation-pack table-flight';n.dataset.effect='rotation-move';n.dataset.from=transfer.from;n.dataset.to=transfer.to;
        Object.assign(n.style,{left:from.x+'px',top:from.y+'px',width:from.width+'px',height:from.height+'px'});
        for(let i=0;i<Math.min(6,transfer.count);i++){const image=new Image();image.src=back;image.alt='';image.style.transform=`translate(${i*1.5}px,${i*-1.5}px) rotate(${(i%3-1)*2}deg)`;n.append(image);}
        $('playAnimations').append(n);nodes.add(n);
        const angle=point=>Math.atan2((point.y-centerPoint.y)/ry,(point.x-centerPoint.x)/rx),radius=point=>Math.hypot((point.x-centerPoint.x)/rx,(point.y-centerPoint.y)/ry);
        const a=angle(from),b=angle(to),clockwise=p.meta.direction===-1;let delta=b-a;
        if(clockwise&&delta<=0)delta+=Math.PI*2;if(!clockwise&&delta>=0)delta-=Math.PI*2;
        const r0=radius(from),r1=radius(to),frames=Array.from({length:13},(_,i)=>{
          const t=i/12,theta=a+delta*t,r=r0+(r1-r0)*t,x=i===12?to.x:i===0?from.x:centerPoint.x+Math.cos(theta)*rx*r,y=i===12?to.y:i===0?from.y:centerPoint.y+Math.sin(theta)*ry*r;
          return {offset:t,transform:`translate(calc(-50% + ${x-from.x}px),calc(-50% + ${y-from.y}px)) rotate(${Math.sin(t*Math.PI)*(clockwise?6:-6)}deg) scale(${1+(to.width/from.width-1)*t})`};
        });
        const animation=n.animate(frames,{duration:Math.max(80,1580-elapsed),easing:'cubic-bezier(.25,.1,.25,1)',fill:'forwards'});animation.onfinish=()=>remove(n);
      });
    }
    if(elapsed>=1580&&!p.opening){
      p.opening=true;
      s.players.forEach(player=>{
        if(!p.meta.active.includes(player.id))return;const start=p.bundles[player.id];
        player.hand.forEach((card,i)=>{
          const end=point(player.id,card.id),n=sprite(card,visible(s,player.id),start,'rotation-open');n.dataset.actor=player.id;
          const a=n.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${end.x-start.x}px),calc(-50% + ${end.y-start.y}px)) rotate(${end.angle||0}deg) scale(${end.width/start.width},${end.height/start.height})`}],{duration:Math.max(80,1950-elapsed),easing:'cubic-bezier(.2,.75,.2,1)',fill:'forwards'});a.onfinish=()=>remove(n);
        });
      });
    }
  }
  function showReceived(s,meta){
    for(const n of [...nodes])if(n.dataset.effect==='received')remove(n);
    for(const actor of meta.active){
      const avatar=$('player'+actor).querySelector('.pan-avatar'),r=(avatar||$('player'+actor)).getBoundingClientRect(),badge=document.createElement('span');badge.className='pressure-received';badge.dataset.actor=actor;badge.dataset.effect='received';badge.textContent='+'+meta.afterCounts[actor];badge.setAttribute('role','status');badge.setAttribute('aria-label',bridge().names(actor)+' recebeu '+meta.afterCounts[actor]+' cartas');
      $('playAnimations').append(badge);nodes.add(badge);
      const w=badge.offsetWidth,h=badge.offsetHeight;
      let x=r.x+r.width/2,y=r.top-h/2-8;
      // Se não houver espaço acima (avatar superior), prefere o lado livre.
      if(r.top<h+16){if(r.left>w+16){x=r.left-w/2-8;y=r.y+r.height/2;}else y=r.bottom+h/2+8;}
      badge.style.left=Math.max(w/2+8,Math.min(innerWidth-w/2-8,x))+'px';
      badge.style.top=Math.max(h/2+8,Math.min(innerHeight-h/2-8,y))+'px';
      const animation=badge.animate(motion.matches?[{opacity:1},{offset:.84,opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-35%) scale(.8)'},{offset:.06,opacity:1,transform:'translate(-50%,-50%) scale(1)'},{offset:.84,opacity:1},{opacity:0,transform:'translate(-50%,-70%)'}],{duration:4200,easing:'ease-out',fill:'both'});animation.onfinish=()=>remove(badge);
    }
  }
  function paint(s,render){
    if(owner!==s||round!==s.round){reset();owner=s;round=s.round;}
    if(decision&&(!bridge().canPlayDraw(decision.id)||s.pendingAction))closeDecision();
    const actual=s.players.map(p=>p.hand),kind=s.lastRotation?.serial?'rotation':'pressure',meta=kind==='rotation'?s.lastRotation:s.lastDistribution;
    if(meta?.serial&&(!pressure||pressure.serial!==meta.serial||pressure.kind!==kind)&&((s.presentationUntil||0)>Date.now()||s.paused&&s.remaining?.presentation)){
      for(const entry of draws)remove(entry.node);draws.clear();masked.clear();
      for(const n of [...nodes])if(n.dataset.effect==='received')remove(n);
      // Nunca reaproveitar uma mão secreta de outro cliente. Reconexões usam versos.
      const old=previous||meta.beforeCounts.map((n,actor)=>Array.from({length:n},(_,i)=>({id:-1000000-actor*10000-i,hidden:true})));
      const top=s.discard.at(-1);
      pressure={kind,meta,serial:meta.serial,duration:meta.duration,old:old.map(h=>h.filter(c=>c.id!==top.id)),points:old.map((h,actor)=>h.filter(c=>c.id!==top.id).map(c=>point(actor,c.id)))};
    }
    const elapsed=pressure?Math.max(0,clock(s)):Infinity,busy=!!pressure&&elapsed<pressure.duration;
    $('table').classList.toggle('pressure-transition',busy);
    $('table').classList.toggle('pressure-hands-hidden',busy&&elapsed>=690);
    if(busy&&elapsed<(pressure.kind==='rotation'?940:1260))s.players.forEach((p,i)=>p.hand=pressure.old[i]);
    try{render();lastOrigin=null;}finally{s.players.forEach((p,i)=>p.hand=actual[i]);}
    previous=actual.map(h=>h.map(c=>({...c})));
    if(!busy&&!decision&&!draws.size&&s.drawn!==null)showDecision(s);
    if(busy){
      if(pressure.kind==='rotation')animateRotation(s,pressure,elapsed);else{animatePressure(s,pressure,elapsed);dealPressure(s,pressure,elapsed);}
      for(const n of nodes)if(/^(pressure|rotation)-/.test(n.dataset.effect||''))for(const a of n.getAnimations())s.paused?a.pause():a.play();
      clearTimeout(frame);if(!s.paused){const next=(pressure.kind==='rotation'?[690,940,1580,2000]:[690,1260,2000]).find(t=>t>elapsed+1)||2000;frame=setTimeout(()=>{if(bridge().getState()===s)bridge().render();},Math.max(16,next-elapsed));}
    }else if(pressure){for(const n of [...nodes])if(/^(pressure|rotation)-/.test(n.dataset.effect||''))remove(n);if(pressure.kind==='pressure'&&!pressure.notified){pressure.notified=true;showReceived(s,pressure.meta);}}
    window.PanelinhaMatchUI?.mountScore(s,!busy);
  }
  function animateDraws(events,s){
    const ends=new Map();if(!events.length||Date.now()<(s.presentationUntil||0))return ends;
    if(motion.matches){showDecision(s);return ends;}
    let elapsed=0;
    events.forEach((event,i)=>{
      const end=point(event.actor,event.id),detailed=event.actor===0;
      const eligible=detailed&&s.drawn===event.id&&bridge().canPlayDraw(event.id);
      const step=Math.max(20,Math.min(390,4000/events.length)*Math.pow(.985,i)),delay=elapsed;
      const duration=detailed?(events.length===1||eligible?1450:Math.max(85,Math.min(1000,step*2.8))):540;
      elapsed+=detailed?step:Math.min(step,140);
      const card=event.card,present=s.players[event.actor].hand.some(c=>c.id===event.id);
      const start={x:event.x,y:event.y,width:event.width,height:event.height};
      const n=sprite(card,detailed,start,'draw');Object.assign(n.dataset,{actor:event.actor,cardId:event.id,presentation:detailed?'preview':'direct',duration});
      const height=Math.min(innerHeight*.5,300),width=height*400/850,cx=innerWidth/2,cy=innerHeight*.46;
      const transform=(x,y,w,h,angle=0)=>`translate(calc(-50% + ${x-start.x}px),calc(-50% + ${y-start.y}px)) rotate(${angle}deg) scale(${w/start.width},${h/start.height})`;
      const preview=transform(cx,cy,width,height),destination=transform(end.x,end.y,end.width,end.height,end.angle||0);
      const frames=detailed?[
        {opacity:0,transform:transform(start.x,start.y,start.width*.96,start.height*.96,-5)},
        {offset:.08,opacity:1},
        {offset:.22,opacity:1,transform:transform(start.x+(cx-start.x)*.4,start.y+(cy-start.y)*.4-18,start.width*1.45,start.height*1.45,-3)},
        {offset:.4,opacity:1,transform:preview},{offset:.77,opacity:1,transform:preview},
        {opacity:1,transform:eligible?preview:destination}
      ]:[
        {opacity:0,transform:transform(start.x,start.y,start.width,start.height)},
        {offset:.08,opacity:1},
        {offset:.45,opacity:1,transform:transform((start.x+end.x)/2,(start.y+end.y)/2-18,(start.width+end.width)/2,(start.height+end.height)/2,(end.angle||0)*.5)},
        {opacity:1,transform:destination}
      ];
      const animation=n.animate(frames,{duration,delay,easing:'cubic-bezier(.25,.5,.25,1)',fill:'both'});
      if(present)masked.add(event.id);const entry={id:event.id,node:n};draws.add(entry);ends.set(event.id,delay+duration);
      animation.onfinish=()=>{draws.delete(entry);if(eligible&&bridge().getState()===s&&bridge().canPlayDraw(event.id)&&!s.pendingAction){remove(n);showDecision(s,card);}else{masked.delete(event.id);remove(n);PanelasMesa.maskCards();}};
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
