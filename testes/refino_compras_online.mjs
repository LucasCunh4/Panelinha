// Uma compra punitiva real do motor autoritativo, projetada para dono e observador.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {DEFAULT_RULES} from '../multiplayer-server/src/protocol.mjs';
import {createMatch,engine,perform,gameView,nextWake} from '../multiplayer-server/src/game.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const room={status:'lobby',rules:{...DEFAULT_RULES},players:[0,1,2,3].map(i=>({id:'p'+i,name:'Chef '+i,avatar:'frigideira-chef',ready:true,bot:false,connected:true,team:i%2+1}))};
const now=Date.now();createMatch(room,now);const s=room.game,{core}=engine(room,now);
s.seats=room.players.map(p=>p.id);
Object.assign(s,{countdownAt:0,unlockAt:0,deadline:0,presentationUntil:0,current:0,penalty:2,highest:2,finisher:null,drawn:null,events:[],eventSerial:0});
s.players.forEach(p=>p.hand=Array.from({length:7},()=>core.make('num','red',7)));s.deck=Array.from({length:30},()=>core.make('num','blue',1));s.discard=[core.make('num','red',7)];s.cardCount=s.deck.length+s.discard.length+s.players.flatMap(p=>p.hand).length;
const before=gameView(room,'p0',now);perform(room,room.players[0],'draw',{},now);
assert.equal(s.lastPenaltyPurchase.duration,2260);assert.equal(nextWake(room,now),s.presentationUntil);
assert.throws(()=>perform(room,room.players[s.current],'draw',{},s.presentationUntil-1));
assert.equal(gameView(room,s.seats[s.current],s.presentationUntil).actions.draw,true);
const owner=gameView(room,'p0',now),observer=gameView(room,'p1',now);
assert.equal(owner.lastPenaltyPurchase.cardIds.length,2);assert.equal(observer.lastPenaltyPurchase.cardIds,undefined);
assert.equal(observer.players[0].hand,undefined);assert.ok(observer.events.filter(e=>e.type==='draw').every(e=>!e.card));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8000');
  const receive=async(game,selfId)=>page.evaluate(snapshot=>PanelinhaOnline.receive(snapshot),{status:'connected',selfId,state:{code:'123456',hostId:'p0',players:room.players,allReady:false,game}});
  await receive(before,'p0');await receive(owner,'p0');assert.equal(await page.locator('[data-effect=draw][data-presentation=preview]').count(),1);assert.equal(await page.locator('.draw-choice').count(),0);
  await page.waitForTimeout(1150);assert.equal(await page.locator('[data-effect=draw][data-presentation=preview]').count(),1);await page.waitForTimeout(1250);assert.equal(await page.locator('[data-effect=draw],.draw-choice').count(),0);
  observer.matchId+='-observer';await receive(observer,'p1');assert.equal(await page.locator('[data-effect=draw][data-presentation=preview],.draw-choice').count(),0);assert.ok(await page.locator('[data-effect=draw][data-presentation=direct]').count());assert.ok(await page.locator('[data-effect=draw] img').evaluateAll(ns=>ns.every(n=>n.getAttribute('src').endsWith('verso_oficial_400x850.png'))));
  assert.deepEqual(errors,[]);console.log('PASS prazo autoritativo de 2260ms, bloqueio antecipado, compra individual sequencial para dono e versos para observador; sem erros JavaScript');
}finally{await browser.close()}
