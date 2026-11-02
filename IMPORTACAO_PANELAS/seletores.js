/* Apresentação dos selects existentes. Valores/callbacks continuam no jogo. */
(() => {
  'use strict';
  const records=new WeakMap(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');layer.className='panelinha-select-layer';
  const list=document.createElement('div');list.id='panelinhaSelectList';list.className='panelinha-select-list';list.setAttribute('role','listbox');list.hidden=true;
  layer.append(list);document.body.append(layer);
  let active=null,motion=null,serial=0;
  function stopMotion(){motion?.cancel();motion=null;}
  function close({restoreFocus=true,animate=true}={}){
    if(!active)return false;
    const record=active.record;active=null;stopMotion();
    record.button.setAttribute('aria-expanded','false');record.button.removeAttribute('aria-activedescendant');
    list.setAttribute('aria-hidden','true');list.style.pointerEvents='none';
    if(animate&&!reduced.matches){
      motion=list.animate([{opacity:1},{opacity:0,transform:'translateY(3px)'}],{duration:100,easing:'ease-out'});
      motion.onfinish=()=>{list.hidden=true;motion=null;};
    }else list.hidden=true;
    if(restoreFocus&&record.button.isConnected&&!record.button.disabled)record.button.focus({preventScroll:true});
    return true;
  }
  function available(record){return [...record.select.options].map((o,i)=>!o.disabled&&!o.hidden?i:-1).filter(i=>i>=0);}
  function mark(index,scroll=true){
    if(!active)return;
    active.index=index;
    list.querySelectorAll('[role=option]').forEach(node=>node.classList.toggle('is-active',Number(node.dataset.index)===index));
    const item=list.querySelector(`[data-index="${index}"]`);
    if(!item){active.record.button.removeAttribute('aria-activedescendant');return;}
    active.record.button.setAttribute('aria-activedescendant',item.id);
    if(!scroll)return;
    const top=item.offsetTop,bottom=top+item.offsetHeight;
    if(top<list.scrollTop+6)list.scrollTop=top-6;
    else if(bottom>list.scrollTop+list.clientHeight-6)list.scrollTop=bottom-list.clientHeight+6;
  }
  function position(){
    if(!active)return;
    const anchor=active.record.button.getBoundingClientRect();
    if(!anchor.width||!anchor.height){close({restoreFocus:false,animate:false});return;}
    const v=window.visualViewport,style=getComputedStyle(layer);
    const left=(v?.offsetLeft||0)+parseFloat(style.paddingLeft),top=(v?.offsetTop||0)+parseFloat(style.paddingTop);
    const right=(v?.offsetLeft||0)+(v?.width||innerWidth)-parseFloat(style.paddingRight),bottom=(v?.offsetTop||0)+(v?.height||innerHeight)-parseFloat(style.paddingBottom);
    const width=Math.min(Math.max(anchor.width,220),400,right-left);
    list.style.width=`${width}px`;list.style.maxHeight=`${bottom-top}px`;
    const desired=Math.min(list.scrollHeight+2,bottom-top),below=Math.max(0,bottom-anchor.bottom-6),above=Math.max(0,anchor.top-top-6);
    const down=below>=Math.min(desired,132)||below>=above;
    const room=down?below:above;
    const height=room>=88?Math.min(desired,room):desired;
    list.style.maxHeight=`${height}px`;
    const y=room>=88?(down?anchor.bottom+6:anchor.top-6-height):anchor.top+(anchor.height-height)/2;
    list.style.left=`${Math.max(left,Math.min(anchor.left,right-width))}px`;
    list.style.top=`${Math.max(top,Math.min(y,bottom-height))}px`;
    list.dataset.placement=down?'below':'above';
    mark(active.index);
  }
  function paint(){
    if(!active)return;
    const record=active.record;list.textContent='';list.setAttribute('aria-label',record.label);
    [...record.select.options].forEach((option,index)=>{
      if(option.hidden)return;
      const item=document.createElement('button');item.type='button';item.tabIndex=-1;item.className='panelinha-select-option';
      item.id=`${record.select.id}-option-${index}`;item.dataset.index=String(index);item.dataset.value=option.value;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));
      item.disabled=option.disabled;item.setAttribute('aria-disabled',String(option.disabled));
      const check=document.createElement('span');check.className='select-option-check';check.setAttribute('aria-hidden','true');check.textContent='✓';
      const text=document.createElement('span');text.textContent=option.label;item.append(check,text);list.append(item);
    });
  }
  function sync(record){
    const {select,button,value}=record,option=select.options[select.selectedIndex];
    if(value.textContent!==(option?.label||'Selecionar'))value.textContent=option?.label||'Selecionar';
    button.disabled=select.disabled;button.setAttribute('aria-disabled',String(select.disabled));button.setAttribute('aria-label',`${record.label}: ${value.textContent}`);
    const key=JSON.stringify([select.disabled,select.selectedIndex,[...select.options].map(o=>[o.value,o.label,o.disabled,o.hidden])]);
    if(active?.record===record){
      if(select.disabled){close();return;}
      if(record.key!==key){paint();if(!available(record).includes(active.index))active.index=select.selectedIndex;position();}
    }
    record.key=key;
  }
  function open(record){
    sync(record);if(record.select.disabled)return;
    close({restoreFocus:false,animate:false});stopMotion();
    active={record,index:record.select.selectedIndex,historyState:history.state,url:location.href,search:'',typedAt:0};
    const valid=available(record);if(!valid.includes(active.index))active.index=valid[0]??-1;
    list.hidden=false;list.removeAttribute('aria-hidden');list.style.pointerEvents='auto';
    record.button.setAttribute('aria-expanded','true');record.button.focus({preventScroll:true});paint();position();
    if(!reduced.matches)motion=list.animate([{opacity:0,transform:`translateY(${list.dataset.placement==='above'?4:-4}px) scale(.98)`},{opacity:1,transform:'none'}],{duration:130,easing:'ease-out'});
  }
  function choose(index){
    if(!active)return;
    const record=active.record,option=record.select.options[index];
    if(!option||option.disabled||option.hidden)return;
    const changed=record.select.selectedIndex!==index;record.select.selectedIndex=index;close();
    if(changed){record.select.dispatchEvent(new Event('input',{bubbles:true}));record.select.dispatchEvent(new Event('change',{bubbles:true}));}
    sync(record);
  }
  function keys(event,record){
    if(record.button.disabled)return;
    if(event.key==='Tab'){if(active)close({restoreFocus:false});return;}
    if(event.key==='Escape'&&active){event.preventDefault();event.stopImmediatePropagation();close();return;}
    if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key)){
      event.preventDefault();event.stopPropagation();
      if(active?.record!==record){open(record);if(event.key==='Enter'||event.key===' ')return;}
      else if(event.key==='Enter'||event.key===' '){choose(active.index);return;}
      const valid=available(record),at=valid.indexOf(active.index);
      mark(event.key==='Home'?valid[0]:event.key==='End'?valid[valid.length-1]:valid[(at+(event.key==='ArrowUp'?-1:1)+valid.length)%valid.length]);
    }else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();if(active?.record!==record)open(record);
      const now=Date.now();active.search=now-active.typedAt>650?event.key:active.search+event.key;active.typedAt=now;
      const normalize=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
      const index=available(record).find(i=>normalize(record.select.options[i].label).startsWith(normalize(active.search)));
      if(index!==undefined)mark(index);
    }
  }
  function enhance(root=document){
    root.querySelectorAll('select').forEach(select=>{
      if(records.has(select)||select.closest('.route-ghost'))return;
      if(!select.id)select.id=`panelinha-select-${++serial}`;
      const originalLabel=select.labels?.[0],labelNode=originalLabel?.cloneNode(true);labelNode?.querySelectorAll('select').forEach(n=>n.remove());
      const label=select.getAttribute('aria-label')||labelNode?.textContent.trim()||'Selecionar opção';
      const wrapper=document.createElement('span');wrapper.className='panelinha-select';select.before(wrapper);wrapper.append(select);
      select.classList.add('select-native-model');select.setAttribute('aria-hidden','true');select.tabIndex=-1;
      const button=document.createElement('button');button.type='button';button.className='select-trigger';button.dataset.selectFor=select.id;
      button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',list.id);
      const value=document.createElement('span');value.className='select-value';
      const arrow=document.createElement('span');arrow.className='select-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';button.append(value,arrow);wrapper.append(button);
      const record={select,button,value,label,key:null};records.set(select,record);sync(record);
      button.addEventListener('click',event=>{event.preventDefault();active?.record===record?close():open(record);});
      button.addEventListener('keydown',event=>keys(event,record));
      originalLabel?.addEventListener('click',event=>{if(!event.target.closest('button')&&event.target!==select){event.preventDefault();button.focus({preventScroll:true});}});
      select.addEventListener('click',event=>{event.preventDefault();if(active?.record!==record)open(record)});
      select.addEventListener('focus',()=>button.focus({preventScroll:true}));
      select.addEventListener('change',()=>sync(record));
      new MutationObserver(()=>sync(record)).observe(select,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','selected','label','value','hidden']});
    });
  }
  list.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')event.preventDefault();});
  list.addEventListener('keydown',event=>{if(active){active.record.button.focus({preventScroll:true});keys(event,active.record);}});
  list.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const item=event.target.closest('[role=option]');if(item&&!item.disabled)mark(Number(item.dataset.index),false);});
  list.addEventListener('click',event=>{const item=event.target.closest('[role=option]');if(item){event.preventDefault();event.stopPropagation();choose(Number(item.dataset.index));}});
  const outside=event=>{if(active&&!list.contains(event.target)&&!active.record.button.contains(event.target)&&event.target!==active.record.select)close({restoreFocus:false});};
  document.addEventListener('pointerdown',outside,true);document.addEventListener('click',outside,true);
  document.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
  // Consome só este Voltar, restaurando a âncora da tela como a navegação da mesa já faz.
  function consumeBack(event){if(!active)return false;const state=active.historyState,url=active.url;event.stopImmediatePropagation();close({animate:false});history.pushState(state,'',url);return true;}
  const reposition=()=>{if(active)position()};
  addEventListener('resize',reposition);addEventListener('scroll',event=>{if(active&&!list.contains(event.target))position();},true);
  window.visualViewport?.addEventListener('resize',reposition);window.visualViewport?.addEventListener('scroll',reposition);
  reduced.addEventListener('change',()=>{if(reduced.matches){stopMotion();if(!active)list.hidden=true;}});
  window.PanelinhaSelects={enhance,close,consumeBack,get isOpen(){return !!active;}};enhance();
})();
