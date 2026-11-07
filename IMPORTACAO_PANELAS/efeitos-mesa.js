/* Apresentação limitada ao snapshot privado recebido. Não decide nem altera regras. */
(() => {'use strict';
  const $=id=>document.getElementById(id),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const back='assets/padronizadas/verso_oficial_400x850.png';
  let owner=null,round=null,previous=null,pressure=null,frame=0,decision=null,lastOrigin=null,seenPurchase=0;
  const draws=new Set(),masked=new Set(),nodes=new Set(),incoming=new Map();
  let prepared=[],arrivalLayout=false;
  const drawKey=(actor,id)=>actor+':'+id;
  function handCards(s,actor){return s.players[actor].hand.filter(c=>!incoming.has(drawKey(actor,c.id)));}
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
  function closeDecision(deliver=false){
    if(!decision)return;
    const previousDecision=decision;decision=null;
    lastOrigin={id:previousDecision.id,...previousDecision.point,node:previousDecision.node.querySelector('.card'),angle:0};
    remove(previousDecision.node);
    if(deliver)placeDecision(previousDecision);else masked.delete(previousDecision.id);
  }
  function reset(){clearTimeout(frame);pressure=null;previous=null;owner=null;round=null;seenPurchase=0;closeDecision();lastOrigin=null;draws.clear();masked.clear();incoming.clear();prepared=[];arrivalLayout=false;for(const n of [...nodes])remove(n);$('table').classList.remove('pressure-transition','pressure-hands-hidden','penalty-purchase-transition');}
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
      const avatar=$('player'+actor).querySelector('.pan-avatar'),r=(actor===0?$('hand'):avatar||$('player'+actor)).getBoundingClientRect(),badge=document.createElement('span');badge.className='pressure-received';badge.dataset.actor=actor;badge.dataset.effect='received';badge.textContent='+'+meta.afterCounts[actor];badge.setAttribute('role','status');badge.setAttribute('aria-label',bridge().names(actor)+' recebeu '+meta.afterCounts[actor]+' cartas');
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
    if(decision&&(!s.players[0].hand.some(c=>c.id===decision.id)||s.pendingAction||s.drawn!==decision.id)){const keep=s.players[0].hand.find(c=>c.id===decision.id);closeDecision(!!keep&&!s.pendingAction);}
    for(const [key,item]of incoming)if(!s.players[item.actor].hand.some(c=>c.id===item.id)){incoming.delete(key);masked.delete(item.id);}
    const actual=s.players.map(p=>p.hand),kind=s.lastRotation?.serial?'rotation':'pressure',meta=kind==='rotation'?s.lastRotation:s.lastDistribution;
    if(meta?.serial&&(!pressure||pressure.serial!==meta.serial||pressure.kind!==kind)&&((s.presentationUntil||0)>Date.now()||s.paused&&s.remaining?.presentation)){
      for(const entry of draws)remove(entry.node);draws.clear();masked.clear();incoming.clear();prepared=[];
      for(const n of [...nodes])if(n.dataset.effect==='received')remove(n);
      // Nunca reaproveitar uma mão secreta de outro cliente. Reconexões usam versos.
      const old=previous||meta.beforeCounts.map((n,actor)=>Array.from({length:n},(_,i)=>({id:-1000000-actor*10000-i,hidden:true})));
      const top=s.discard.at(-1);
      pressure={kind,meta,serial:meta.serial,duration:meta.duration,old:old.map(h=>h.filter(c=>c.id!==top.id)),points:old.map((h,actor)=>h.filter(c=>c.id!==top.id).map(c=>point(actor,c.id)))};
    }
    const matches=pressure&&meta?.serial===pressure.serial&&kind===pressure.kind;
    const elapsed=matches?Math.max(0,clock(s)):Infinity,busy=!!matches&&elapsed<pressure.duration;
    const purchase=s.lastPenaltyPurchase,purchaseBusy=!!purchase&&(s.paused?(s.remaining?.presentation||0)>0:Date.now()<(s.presentationUntil||0));
    $('table').classList.toggle('penalty-purchase-transition',purchaseBusy);
    $('table').classList.toggle('pressure-transition',busy);
    $('table').classList.toggle('pressure-hands-hidden',busy&&elapsed>=690);
    prepareDraws(PanelasMesa.takeDraws(),s,busy);
    const oldPositions=arrivalLayout?new Map([...$('hand').children].map(n=>{const r=n.getBoundingClientRect();return[n.dataset.card,{x:r.x+r.width/2,y:r.y+r.height/2}]})):null;arrivalLayout=false;
    if(busy&&elapsed<(pressure.kind==='rotation'?940:1260))s.players.forEach((p,i)=>p.hand=pressure.old[i]);
    try{render();if(lastOrigin&&!s.players[0].hand.some(c=>c.id===lastOrigin.id))lastOrigin=null;}finally{s.players.forEach((p,i)=>p.hand=actual[i]);}
    if(oldPositions&&!motion.matches)for(const n of $('hand').children){const old=oldPositions.get(n.dataset.card);if(!old)continue;const r=n.getBoundingClientRect(),dx=old.x-r.x-r.width/2,dy=old.y-r.y-r.height/2;if(Math.hypot(dx,dy)>.5){const end=getComputedStyle(n).transform;n.animate([{transform:`translate(${dx}px,${dy}px) ${end}`},{transform:end}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});}}
    previous=actual.map(h=>h.map(c=>({...c})));
    if(!busy&&!decision&&!draws.size&&s.drawn!==null)showDecision(s);
    if(busy){
      if(pressure.kind==='rotation')animateRotation(s,pressure,elapsed);else{animatePressure(s,pressure,elapsed);dealPressure(s,pressure,elapsed);}
      for(const n of nodes)if(/^(pressure|rotation)-/.test(n.dataset.effect||''))for(const a of n.getAnimations())s.paused?a.pause():a.play();
      clearTimeout(frame);if(!s.paused){const next=(pressure.kind==='rotation'?[690,940,1580,2000]:[690,1260,2000]).find(t=>t>elapsed+1)||2000;frame=setTimeout(()=>{if(bridge().getState()===s)bridge().render();},Math.max(16,next-elapsed));}
    }else if(pressure){for(const n of [...nodes])if(/^(pressure|rotation)-/.test(n.dataset.effect||''))remove(n);if(pressure.kind==='pressure'&&!pressure.notified){pressure.notified=true;showReceived(s,pressure.meta);}}
    if(purchaseBusy){
      const progress=penaltyProgress(s);
      for(const entry of draws)if(entry.purchase===purchase.serial){entry.animation.currentTime=progress;s.paused?entry.animation.pause():entry.animation.play();}
      clearTimeout(frame);if(!s.paused)frame=setTimeout(()=>{if(bridge().getState()===s)bridge().render();},Math.max(1,s.presentationUntil-Date.now()));
    }
    for(const entry of draws)if(!entry.purchase)s.paused?entry.animation.pause():entry.animation.play();
    refreshDecision(s);
    window.PanelinhaMatchUI?.mountScore(s,!busy&&!purchaseBusy);
    window.PanelinhaMatchUI?.mountPodium?.(s,!busy&&!purchaseBusy);
  }
  function penaltyProgress(s){return Math.max(0,s.lastPenaltyPurchase.duration-(s.paused?(s.remaining?.presentation||0):Math.max(0,(s.presentationUntil||0)-Date.now())));}
  function prepareDraws(events,s,busy){
    prepared=[];if(busy||motion.matches)return;
    const purchase=s.lastPenaltyPurchase,forced=!!purchase&&(s.paused?(s.remaining?.presentation||0)>0:Date.now()<(s.presentationUntil||0));
    if(forced){
      if(seenPurchase===purchase.serial)return;seenPurchase=purchase.serial;
      const actor=purchase.actor,player=s.players[actor],r=$('pile').getBoundingClientRect();
      const cards=actor===0&&purchase.cardIds?purchase.cardIds.map(id=>player.hand.find(c=>c.id===id)).filter(Boolean):player.hand.slice(-purchase.count);
      events=cards.map(card=>({actor,id:card.id,card,x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}));
    }else if(Date.now()<(s.presentationUntil||0))return;
    const groups=new Map();for(const event of events){if(!groups.has(event.actor))groups.set(event.actor,[]);groups.get(event.actor).push(event);}
    for(const [actor,group]of groups){
      const plan=PanelinhaRules.drawSequence(group.length,forced?'penalty':'normal'),tail=s.players[actor].hand.slice(-group.length),progress=forced?penaltyProgress(s):0;
      group.forEach((original,i)=>{
        // Snapshots ocultos têm IDs locais estáveis; eventos públicos não contêm IDs secretos.
        const card=actor!==0&&original.id<0&&!s.players[actor].hand.some(c=>c.id===original.id)?tail[i]||original.card:original.card;
        const event={...original,card,id:card?.id??original.id},eligible=!forced&&actor===0&&s.drawn===event.id&&bridge().canPlayDraw(event.id);
        const duration=actor===0?(eligible?plan.approach:plan.items[i].duration):(forced?650:850),delay=plan.items[i].delay;
        if(forced&&progress>=delay+duration)return;
        const item={...event,eligible,duration,delay,progress,purchase:forced?purchase.serial:null};
        if(s.players[actor].hand.some(c=>c.id===item.id))incoming.set(drawKey(actor,item.id),item);
        prepared.push(item);
      });
    }
  }
  function arrive(item,s){
    incoming.delete(drawKey(item.actor,item.id));masked.delete(item.id);arrivalLayout=true;
    if(bridge().getState()===s)bridge().render();
  }
  function animateDraws(_events,s){
    const ends=new Map(),batch=prepared;prepared=[];
    if(motion.matches){showDecision(s);return ends;}
    for(const item of batch){
      const {actor,id,card,eligible,duration,delay,progress,purchase}=item,detailed=actor===0;
      const start={x:item.x,y:item.y,width:item.width,height:item.height};
      if(detailed&&card?.type==='wild')start.height=start.width*850/400;
      const end=PanelasMesa.incomingPoint(actor,card),n=sprite(card,detailed,start,'draw');
      Object.assign(n.dataset,{actor,cardId:id,presentation:detailed?'preview':'direct',duration,delay});
      const height=Math.min(innerHeight*.5,300),width=height*400/850,cx=innerWidth/2,cy=innerHeight*.46;
      const transform=(x,y,w,h,angle=0)=>`translate(calc(-50% + ${x-start.x}px),calc(-50% + ${y-start.y}px)) rotate(${angle}deg) scale(${w/start.width},${h/start.height})`;
      const preview=transform(cx,cy,width,height),destination=transform(end.x,end.y,end.width,end.height,end.angle||0);
      const frames=detailed?(eligible?[
        {opacity:0,transform:transform(start.x,start.y,start.width*.96,start.height*.96,-5),easing:'ease-out'},
        {offset:.15,opacity:1,transform:transform(start.x,start.y-8,start.width*1.02,start.height*1.02,-4),easing:'cubic-bezier(.4,0,.3,1)'},
        {offset:.5,opacity:1,transform:transform(start.x+(cx-start.x)*.4,start.y+(cy-start.y)*.4-18,start.width*1.45,start.height*1.45,-3),easing:'cubic-bezier(.2,.65,.3,1)'},
        {opacity:1,transform:preview}
      ]:[
        {opacity:0,transform:transform(start.x,start.y,start.width*.96,start.height*.96,-5),easing:'ease-out'},
        {offset:.06,opacity:1,transform:transform(start.x,start.y-8,start.width*1.02,start.height*1.02,-4),easing:'cubic-bezier(.4,0,.3,1)'},
        {offset:.2,opacity:1,transform:transform(start.x+(cx-start.x)*.4,start.y+(cy-start.y)*.4-18,start.width*1.45,start.height*1.45,-3),easing:'cubic-bezier(.2,.65,.3,1)'},
        {offset:.4,opacity:1,transform:preview},{offset:.8,opacity:1,transform:preview,easing:'cubic-bezier(.4,0,.2,1)'},
        {opacity:1,transform:destination}
      ]):[
        {opacity:0,transform:transform(start.x,start.y,start.width,start.height)},
        {offset:.08,opacity:1},
        {offset:.45,opacity:1,transform:transform((start.x+end.x)/2,(start.y+end.y)/2-18,(start.width+end.width)/2,(start.height+end.height)/2,(end.angle||0)*.5)},
        {opacity:1,transform:destination}
      ];
      const animation=n.animate(frames,{duration,delay,easing:detailed?'linear':'cubic-bezier(.25,.5,.25,1)',fill:'both'});
      masked.add(id);const entry={id,node:n,animation,purchase};draws.add(entry);ends.set(id,delay+duration);
      if(purchase){animation.currentTime=progress;if(s.paused)animation.pause();}
      animation.onfinish=()=>{
        draws.delete(entry);remove(n);
        if(eligible&&bridge().getState()===s&&bridge().canPlayDraw(id)&&!s.pendingAction){showDecision(s,card);bridge().render();}
        else arrive(item,s);
      };
    }return ends;
  }
  function placeDecision(old){
    const s=bridge().getState(),card=s?.players[0].hand.find(c=>c.id===old.id);if(!card)return;
    const item={actor:0,id:old.id};
    if(motion.matches){incoming.delete(drawKey(0,old.id));masked.delete(old.id);arrivalLayout=true;return;}
    const start=old.point,end=PanelasMesa.incomingPoint(0,card),n=sprite(card,true,start,'draw-keep');
    const animation=n.animate([{transform:'translate(-50%,-50%)'},{transform:`translate(calc(-50% + ${end.x-start.x}px),calc(-50% + ${end.y-start.y}px)) rotate(${end.angle||0}deg) scale(${end.width/start.width},${end.height/start.height})`}],{duration:500,easing:'cubic-bezier(.3,0,.2,1)',fill:'both'});
    masked.add(old.id);const entry={id:old.id,node:n,animation,purchase:null};draws.add(entry);
    animation.onfinish=()=>{draws.delete(entry);remove(n);arrive(item,s);};
  }
  function refreshDecision(s){
    if(!decision)return;
    const controls=decision.node.querySelector('.draw-choice-actions'),eligible=bridge().canAnnounce();
    let uno=controls.querySelector('.draw-uno');
    if(eligible&&!uno){uno=document.createElement('button');uno.type='button';uno.id='drawUnoBtn';uno.className='btn warn draw-uno';uno.textContent='Última Carta';uno.onclick=()=>bridge().announce();controls.append(uno);}
    if(!eligible)uno?.remove();
    for(const button of controls.children)button.disabled=!!decision.busy||!!s.paused||!!s.pendingAction;
  }
  function showDecision(s,card=s.players[0].hand.find(c=>c.id===s.drawn)){
    if(decision||!card||!bridge().canPlayDraw(card.id)||s.pendingAction)return;
    const height=Math.min(innerHeight*.5,300),width=height*400/850,p={x:innerWidth/2,y:innerHeight*.46,width,height};
    const n=sprite(card,true,p,'draw-choice');n.classList.add('draw-choice');
    const controls=document.createElement('div');controls.className='draw-choice-actions';
    for(const [label,run]of[['Jogar',()=>bridge().playDraw(card.id)],['Guardar',()=>bridge().keepDraw()]]){
      const b=document.createElement('button');b.type='button';b.className='btn '+(label==='Jogar'?'good':'alt');b.textContent=label;
      b.onclick=async()=>{const current=decision;if(!current||current.busy)return;current.busy=true;refreshDecision(s);try{await run();}finally{if(decision===current){current.busy=false;refreshDecision(s);}}};controls.append(b);
    }
    n.append(controls);n.setAttribute('role','group');n.setAttribute('aria-label','Carta comprada: jogar ou guardar');decision={node:n,id:card.id,card,point:p,busy:false};
    incoming.set(drawKey(0,card.id),{actor:0,id:card.id,card});masked.add(card.id);PanelasMesa.maskCards();refreshDecision(s);
  }
  motion.addEventListener('change',()=>{for(const n of [...nodes])if(n.dataset.effect!=='draw-choice')remove(n);draws.clear();masked.clear();incoming.clear();if(decision){incoming.set(drawKey(0,decision.id),{actor:0,id:decision.id});masked.add(decision.id);}bridge()?.render();});
  window.PanelinhaTableEffects={paint,reset,animateDraws,handCards,drawing:id=>masked.has(id),playOrigin:id=>decision?.id===id?{...decision.point,node:decision.node.querySelector('.card'),angle:0}:lastOrigin?.id===id?lastOrigin:null};
})();
