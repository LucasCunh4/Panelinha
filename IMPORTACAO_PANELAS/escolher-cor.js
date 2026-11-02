/* Seletor de apresentação: o motor continua sendo o único responsável pela jogada. */
(() => {
  'use strict';
  const assets='assets/especiais/';
  // Coordenadas do MANIFESTO_ASSETS.json. As quatro imagens ocupam a mesma base 2:3.
  const ingredients=[
    ['tomates','red','Vermelho — tomates',.05371,.15625,.37598,.24089],
    ['queijos','yellow','Amarelo — queijos',.56152,.15951,.39844,.23763],
    ['mirtilos','blue','Azul — mirtilos',.04492,.39062,.40039,.22917],
    ['alfaces','green','Verde — alfaces',.55273,.39062,.41992,.22917]
  ];
  // Bases e overlays NOVOS alinhados ao mesmo canvas 400x850.
  const penaltyLayouts={
    "wild4": {
      "base": "assets/cartas_mais4_mais6/carta_mais4_base_sem_ingredientes.png",
      "layers": {
        "tomates": {
          "path": "assets/cartas_mais4_mais6/carta_mais4_tomates_overlay_full.png",
          "rect": [
            54,
            203,
            116,
            115
          ]
        },
        "queijos": {
          "path": "assets/cartas_mais4_mais6/carta_mais4_queijos_overlay_full.png",
          "rect": [
            202,
            206,
            151,
            92
          ]
        },
        "mirtilos": {
          "path": "assets/cartas_mais4_mais6/carta_mais4_mirtilos_overlay_full.png",
          "rect": [
            33,
            413,
            100,
            78
          ]
        },
        "alfaces": {
          "path": "assets/cartas_mais4_mais6/carta_mais4_alfaces_overlay_full.png",
          "rect": [
            268,
            413,
            111,
            96
          ]
        }
      }
    },
    "wild6": {
      "base": "assets/cartas_mais4_mais6/carta_mais6_base_sem_ingredientes.png",
      "layers": {
        "tomates": {
          "path": "assets/cartas_mais4_mais6/carta_mais6_tomates_overlay_full.png",
          "rect": [
            51,
            176,
            123,
            119
          ]
        },
        "queijos": {
          "path": "assets/cartas_mais4_mais6/carta_mais6_queijos_overlay_full.png",
          "rect": [
            199,
            180,
            155,
            108
          ]
        },
        "mirtilos": {
          "path": "assets/cartas_mais4_mais6/carta_mais6_mirtilos_overlay_full.png",
          "rect": [
            30,
            370,
            108,
            99
          ]
        },
        "alfaces": {
          "path": "assets/cartas_mais4_mais6/carta_mais6_alfaces_overlay_full.png",
          "rect": [
            260,
            368,
            123,
            117
          ]
        }
      }
    }
  };
  function ingredientHTML(layout,[name,color,label,x,y,w,h]){
    const data=layout?.layers[name],path=data?.path||`${assets}escolher_cor_${name}_overlay_full.png`;
    if(data){const r=data.rect;[x,y,w,h]=[r[0]/400,r[1]/850,r[2]/400,r[3]/850];}
    const hit=layout?`left:clamp(22px,${(x+w/2)*100}%,calc(100% - 22px));top:clamp(22px,${(y+h/2)*100}%,calc(100% - 22px));width:max(44px,${w*100}%);height:max(44px,${h*100}%);transform:translate(-50%,-50%)`:`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;
    return `<div class="ingredient-layer" data-ingredient="${color}" style="--origin-x:${(x+w/2)*100}%;--origin-y:${(y+h/2)*100}%"><img src="${path}" alt="" draggable="false"></div><button type="button" class="colorbtn ingredient-hit" data-color="${color}" aria-label="${label}" style="${hit}"></button>`;
  }
  let closeCurrent=null;
  function open(root,{cardType,choose,cancel}){
    // Recusa explícita: especiais sem escolha jamais usam este componente.
    if(!['wild','wild4','wild6'].includes(cardType))return false;
    const type=cardType;
    const layout=penaltyLayouts[type],base=layout?.base||`${assets}escolher_cor_base.png`;
    const title=type==='wild4'?'+4 — Escolher cor':type==='wild6'?'+6 — Escolher cor':'Escolher cor';
    const hint='Toque em um ingrediente';
    closeCurrent?.();
    const previous=document.activeElement;
    const overlay=document.createElement('div');overlay.className='modal-wrap color-picker';overlay.dataset.cardType=type;overlay.classList.toggle('penalty-picker',!!layout);
    overlay.innerHTML=`<section class="color-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="colorPickerTitle" aria-describedby="colorPickerHint">
      <h2 id="colorPickerTitle">${title}</h2><p id="colorPickerHint">${hint}</p>
      <div class="color-picker-card"><img class="color-picker-base" src="${base}" alt="" draggable="false">
      ${ingredients.map(ingredient=>ingredientHTML(layout,ingredient)).join('')}
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
