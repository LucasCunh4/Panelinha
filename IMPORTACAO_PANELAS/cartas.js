/* Componente visual único. Nunca decide jogadas, tipos lógicos ou visibilidade. */
(() => {'use strict';
  const geometry=Object.freeze({contentWidth:470,contentHeight:800,border:25,width:520,height:850,radius:25});
  const root='assets/cartas/',colors={red:'vermelho',blue:'azul',yellow:'amarelo',green:'verde'};
  const actions={draw2:'mais2',skip:'bloqueio',reverse:'inverter'};
  const specials={wild4:'carta_mais4',wild6:'carta_mais6',wild:'carta_curinga',rotate:'carta_liquidificador',dist:'carta_panela_de_pressao'};
  const back=root+'especiais/verso_roxo.png';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function layers(card){
    if(!card||card.hidden)return [back];
    if(specials[card.type])return [root+'especiais/'+specials[card.type]+'.png'];
    const face=card.type==='num'&&Number.isInteger(card.num)&&card.num>=0&&card.num<=9?'numero_'+card.num:actions[card.type];
    if(!colors[card.color]||!face)throw Error('Carta visual desconhecida: '+card.type);
    return [root+'fundos/fundo_'+colors[card.color]+'_retrabalhado_470x800.png',root+'elementos/'+face+'_retrabalhado_470x800.png'];
  }
  const cache=new Map();
  function preload(path){
    if(!cache.has(path)){const image=new Image();image.src=path;cache.set(path,image);if(image.decode)image.decode().catch(()=>{});}
    return path;
  }
  // Mantém somente 23 imagens decodificadas para reutilizar nas mãos e animações.
  for(const color of Object.keys(colors))for(const type of [...Array.from({length:10},(_,num)=>({type:'num',num})),...Object.keys(actions).map(type=>({type}))])layers({...type,color}).forEach(preload);
  for(const type of Object.keys(specials))layers({type}).forEach(preload);preload(back);
  function html(card,{small=false,selected=false,invalid=false,back:closed=false,classes='',label='',depth=0}={}){
    const hidden=closed||!card||card.hidden,images=hidden?[back]:layers(card),gold=!hidden&&!!specials[card.type];
    return `<span class="card art-card${small?' mini':''}${selected?' selected':''}${invalid?' is-invalid':''}${gold?' gold-card':''} ${classes}" ${depth?`style="--depth:${Number(depth)||0}"`:""} data-card-type="${hidden?'back':escape(card.type)}" title="${escape(label)}"><span class="card-frame" aria-hidden="true"></span><span class="card-face">${images.map((path,i)=>`<img class="card-image${i?' card-symbol':''}" src="${preload(path)}" alt="${i?'':escape(label)}" draggable="false" decoding="sync">`).join('')}</span></span>`;
  }
  const ratio=geometry.width/geometry.height,aspect=1/ratio;
  const style=document.documentElement.style;
  for(const [name,value]of Object.entries({'--card-aspect':aspect,'--card-ratio':`${geometry.width} / ${geometry.height}`,'--card-inset-x':geometry.border/geometry.width*100+'%','--card-inset-y':geometry.border/geometry.height*100+'%','--card-face-width':geometry.contentWidth/geometry.width*100+'%','--card-face-height':geometry.contentHeight/geometry.height*100+'%','--card-radius-x':geometry.radius/geometry.width*100+'%','--card-radius-y':geometry.radius/geometry.height*100+'%'}))style.setProperty(name,String(value));
  window.PanelinhaCards=Object.freeze({geometry,ratio,aspect,back,layers,html});
})();
