/* Seletor de apresentação: o motor continua sendo o único responsável pela jogada. */
(() => {
  'use strict';
  // Uma única lista compartilhada por Coringa/+4/+6; a prévia da carta fica intacta.
  const ingredients=[['red','Vermelho','Tomate','tomate_panelinha_512.png'],['blue','Azul','Mirtilos','mirtilos_panelinha_512.png'],['yellow','Amarelo','Queijo','queijo_panelinha_512.png'],['green','Verde','Alface','alface_panelinha_512.png']];
  const asset=file=>'assets/selecao-cor/'+file;
  const images=ingredients.map(([, , ,file])=>{const image=new Image();image.src=asset(file);image.decode?.().catch(()=>{});return image;});
  function choicesHTML(){
    return ingredients.map(([color,label,food,file])=>{
      return `<button type="button" class="colorbtn ingredient-hit" data-color="${color}" aria-label="${label} — ${food}" style="--ingredient-glow:var(--choice-${color})"><img class="ingredient-image" data-ingredient="${color}" src="${asset(file)}" alt="" width="512" height="512" draggable="false"><span class="ingredient-name">${label}</span></button>`;
    }).join('');
  }
  let closeCurrent=null;
  function open(root,{cardType,choose,cancel}){
    // Recusa explícita: especiais sem escolha jamais usam este componente.
    if(!['wild','wild4','wild6'].includes(cardType))return false;
    const type=cardType;
    const title=type==='wild4'?'+4 — Escolher cor':type==='wild6'?'+6 — Escolher cor':'Escolher cor';
    const hint='Escolha um ingrediente para definir a próxima cor';
    closeCurrent?.();
    const previous=document.activeElement;
    const overlay=document.createElement('div');overlay.className='modal-wrap color-picker';overlay.dataset.cardType=type;overlay.classList.toggle('penalty-picker',type!=='wild');
    overlay.innerHTML=`<section class="color-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="colorPickerTitle" aria-describedby="colorPickerHint">
      <h2 id="colorPickerTitle">${title}</h2><p id="colorPickerHint">${hint}</p>
      <div class="color-picker-card">${PanelinhaCards.html({type},{label:title})}</div>
      <div class="color-picker-choices" role="group" aria-label="Escolha da cor">${choicesHTML()}</div>
      <button type="button" class="btn alt" id="cancelColor">Cancelar</button>
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
      const layer=button.querySelector('.ingredient-image');
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
