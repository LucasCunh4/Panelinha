import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {DEFAULT_RULES} from '../multiplayer-server/src/protocol.mjs';
import {createMatch,gameView} from '../multiplayer-server/src/game.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const p=await b.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8000');
 for(const duo of [false,true]){
  const now=Date.now(),room={status:'lobby',rules:{...DEFAULT_RULES,duo},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',ready:true,bot:false,connected:true,team:i%2+1}))};createMatch(room,now);Object.assign(room.game,{countdownAt:0,presentationUntil:0,unlockAt:0,deadline:0,lastDistribution:null,lastRotation:null,lastPenaltyPurchase:null});
  room.game.players.forEach(p=>Object.assign(p.hand[0],{type:'wild4',color:null,num:null}));
  const game=gameView(room,'p0',now);
  await p.evaluate(snapshot=>PanelinhaOnline.receive(snapshot),{status:'connected',selfId:'p0',state:{code:'123456',hostId:'p0',players:room.players,allReady:false,game}});await p.waitForFunction(()=>!PanelinhaTableEffects.dealing());
  const result=await p.evaluate(()=>({hidden:[...document.querySelectorAll('.seat .hidden-card')].every(n=>n.dataset.cardType==='back'&&!n.classList.contains('gold-card')&&n.querySelectorAll('img').length===1&&n.querySelector('img').src.endsWith('/cartas/especiais/verso_roxo.png')),opponents:document.querySelectorAll('.seat .back').length,partner:!!document.querySelector('#player2 .subhand'),faces:[...document.querySelectorAll('#hand img,#player2 .subhand img')].every(n=>(n.src.includes('/assets/cartas/')||n.classList.contains('card-food-image')&&n.src.includes('/assets/ingredientes-especiais/')))}));
  assert.ok(result.hidden&&result.faces);assert.ok(await p.locator('#hand .card-food').count()>=4);assert.equal(await p.locator('.seat .back .card-food').count(),0);if(duo)assert.ok(await p.locator('#player2 .subhand .card-food').count()>=4);assert.equal(result.partner,duo);assert.equal(result.opponents,duo?2:3);
 }
 assert.deepEqual(errors,[]);console.log('PASS projeções do servidor: Individual/Duplas com novo verso branco, frentes só para dono/parceiro, sem artes antigas ou erros JavaScript');
}finally{await b.close()}
