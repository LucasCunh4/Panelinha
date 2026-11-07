/* Componente visual único. Nunca decide jogadas, tipos lógicos ou visibilidade. */
(() => {'use strict';
  const geometry=Object.freeze({contentWidth:470,contentHeight:800,border:25,width:520,height:850,radius:70,innerRadius:45});
  // Coordenadas no conteúdo 470×800. Cada instância conserva a proporção do PNG.
  const symbolLayout=Object.freeze({
    scale:1,
    center:Object.freeze({x:235,y:380,width:340,height:340}),
    corner:Object.freeze({width:126,height:126,insetX:28,insetY:34}),
    overrides:Object.freeze({
      draw2:Object.freeze({center:Object.freeze({width:350,height:350})}),
      reverse:Object.freeze({center:Object.freeze({width:350,height:350})})
    })
  });
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
    const symbol=root+'elementos/'+face+'_unitario.png';
    return [root+'fundos/fundo_'+colors[card.color]+'_retrabalhado_470x800.png',symbol,symbol,symbol];
  }
  const cache=new Map();
  function preload(path){
    if(!cache.has(path)){const image=new Image();image.src=path;cache.set(path,image);if(image.decode)image.decode().catch(()=>{});}
    return path;
  }
  // Mantém somente 23 imagens decodificadas para reutilizar nas mãos e animações.
  for(const color of Object.keys(colors))for(const type of [...Array.from({length:10},(_,num)=>({type:'num',num})),...Object.keys(actions).map(type=>({type}))])layers({...type,color}).forEach(preload);
  for(const type of Object.keys(specials))layers({type}).forEach(preload);preload(back);
  function symbolVariables(type){
    const custom=symbolLayout.overrides[type]||{},center={...symbolLayout.center,...custom.center},corner={...symbolLayout.corner,...custom.corner};
    const pct=(value,axis)=>value/axis*100+'%',scaled=value=>value*symbolLayout.scale;
    return {
      '--symbol-center-x':pct(center.x,geometry.contentWidth),'--symbol-center-y':pct(center.y,geometry.contentHeight),
      '--symbol-center-width':pct(scaled(center.width),geometry.contentWidth),'--symbol-center-height':pct(scaled(center.height),geometry.contentHeight),
      '--symbol-corner-width':pct(scaled(corner.width),geometry.contentWidth),'--symbol-corner-height':pct(scaled(corner.height),geometry.contentHeight),
      '--symbol-inset-x':pct(corner.insetX,geometry.contentWidth),'--symbol-inset-y':pct(corner.insetY,geometry.contentHeight)
    };
  }
  const symbolStyles=new Map(['num',...Object.keys(actions)].map(type=>[type,Object.entries(symbolVariables(type)).map(([key,value])=>key+':'+value).join(';')]));
  function html(card,{small=false,selected=false,invalid=false,back:closed=false,classes='',label='',depth=0}={}){
    const hidden=closed||!card||card.hidden,images=hidden?[back]:layers(card),gold=!hidden&&!!specials[card.type];
    const style=[depth?'--depth:'+(Number(depth)||0):'',!hidden&&!gold?symbolStyles.get(card.type):''].filter(Boolean).join(';');
    const positions=['','center','top','bottom'];
    return `<span class="card art-card${small?' mini':''}${selected?' selected':''}${invalid?' is-invalid':''}${gold?' gold-card':''} ${classes}" ${style?`style="${style}"`:""} data-card-type="${hidden?'back':escape(card.type)}" title="${escape(label)}"><span class="card-frame" aria-hidden="true"></span><span class="card-face">${images.map((path,i)=>`<img class="card-image${i?' card-symbol card-symbol-'+positions[i]:''}" src="${preload(path)}" alt="${i?'':escape(label)}" draggable="false" decoding="sync">`).join('')}</span></span>`;
  }
  const ratio=geometry.width/geometry.height,aspect=1/ratio;
  const style=document.documentElement.style;
  for(const [name,value]of Object.entries({'--card-aspect':aspect,'--card-ratio':`${geometry.width} / ${geometry.height}`,'--card-inset-x':geometry.border/geometry.width*100+'%','--card-inset-y':geometry.border/geometry.height*100+'%','--card-face-width':geometry.contentWidth/geometry.width*100+'%','--card-face-height':geometry.contentHeight/geometry.height*100+'%','--card-radius-x':geometry.radius/geometry.width*100+'%','--card-radius-y':geometry.radius/geometry.height*100+'%','--card-inner-radius-x':geometry.innerRadius/geometry.contentWidth*100+'%','--card-inner-radius-y':geometry.innerRadius/geometry.contentHeight*100+'%'}))style.setProperty(name,String(value));
  // Só bloqueia gestos nativos nas cartas; os eventos de toque/pan do jogo seguem intactos.
  for(const event of ['dragstart','selectstart','contextmenu'])document.addEventListener(event,e=>{if(e.target.closest?.('.card'))e.preventDefault();});
  window.PanelinhaCards=Object.freeze({geometry,symbolLayout,ratio,aspect,back,layers,html});
})();
