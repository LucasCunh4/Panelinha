/* Seletor de apresentação: o motor continua sendo o único responsável pela jogada. */
(() => {
  'use strict';
  // Regiões das quatro cores na ilustração completa aprovada (canvas 470×800).
  // A arte é renderizada uma única vez; somente o feedback de interação é sobreposto.
  const regions=[['red','Vermelho',35,140,170,180],['yellow','Amarelo',260,130,190,190],['blue','Azul',20,345,175,170],['green','Verde',275,340,175,190]];
  function choicesHTML(){
    return regions.map(([color,label,x,y,w,h])=>{
      const style=`left:${x/470*100}%;top:${y/800*100}%;width:${w/470*100}%;height:${h/800*100}%`;
      return `<div class="ingredient-layer color-zone" data-ingredient="${color}" style="${style};--zone-color:var(--choice-${color})"></div><button type="button" class="colorbtn ingredient-hit" data-color="${color}" aria-label="${label}" style="${style}"></button>`;
    }).join('');
  }
  let closeCurrent=null;
  function open(root,{cardType,choose,cancel}){
    // Recusa explícita: especiais sem escolha jamais usam este componente.
    if(!['wild','wild4','wild6'].includes(cardType))return false;
    const type=cardType;
    const title=type==='wild4'?'+4 — Escolher cor':type==='wild6'?'+6 — Escolher cor':'Escolher cor';
    const hint='Toque na cor desejada na carta';
    closeCurrent?.();
    const previous=document.activeElement;
    const overlay=document.createElement('div');overlay.className='modal-wrap color-picker';overlay.dataset.cardType=type;overlay.classList.toggle('penalty-picker',type!=='wild');
    overlay.innerHTML=`<section class="color-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="colorPickerTitle" aria-describedby="colorPickerHint">
      <h2 id="colorPickerTitle">${title}</h2><p id="colorPickerHint">${hint}</p>
      <div class="color-picker-card">${PanelinhaCards.html({type},{label:title})}<div class="color-picker-content">${choicesHTML()}</div>
      </div><button type="button" class="btn alt" id="cancelColor">Cancelar</button>
      <span class="sr-only" role="status" aria-live="polite"></span>
    </section>`;
    let accepted=false,closed=false,animation=null;
    function close(){
      if(closed)return;closed=true;animation?.cancel();overlay.remove();
      document.removeEventListener('keydown',keys,true);
      if(closeCurrent===close)closeCurrent=null;
    }
    function cancelChoice(){if(accepted){close();return;}close();cancel();if(previous?.isConnected)previous.focus({preventScroll:true});}
    function keys(event){
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();cancelChoice();}
      if(event.key==='Tab'){
        const buttons=[...overlay.querySelectorAll('button:not(:disabled)')];
        const i=buttons.indexOf(document.activeElement);
        event.preventDefault();buttons[i<0?(event.shiftKey?buttons.length-1:0):(i+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus({preventScroll:true});
      }
    }
    overlay.querySelectorAll('[data-color]').forEach(button=>{
      const layer=overlay.querySelector(`[data-ingredient="${button.dataset.color}"]`);
      const highlight=()=>layer.classList.add('ingredient-hover');
      button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')highlight();});
      button.addEventListener('pointerleave',()=>layer.classList.remove('ingredient-hover','ingredient-pressed'));
      button.addEventListener('focus',highlight);
      button.addEventListener('blur',()=>layer.classList.remove('ingredient-hover'));
      button.addEventListener('pointerdown',()=>{if(!accepted)layer.classList.add('ingredient-pressed');});
      button.addEventListener('pointercancel',()=>layer.classList.remove('ingredient-pressed'));
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();if(accepted||closed)return;
        accepted=true;overlay.classList.add('color-confirmed');layer.classList.add('ingredient-selected');
        overlay.querySelector('[role="status"]').textContent=button.getAttribute('aria-label');
        overlay.querySelectorAll('[data-color]').forEach(b=>{b.disabled=true;b.classList.remove('colorbtn');});
        // A cor e os efeitos são registrados imediatamente, sem depender do tempo visual.
        choose(button.dataset.color);
        if(matchMedia('(prefers-reduced-motion: reduce)').matches){close();return;}
        animation=overlay.animate([{opacity:1},{offset:.65,opacity:1},{opacity:0}],{duration:200,easing:'ease-out'});
        animation.onfinish=close;
      });
    });
    overlay.querySelector('#cancelColor').onclick=cancelChoice;
    root.innerHTML='';root.append(overlay);closeCurrent=close;
    document.addEventListener('keydown',keys,true);
    // Foco inicial no diálogo, sem simular hover sobre uma cor no dispositivo de toque.
    const dialog=overlay.querySelector('[role="dialog"]');dialog.tabIndex=-1;dialog.focus({preventScroll:true});
  }
  window.PanelinhaColorPicker={open};
})();
