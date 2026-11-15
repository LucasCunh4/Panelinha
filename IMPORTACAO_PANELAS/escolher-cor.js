/* Seletor de apresentação: o motor continua sendo o único responsável pela jogada. */
(() => {
  'use strict';
  // Só acrescenta hitboxes: os PNGs e posições pertencem ao renderizador da carta.
  function choicesHTML(type){
    const {contentWidth:w,contentHeight:h}=PanelinhaCards.geometry;
    return PanelinhaCards.foodRegions(type).map(({color,label,food,x,y,size})=>{
      const style=`left:clamp(22px,${(x+size/2)/w*100}%,calc(100% - 22px));top:clamp(22px,${(y+size/2)/h*100}%,calc(100% - 22px));width:${size/w*100}%;height:${size/h*100}%`;
      return `<button type="button" class="colorbtn ingredient-hit" data-color="${color}" aria-label="${label} — ${food}" style="${style}"></button>`;
    }).join('');
  }
  let closeCurrent=null;
  function open(root,{cardType,choose,cancel}){
    // Recusa explícita: especiais sem escolha jamais usam este componente.
    if(!['wild','wild4','wild6'].includes(cardType))return false;
    const type=cardType;
    const title=type==='wild4'?'+4 — Escolher cor':type==='wild6'?'+6 — Escolher cor':'Escolher cor';
    closeCurrent?.();
    const previous=document.activeElement;
    const overlay=document.createElement('div');overlay.className='modal-wrap color-picker';overlay.dataset.cardType=type;overlay.classList.toggle('penalty-picker',type!=='wild');
    overlay.innerHTML=`<section class="color-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="colorPickerTitle">
      <h2 id="colorPickerTitle">Escolha uma cor para continuar.</h2>
      <div class="color-picker-card">${PanelinhaCards.html({type},{label:title})}<div class="color-picker-food-targets" role="group" aria-label="Escolha um alimento na carta">${choicesHTML(type)}</div></div>
      <button type="button" id="viewColorTable" class="btn alt table-action" aria-pressed="false" aria-label="Mantenha pressionado para visualizar a mesa">Visualizar mesa</button><button type="button" id="cancelColor" hidden tabindex="-1">Cancelar escolha</button>
      <span class="sr-only" role="status" aria-live="polite"></span>
    </section>`;
    let accepted=false,closed=false,animation=null,viewing=false,heldPointer=null,heldKey=null;
    const view=overlay.querySelector('#viewColorTable');
    function close(){
      if(closed)return;releaseView();closed=true;animation?.cancel();overlay.remove();
      document.removeEventListener('keydown',keys,true);
      document.removeEventListener('keyup',keyUp,true);
      window.removeEventListener('pointerup',pointerEnd,true);window.removeEventListener('pointercancel',pointerEnd,true);
      window.removeEventListener('blur',releaseView);document.removeEventListener('visibilitychange',visibility);
      if(closeCurrent===close)closeCurrent=null;
    }
    function cancelChoice(){if(accepted){close();return;}close();cancel();if(previous?.isConnected)previous.focus({preventScroll:true});}
    function viewTable(value){
      if(closed||accepted)return;viewing=value;overlay.classList.toggle('viewing-table',value);
      view.setAttribute('aria-pressed',String(value));view.textContent=value?'Solte para voltar':'Visualizar mesa';
      overlay.querySelector('.color-picker-card').setAttribute('aria-hidden',String(value));
      overlay.querySelectorAll('[data-color]').forEach(b=>b.disabled=value);
    }
    function releaseView(){
      const pointer=heldPointer;heldPointer=heldKey=null;viewTable(false);
      if(pointer!==null&&view.hasPointerCapture?.(pointer))view.releasePointerCapture(pointer);
    }
    function pointerEnd(event){if(event.pointerId===heldPointer)releaseView();}
    function keyUp(event){if(event.key===heldKey){event.preventDefault();event.stopImmediatePropagation();releaseView();}}
    function visibility(){if(document.hidden)releaseView();}
    view.addEventListener('pointerdown',event=>{
      if(accepted||closed||!event.isPrimary||event.button!==0)return;
      event.preventDefault();event.stopPropagation();view.focus({preventScroll:true});heldPointer=event.pointerId;
      view.setPointerCapture?.(event.pointerId);viewTable(true);
    });
    view.addEventListener('lostpointercapture',pointerEnd);
    view.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
    view.addEventListener('blur',releaseView);
    window.addEventListener('pointerup',pointerEnd,true);window.addEventListener('pointercancel',pointerEnd,true);
    window.addEventListener('blur',releaseView);document.addEventListener('visibilitychange',visibility);
    function keys(event){
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(viewing)releaseView();else cancelChoice();}
      if(document.activeElement===view&&[' ','Enter'].includes(event.key)){
        event.preventDefault();event.stopImmediatePropagation();if(!event.repeat&&!viewing){heldKey=event.key;viewTable(true);}
      }
      if(event.key==='Tab'){
        releaseView();
        const buttons=[...overlay.querySelectorAll('button:not(:disabled):not([hidden])')].filter(b=>b.getClientRects().length);
        const i=buttons.indexOf(document.activeElement);
        event.preventDefault();buttons[i<0?(event.shiftKey?buttons.length-1:0):(i+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus({preventScroll:true});
      }
    }
    overlay.querySelectorAll('[data-color]').forEach(button=>{
      const layer=overlay.querySelector(`.card-food[data-food="${button.dataset.color}"] .card-food-image`);
      const highlight=()=>layer.classList.add('food-highlight');
      button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')highlight();});
      button.addEventListener('pointerleave',()=>layer.classList.remove('food-highlight','food-pressed'));
      button.addEventListener('focus',highlight);
      button.addEventListener('blur',()=>layer.classList.remove('food-highlight'));
      button.addEventListener('pointerdown',()=>{if(!accepted)layer.classList.add('food-pressed');});
      button.addEventListener('pointercancel',()=>layer.classList.remove('food-pressed'));
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();if(accepted||closed||viewing)return;
        accepted=true;overlay.classList.add('color-confirmed');layer.classList.add('food-confirmed');
        overlay.querySelector('[role="status"]').textContent=button.getAttribute('aria-label');
        overlay.querySelectorAll('[data-color]').forEach(b=>{b.disabled=true;b.classList.remove('colorbtn');});
        // A cor e os efeitos são registrados imediatamente, sem depender do tempo visual.
        choose(button.dataset.color);
        if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return;}
        animation=overlay.animate([{opacity:1},{offset:.65,opacity:1},{opacity:0}],{duration:200,easing:'ease-out'});
        animation.onfinish=close;
      });
    });
    overlay.querySelector('#cancelColor').onclick=()=>viewing?releaseView():cancelChoice();
    overlay.addEventListener('click',event=>{if(event.target===overlay&&!viewing)cancelChoice();});
    root.innerHTML='';root.append(overlay);closeCurrent=close;
    document.addEventListener('keydown',keys,true);
    document.addEventListener('keyup',keyUp,true);
    // Foco inicial no diálogo, sem simular hover sobre uma cor no dispositivo de toque.
    const dialog=overlay.querySelector('[role="dialog"]');dialog.tabIndex=-1;dialog.focus({preventScroll:true});
  }
  window.PanelinhaColorPicker={open,close:()=>closeCurrent?.()};
})();
