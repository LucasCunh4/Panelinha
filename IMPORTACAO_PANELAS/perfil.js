/* Identificação local. Não depende de conta, rede ou estado de multiplayer. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),key='panelinha.player.v1';
  const avatars=[
    ['chef','Chef','#eab77b','<path d="M13 24C3 23 4 10 14 10c3-10 17-10 20 0 10 0 11 13 1 14v14H13z"/><path d="M14 32h20"/>'],
    ['frigideira','Frigideira','#bca3ed','<ellipse cx="20" cy="27" rx="15" ry="12"/><path d="m32 20 11-12M9 26q9-10 19-2"/>'],
    ['panela','Panela','#96d8bc','<path d="M10 22h28l-3 17H13zM5 25h5m28 0h5M9 19q15-14 30 0M21 10h6"/>'],
    ['chaleira','Chaleira','#e8a2b9','<path d="M12 22q12-10 24 0v16H12zM15 18h18M23 11h3M36 24l9-9-2 15-7 3M12 23C-1 8-1 38 12 33"/>'],
    ['concha','Concha','#93cee8','<path d="M25 8v22q-16-8-18 3c-2 12 27 13 27 0V8"/>'],
    ['estrela','Estrela','#f0d371','<path d="m24 5 6 12 14 2-10 10 2 14-12-7-12 7 2-14L4 19l14-2z"/>']
  ];
  const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  function normalize(value){return {name:(typeof value?.name==='string'?value.name.replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,32):'')||'Você',avatar:avatars.some(a=>a[0]===value?.avatar)?value.avatar:'chef'};}
  let saved=normalize(null),selected=saved.avatar;
  try{saved=normalize(JSON.parse(localStorage.getItem(key)));}catch{}
  function avatarHTML(id){const a=avatars.find(a=>a[0]===id)||avatars[0];return `<span class="pan-avatar player-avatar" data-avatar="${a[0]}" style="--avatar-color:${a[2]}" aria-hidden="true"><svg viewBox="0 0 48 48" fill="currentColor" stroke="#34203c" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${a[3]}</svg></span>`;}
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
