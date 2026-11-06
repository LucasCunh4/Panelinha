/* Cenário oficial: um só plano 1672×941; nenhuma dependência do motor da mesa. */
(() => {
  'use strict';
  const root='assets/menu-oficial/',titleRoot='assets/titulo/letras/',fxRoot='assets/titulo-efeitos/';
  const scene=document.getElementById('frontScene');
  // Conserva apenas os símbolos dos ícones HTML dos botões, sem a cozinha SVG antiga.
  const defs=scene.querySelector('defs')?.cloneNode(true);
  scene.textContent='';
  if(defs){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('menu-icon-defs');svg.append(defs);scene.append(svg);}
  const plane=document.createElement('div');plane.className='menu-art-plane';scene.append(plane);
  function img(src,cls,parent){const node=new Image();node.src=src;node.alt='';node.draggable=false;node.className=cls;node.decoding='async';parent.append(node);return node;}
  img(root+'fundo/cozinha_menu_aprovada.png','menu-approved-background',plane);
  const tools=['01_concha','02_espatula_vazada','03_colher_madeira','04_pegador_massas','05_batedor_arame','06_escumadeira'];
  const positions=[69.258,73.385,77.153,81.041,84.988,88.876],periods=[3.5,3.9,4.2,3.7,4.4,4],phases=[0,.42,.78,.18,.61,.95];
  tools.forEach((file,i)=>{
    const anchor=document.createElement('span');anchor.className='menu-tool-anchor';
    Object.assign(anchor.style,{left:(positions[i]+.55)+'%',top:'30.287%',height:'16.472%'});
    const tool=img(root+'utensilios/'+file+'.png','menu-utensil',anchor);
    tool.style.setProperty('--period',periods[i]+'s');tool.style.setProperty('--phase',-phases[i]+'s');plane.append(anchor);
  });
  const plumes=['01_vapor_leve','02_vapor_suave','03_vapor_espiral','04_vapor_espiral_alternativo','05_vapor_multiplas_espirais','06_vapor_tres_espirais','07_vapor_redemoinho','08_vapor_redemoinho_brilhante'];
  // Cada instância mantém sua imagem durante todo o ciclo; substituição só em opacity=0.
  [{x:80.7,y:48.7,h:20,d:5.2},{x:93.6,y:54.5,h:15.5,d:4.6}].forEach((pot,p)=>{
    const emitter=document.createElement('div');emitter.className='menu-steam-emitter';emitter.dataset.pot=String(p);
    Object.assign(emitter.style,{left:pot.x+'%',top:pot.y+'%',height:pot.h+'%'});plane.append(emitter);
    for(let i=0;i<3;i++){
      const vapor=img(root+'fumaca/'+plumes[(p*3+i)%8]+'.png','menu-vapor',emitter);
      vapor.dataset.variant=String(p*3+i);vapor.style.setProperty('--period',(pot.d+i*.18)+'s');vapor.style.setProperty('--phase',(-i*pot.d/3)+'s');
      vapor.addEventListener('animationiteration',()=>{const variant=(Number(vapor.dataset.variant)+3)%8;vapor.dataset.variant=String(variant);vapor.src=root+'fumaca/'+plumes[variant]+'.png';});
    }
  });
  const title=document.getElementById('homeTitle');title.textContent='';
  const label=document.createElement('span');label.className='sr-only';label.textContent='PANELINHA';title.append(label);
  const letters=document.createElement('span');letters.className='title-letters';letters.setAttribute('aria-hidden','true');title.append(letters);
  Array.from('PANELINHA').forEach((letter,i)=>{
    const wrap=document.createElement('span');wrap.className='title-letter';wrap.dataset.letter=letter;wrap.style.setProperty('--entry-delay',i*35+'ms');wrap.style.setProperty('--arc-depth',String(1-Math.pow((i-4)/4,2)));wrap.style.setProperty('--arc-angle',((i-4)*1.1)+'deg');
    img(titleRoot+String(i+1).padStart(2,'0')+'_'+letter+'.png','title-letter-art',wrap);letters.append(wrap);
    if(i===0)img(fxRoot+'tampa/tampa_sobre_letra_P.png','title-lid',wrap);
  });
  ['01_brilho_quatro_pontas','02_cluster_tres_estrelas','03_estrela_intensa','04_brilho_alongado','05_explosao_de_brilhos'].forEach((file,i)=>{
    const sparkle=img(fxRoot+'brilhos/'+file+'.png','title-sparkle sparkle-'+i,title);
    sparkle.style.setProperty('--phase',(-i*.73)+'s');sparkle.style.setProperty('--period',(3.8+i*.41)+'s');
  });
})();
