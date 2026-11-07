/* Componente visual único. Nunca decide jogadas, tipos lógicos ou visibilidade. */
(() => {'use strict';
  const geometry=Object.freeze({contentWidth:470,contentHeight:800,border:25,width:520,height:850,radius:70,innerRadius:45});
  // Enquadramento óptico dos novos PNGs: margens transparentes não viram offsets antigos.
  // Os limites visíveis foram medidos em alfa >64, sem recortar ou editar a imagem.
  const symbolArt=Object.freeze({width:512,height:512,bounds:Object.freeze({
    numero_0:Object.freeze([63,35,446,476]),numero_1:Object.freeze([96,34,413,475]),
    numero_2:Object.freeze([75,35,433,476]),numero_3:Object.freeze([80,35,429,475]),
    numero_4:Object.freeze([55,35,452,476]),numero_5:Object.freeze([75,34,436,476]),
    numero_6:Object.freeze([67,34,443,477]),numero_7:Object.freeze([70,35,438,476]),
    numero_8:Object.freeze([70,35,440,475]),numero_9:Object.freeze([75,34,434,476]),
    mais2:Object.freeze([36,76,473,433]),bloqueio:Object.freeze([41,34,466,477]),
    inverter:Object.freeze([37,36,473,472])
  })});
  // Coordenadas independentes no conteúdo 470×800; escala isotrópica, PNG integral.
  const symbolLayout=Object.freeze({
    scale:1,
    center:Object.freeze({x:235,y:374,width:320,height:300}),
    top:Object.freeze({insetX:40,insetY:38,width:92,height:92}),
    bottom:Object.freeze({insetX:40,insetY:38,width:92,height:92}),
    overrides:Object.freeze({
      mais2:Object.freeze({center:Object.freeze({width:350})}),
      bloqueio:Object.freeze({center:Object.freeze({width:315,height:315})})
    })
  });
  const root='assets/cartas/',colors={red:'vermelho',blue:'azul',yellow:'amarelo',green:'verde'};
  const actions={draw2:'mais2',skip:'bloqueio',reverse:'inverter'};
  const specials={wild4:'carta_mais4',wild6:'carta_mais6',wild:'carta_curinga',rotate:'carta_liquidificador',dist:'carta_panela_de_pressao'};
  const symbolKey=card=>card.type==='num'&&Number.isInteger(card.num)&&card.num>=0&&card.num<=9?'numero_'+card.num:actions[card.type];
  const back=root+'especiais/verso_roxo.png';
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function layers(card){
    if(!card||card.hidden)return [back];
    if(specials[card.type])return [root+'especiais/'+specials[card.type]+'.png'];
    const face=symbolKey(card);
    if(!colors[card.color]||!face)throw Error('Carta visual desconhecida: '+card.type);
    const symbol=root+'elementos/'+face+'.png';
    return [root+'fundos/fundo_'+colors[card.color]+'_novo_470x800.png',symbol,symbol,symbol];
  }
  const cache=new Map();
  function preload(path){
    if(!cache.has(path)){const image=new Image();image.src=path;cache.set(path,image);if(image.decode)image.decode().catch(()=>{});}
    return path;
  }
  // Mantém somente 23 imagens decodificadas para reutilizar nas mãos e animações.
  for(const color of Object.keys(colors))for(const type of [...Array.from({length:10},(_,num)=>({type:'num',num})),...Object.keys(actions).map(type=>({type}))])layers({...type,color}).forEach(preload);
  for(const type of Object.keys(specials))layers({type}).forEach(preload);preload(back);
  function symbolVariables(key){
    const custom=symbolLayout.overrides[key]||{},[left,top,right,bottom]=symbolArt.bounds[key],vars={};
    const pct=(value,axis)=>value/axis*100+'%';
    for(const slot of ['center','top','bottom']){
      const target={...symbolLayout[slot],...custom[slot]};
      const scale=Math.min(target.width/(right-left),target.height/(bottom-top))*symbolLayout.scale;
      const width=symbolArt.width*scale,height=symbolArt.height*scale;
      // O centro ancora o desenho; os cantos ancoram o contorno visível nas margens.
      const x=slot==='center'?target.x-(left+right)/2*scale:slot==='top'?target.insetX-left*scale:geometry.contentWidth-target.insetX-right*scale;
      const y=slot==='center'?target.y-(top+bottom)/2*scale:slot==='top'?target.insetY-top*scale:geometry.contentHeight-target.insetY-bottom*scale;
      vars['--symbol-'+slot+'-x']=pct(x,geometry.contentWidth);vars['--symbol-'+slot+'-y']=pct(y,geometry.contentHeight);
      vars['--symbol-'+slot+'-width']=pct(width,geometry.contentWidth);vars['--symbol-'+slot+'-height']=pct(height,geometry.contentHeight);
    }
    return vars;
  }
  const symbolStyles=new Map(Object.keys(symbolArt.bounds).map(key=>[key,Object.entries(symbolVariables(key)).map(([name,value])=>name+':'+value).join(';')]));
  function html(card,{small=false,selected=false,invalid=false,back:closed=false,classes='',label='',depth=0}={}){
    const hidden=closed||!card||card.hidden,images=hidden?[back]:layers(card),gold=!hidden&&!!specials[card.type];
    const style=[depth?'--depth:'+(Number(depth)||0):'',!hidden&&!gold?symbolStyles.get(symbolKey(card)):''].filter(Boolean).join(';');
    const positions=['','center','top','bottom'];
    return `<span class="card art-card${small?' mini':''}${selected?' selected':''}${invalid?' is-invalid':''}${gold?' gold-card':''} ${classes}" ${style?`style="${style}"`:""} data-card-type="${hidden?'back':escape(card.type)}" title="${escape(label)}"><span class="card-frame" aria-hidden="true"></span><span class="card-face">${images.map((path,i)=>`<img class="card-image${i?' card-symbol card-symbol-'+positions[i]:''}" src="${preload(path)}" alt="${i?'':escape(label)}" draggable="false" decoding="sync">`).join('')}</span></span>`;
  }
  const ratio=geometry.width/geometry.height,aspect=1/ratio;
  const style=document.documentElement.style;
  for(const [name,value]of Object.entries({'--card-aspect':aspect,'--card-ratio':`${geometry.width} / ${geometry.height}`,'--card-inset-x':geometry.border/geometry.width*100+'%','--card-inset-y':geometry.border/geometry.height*100+'%','--card-face-width':geometry.contentWidth/geometry.width*100+'%','--card-face-height':geometry.contentHeight/geometry.height*100+'%','--card-radius-x':geometry.radius/geometry.width*100+'%','--card-radius-y':geometry.radius/geometry.height*100+'%','--card-inner-radius-x':geometry.innerRadius/geometry.contentWidth*100+'%','--card-inner-radius-y':geometry.innerRadius/geometry.contentHeight*100+'%'}))style.setProperty(name,String(value));
  // Só bloqueia gestos nativos nas cartas; os eventos de toque/pan do jogo seguem intactos.
  for(const event of ['dragstart','selectstart','contextmenu'])document.addEventListener(event,e=>{if(e.target.closest?.('.card'))e.preventDefault();});
  window.PanelinhaCards=Object.freeze({geometry,symbolLayout,symbolArt,ratio,aspect,back,layers,html});
})();
