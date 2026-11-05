/* Identificação local. Não depende de conta, rede ou estado de multiplayer. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),key='panelinha.player.v1';
  const avatars=[
    ['frigideira-chef','Frigideira chef','01_frigideira_chef.png'],
    ['leiteira-bigode','Leiteira de bigode','02_leiteira_bigode.png'],
    ['panela-pressao','Panela de pressão','03_panela_pressao.png'],
    ['panela-dj','Panela DJ','04_panela_dj.png'],
    ['wok-monoculo','Wok de monóculo','05_wok_monoculo.png'],
    ['panela-aventureira','Panela aventureira','06_panela_aventureira.png'],
    ['panela-gamer','Panela gamer','07_panela_gamer.png'],
    ['panela-piloto','Panela piloto','08_panela_piloto.png'],
    ['panela-escoteira','Panela escoteira','09_panela_escoteira.png']
  ];
  const legacy={chef:'frigideira-chef',frigideira:'frigideira-chef',panela:'panela-pressao',chaleira:'leiteira-bigode',concha:'panela-aventureira',estrela:'panela-piloto'};
  const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  function normalize(value){const id=legacy[value?.avatar]||value?.avatar;return {name:(typeof value?.name==='string'?value.name.replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,32):'')||'Você',avatar:avatars.some(a=>a[0]===id)?id:'frigideira-chef'};}
  let saved=normalize(null),selected=saved.avatar;
  try{const stored=JSON.parse(localStorage.getItem(key));saved=normalize(stored);if(stored&&stored.avatar!==saved.avatar)localStorage.setItem(key,JSON.stringify({...stored,avatar:saved.avatar}));}catch{}
  function avatarHTML(id){const a=avatars.find(a=>a[0]===(legacy[id]||id))||avatars[0];return `<span class="pan-avatar player-avatar official-avatar" data-avatar="${a[0]}" aria-hidden="true"><img src="assets/avatares/${a[2]}" alt="" width="1254" height="1254" decoding="async" draggable="false"></span>`;}
  function preview(){
    $('profilePreviewName').textContent=normalize({name:$('playerName').value}).name;
    $('profilePreviewAvatar').innerHTML=avatarHTML(selected);
    $('avatarGallery').querySelectorAll('[data-avatar-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.avatarChoice===selected)));
  }
  $('avatarGallery').innerHTML=avatars.map(([id,label])=>`<button type="button" data-avatar-choice="${id}" aria-label="Avatar ${label}" aria-pressed="false">${avatarHTML(id)}<span>${label}</span></button>`).join('');
  $('avatarGallery').querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=b.dataset.avatarChoice;preview()});
  $('playerName').addEventListener('input',preview);
  function open(){selected=saved.avatar;$('playerName').value=saved.name;preview();}
  function commit(){saved=normalize({name:$('playerName').value,avatar:selected});try{localStorage.setItem(key,JSON.stringify(saved));}catch{}return {...saved};}
  open();
  window.PanelinhaProfile={open,commit,avatarHTML,escape,get current(){return {...saved}}};
})();
