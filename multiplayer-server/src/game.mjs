import '../../IMPORTACAO_PANELAS/motor.js';
import {requireValue,exact,randomInt} from './protocol.mjs';

const Rules=globalThis.PanelinhaRules;
const random=()=>randomInt(0x100000000)/0x100000000;
const member=(room,seat)=>room.players.find(p=>p?.id===room.game.seats[seat]);
export const automated=p=>!!p&&(p.bot||p.connected===false||p.idleBot===true);
const TIMERS=['presentationUntil','unlockAt','deadline','countdownAt','botAt','botCutAt','reportAt','idleAt'];
const idleDelay=120000;
function emit(game,type,data={}){
  game.events.push({id:++game.eventSerial,type,...data});
  game.events=game.events.slice(-384);
}
export function engine(room,now=Date.now()){
  const s=room.game;
  const startTurn=(pause=0)=>{
    if(s.phase!=='playing')return;
    s.drawn=null;s.preUno=false;s.token++;
    const wait=s.starting?3000:(s.o.cut?pause:Math.min(400,pause));
    s.countdownAt=s.starting?now+3000:0;s.starting=false;
    const origin=Math.max(now,s.presentationUntil||0);
    s.unlockAt=origin+wait;s.cutOpen=!!(s.o.cut&&pause>0&&s.finisher===null);
    s.deadline=s.o.timeout?s.unlockAt+s.o.timeout*1000:0;
    s.idleAt=!s.o.timeout&&!automated(member(room,s.current))?s.unlockAt+idleDelay:0;
    s.botAt=automated(member(room,s.current))?Math.max(now+700,s.unlockAt+20):0;
    s.botCutAt=s.cutOpen&&automated(member(room,s.current))?Math.min(origin+700,s.unlockAt-1):0;
    s.reportAt=s.unoWindow&&!automated(member(room,s.unoWindow.id))&&room.players.some(automated)?origin+850:0;
  };
  const core=Rules.create({getState:()=>s,now:()=>now,random,online:true,
    name:id=>member(room,id)?.name||'Jogador',human:id=>!automated(member(room,id)),
    clearJobs(){s.botAt=0;s.botCutAt=0;s.reportAt=0;},startTurn,
    draw(_state,actor,card){delete s.preUnoById[actor];emit(s,'draw',{actor,card});},
    sound(name,data){if(name==='round-start'&&s.starting)return;if(name==='round-prepare')s.events=[];emit(s,'sound',{name,data});},
    announce(_state,actor,name,stage){emit(s,'last-card',{actor,name,stage});}
  });
  return {core,startTurn};
}
function completed(room,before){
  const s=room.game;
  if(before==='playing'&&s.phase!=='playing'){
    for(const p of room.players)p.ready=automated(p);
    s.botAt=0;s.botCutAt=0;s.reportAt=0;s.cutOpen=false;s.unlockAt=0;s.deadline=0;s.countdownAt=0;s.idleAt=0;
  }
  if(!s.unoWindow)s.reportAt=0;
  conserve(s);
}
export function conserve(game){
  const cards=[...game.deck,...game.discard,...game.players.flatMap(p=>p.hand)];
  if(cards.length!==game.cardCount||new Set(cards.map(c=>c.id)).size!==cards.length)throw Error('Conservação do baralho online violada');
}
export function createMatch(room,now=Date.now()){
  requireValue(room.players.every(p=>p&&p.ready),'NOT_READY',409);
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  let seated;
  if(room.rules.duo){
    const teams=shuffle([1,2]),a=shuffle(room.players.filter(p=>p.team===teams[0])),b=shuffle(room.players.filter(p=>p.team===teams[1]));
    requireValue(a.length===2&&b.length===2,'NOT_READY',409);seated=[a[0],b[0],a[1],b[1]];
  }else seated=shuffle([...room.players]);
  room.game={matchId:crypto.randomUUID(),seats:seated.map(p=>p.id),o:{...room.rules},players:[0,1,2,3].map(id=>({id,hand:[],score:0})),
    uid:0,teams:[0,0],deck:[],discard:[],activeColor:null,direction:-1,current:0,penalty:0,highest:0,lastPenalty:null,finisher:null,
    round:0,phase:'playing',drawn:null,cutOpen:false,unlockAt:0,lastActor:null,lastDistribution:null,preUno:false,preUnoById:{},
    unoWindow:null,log:[],message:'',deadline:0,pendingAction:null,token:0,reveal:false,summary:[],pastWinners:[],events:[],eventSerial:0,
    botAt:0,botCutAt:0,starting:true,countdownAt:0,idleAt:0,paused:false,resumeAt:0,frozen:null,cardCount:112+(room.rules.wild6?2:0)+(room.rules.dist?2:0)+(room.rules.rotate?2:0)};
  room.status='match';for(const p of room.players){p.idleBot=false;p.missedTurns=0;p.ready=automated(p);}
  engine(room,now).core.newRound(randomInt(4),-1);conserve(room.game);
}
export function nextRound(room,now=Date.now()){
  requireValue(room.game?.phase==='roundOver'&&room.players.every(p=>p.ready),'NOT_READY',409);
  const starter=room.game.finisher;room.game.preUnoById={};room.game.starting=true;
  for(const p of room.players)p.ready=automated(p);
  engine(room,now).core.newRound(starter,-1);conserve(room.game);
}
export function returnLobby(room){
  requireValue(room.game?.phase==='gameOver'&&room.players.every(p=>p.ready),'NOT_READY',409);
  room.status='lobby';delete room.game;
  room.players=room.players.map(p=>p&&!p.bot&&p.connected===false?null:p);
  for(const p of room.players.filter(Boolean)){p.ready=p.bot;delete p.idleBot;delete p.missedTurns;}
}
export function settleReady(room){
  if(room.game?.phase==='gameOver'&&room.players.every(p=>p.ready)){returnLobby(room);return true;}return false;
}
export function perform(room,actor,type,data,now=Date.now()){
  const s=room.game,seat=s.seats.indexOf(actor.id);requireValue(seat>=0&&s.phase==='playing','ILLEGAL_MOVE',409);
  requireValue(!s.paused,'GAME_PAUSED',409);requireValue(!automated(member(room,seat)),'CONTROL_REQUIRED',409);
  const wasCurrent=seat===s.current;
  const {core}=engine(room,now),before=s.phase;
  requireValue(now>=s.countdownAt&&now>=(s.presentationUntil||0),'ILLEGAL_MOVE',409);
  if(type==='play'||type==='cut'){
    exact(data,['cardId','color']);requireValue(Number.isSafeInteger(data.cardId));
    const card=s.players[seat].hand.find(c=>c.id===data.cardId);requireValue(card&&core.checkCards(seat,[card.id],type==='cut'),'ILLEGAL_MOVE',409);
    if(Rules.COLOR_CHOOSERS.has(card.type)&&s.players[seat].hand.length>1)requireValue(Rules.COLORS.includes(data.color),'ILLEGAL_MOVE',409);
    else requireValue(data.color===undefined,'BAD_PAYLOAD');
    requireValue(core.applyPlay(seat,[card.id],type==='cut',data.color||s.activeColor),'ILLEGAL_MOVE',409);
    if(data.color)emit(s,'sound',{name:'color-chosen'});
  }else if(type==='draw'){
    exact(data,[]);requireValue(seat===s.current&&core.canActNow()&&s.drawn===null,'ILLEGAL_MOVE',409);core.buy(seat);
  }else if(type==='pass'){
    exact(data,[]);requireValue(seat===s.current&&core.canActNow()&&s.drawn!==null,'ILLEGAL_MOVE',409);core.keepPass(seat);
  }else if(type==='challenge'){
    exact(data,[]);requireValue(core.canChallenge(seat)&&core.canActNow(),'ILLEGAL_MOVE',409);core.challenge(seat);
  }else if(type==='announce'){
    exact(data,[]);requireValue(core.canAnnounceUNO(seat),'ILLEGAL_MOVE',409);
    requireValue(!s.preUnoById[seat],'ILLEGAL_MOVE',409);core.announceUNO(seat);
  }else if(type==='report'){
    exact(data,[]);requireValue(s.unoWindow&&s.unoWindow.id!==seat,'ILLEGAL_MOVE',409);core.reportUno(seat);
  }else requireValue(false);
  if(wasCurrent){member(room,seat).missedTurns=0;if(!s.o.timeout&&s.current===seat)s.idleAt=Math.max(now,s.unlockAt||0)+idleDelay;}
  completed(room,before);
}
export function pauseMatch(room,now=Date.now()){
  const s=room.game;requireValue(s?.phase==='playing'&&!s.paused,'ILLEGAL_MOVE',409);
  // A contagem de entrada é reapresentada integralmente na retomada. Prazos de
  // jogo ainda não abertos não perdem parte do turno por pausar nesse intervalo.
  const origin=Math.max(now,s.countdownAt||0);
  s.frozen=Object.fromEntries(TIMERS.map(key=>[key,s[key]>0?Math.max(1,s[key]-origin):0]));
  if(s.countdownAt){s.frozen.unlockAt=0;s.frozen.countdownAt=0;}
  for(const key of TIMERS)s[key]=0;
  s.paused=true;s.resumeAt=0;
}
export function resumeMatch(room,now=Date.now()){
  const s=room.game;requireValue(s?.phase==='playing'&&s.paused&&!s.resumeAt,'ILLEGAL_MOVE',409);
  s.resumeAt=now+3000;
}
export function reclaim(room,actor,now=Date.now()){
  const s=room.game,p=room.players.find(p=>p?.id===actor.id);
  requireValue(s&&p&&!p.bot&&p.connected!==false&&p.idleBot,'ILLEGAL_MOVE',409);
  p.idleBot=false;p.missedTurns=0;if(s.phase!=='playing')p.ready=false;
  refreshAutomation(room,now);
}
export function refreshAutomation(room,now=Date.now()){
  const s=room.game;if(!s||s.phase!=='playing')return;
  const timers=s.paused?s.frozen:s,origin=s.paused?0:now,bot=automated(member(room,s.current));
  if(bot){if(!timers.botAt)timers.botAt=Math.max(origin+700,(timers.unlockAt||0)+20);timers.idleAt=0;}
  else{timers.botAt=0;timers.botCutAt=0;if(!s.o.timeout&&!timers.idleAt)timers.idleAt=Math.max(origin,timers.unlockAt||0)+idleDelay;}
}
export function advance(room,now=Date.now()){
  const s=room.game;if(!s)return false;
  if(s.phase!=='playing'){if(s.presentationUntil&&now>=s.presentationUntil){s.presentationUntil=0;return true;}return false;}
  const {core,startTurn}=engine(room,now),before=JSON.stringify(s),phase=s.phase;
  if(s.paused){
    if(!s.resumeAt||now<s.resumeAt)return false;
    const release=s.resumeAt;
    for(const key of TIMERS)s[key]=s.frozen[key]>0?release+s.frozen[key]:0;
    s.paused=false;s.resumeAt=0;s.frozen=null;emit(s,'sound',{name:'round-start'});
  }
  if(s.presentationUntil&&now<s.presentationUntil){refreshAutomation(room,now);return JSON.stringify(s)!==before;}
  if(s.presentationUntil&&now>=s.presentationUntil)s.presentationUntil=0;
  if(s.reportAt&&now>=s.reportAt){s.reportAt=0;const reporters=s.players.filter(p=>automated(member(room,p.id))&&p.id!==s.unoWindow?.id);if(s.unoWindow&&reporters.length&&random()<.36)core.reportUno(reporters[randomInt(reporters.length)].id);}
  if(s.botCutAt&&now>=s.botCutAt){
    s.botCutAt=0;
    if(s.cutOpen&&now<s.unlockAt&&random()<.22){
      const candidates=s.players.filter(p=>p.id!==s.current&&automated(member(room,p.id))).flatMap(p=>p.hand.filter(c=>core.checkCards(p.id,[c.id],true)).map(card=>({id:p.id,card})));
      if(candidates.length){const chosen=candidates[randomInt(candidates.length)];core.applyPlay(chosen.id,[chosen.card.id],true,core.colorForPlay(chosen.card,s.players[chosen.id].hand.filter(c=>c.id!==chosen.card.id)));}
    }
  }
  if(s.unlockAt&&now>=s.unlockAt){
    s.cutOpen=false;s.unlockAt=0;
    if(s.countdownAt){s.countdownAt=0;emit(s,'sound',{name:'round-start'});}
  }
  if(s.deadline&&now>=s.deadline){
    const id=s.current,p=member(room,id),wasHuman=!automated(p);core.log('Tempo de '+p.name+' esgotado.');
    if(s.penalty)core.finishPenaltyDraw(id);
    else{core.closeUnoOnAction();const got=core.drawMany(id,1);core.holdPenaltyPurchase(id,got,'timeout');s.current=core.nextActive(id);startTurn();}
    if(wasHuman){p.missedTurns=(p.missedTurns||0)+1;if(p.missedTurns>=2){p.idleBot=true;core.log(p.name+' passou ao bot por inatividade.');}}
  }else if(s.idleAt&&now>=s.idleAt){
    const p=member(room,s.current);s.idleAt=0;if(!automated(p)){p.idleBot=true;core.log(p.name+' passou ao bot após dois minutos sem ação válida.');}
  }else if(s.botAt&&now>=s.botAt){s.botAt=0;core.botTurn();}
  completed(room,phase);refreshAutomation(room,now);return JSON.stringify(s)!==before;
}
export function nextWake(room,now=Date.now()){
  const s=room.game;if(!s)return Infinity;if(s.phase!=='playing')return s.presentationUntil?Math.max(now+1,s.presentationUntil):Infinity;
  if(s.paused)return s.resumeAt?Math.max(now+1,s.resumeAt):Infinity;
  if(s.presentationUntil>now)return s.presentationUntil;
  return Math.min(...[s.presentationUntil,s.unlockAt,s.deadline,s.botAt,s.botCutAt,s.reportAt,s.idleAt].filter(t=>t>0).map(t=>Math.max(now+1,t)),Infinity);
}
export function gameView(room,viewerId,now=Date.now()){
  const s=room.game;if(!s)return null;
  const self=s.seats.indexOf(viewerId);requireValue(self>=0,'AUTH_INVALID',401);
  const {core}=engine(room,now),own=s.players[self];
  const enabled=!s.paused&&!automated(member(room,self));
  const legal=enabled?own.hand.filter(c=>core.checkCards(self,[c.id],false)).map(c=>c.id):[],cuts=enabled?own.hand.filter(c=>core.checkCards(self,[c.id],true)).map(c=>c.id):[];
  const draw=enabled&&s.phase==='playing'&&s.current===self&&core.canActNow()&&s.drawn===null;
  const visible=seat=>seat===self||(s.o.duo&&seat%2===self%2);
  return {matchId:s.matchId,self,serverNow:now,o:{...s.o},round:s.round,phase:s.phase,activeColor:s.activeColor,direction:s.direction,current:s.current,
    penalty:s.penalty,highest:s.highest,finisher:s.finisher,drawn:s.current===self?s.drawn:null,cutOpen:s.cutOpen,unlockAt:s.unlockAt,deadline:s.deadline,
    presentationUntil:s.presentationUntil||0,lastDistribution:s.lastDistribution,lastRotation:s.lastRotation||null,blockedPlayer:s.blockedPlayer??null,lastPenaltyPurchase:s.lastPenaltyPurchase?{...Object.fromEntries(Object.entries(s.lastPenaltyPurchase).filter(([key])=>key!=='cardIds')),...(s.lastPenaltyPurchase.actor===self?{cardIds:s.lastPenaltyPurchase.cardIds}:{})}:null,finalStandings:s.finalStandings||null,roundScore:s.roundScore||null,countdownAt:s.countdownAt,paused:!!s.paused,resumeAt:s.resumeAt||0,remaining:s.paused?{turn:s.frozen.deadline,cut:s.frozen.unlockAt,presentation:s.frozen.presentationUntil}:null,lastActor:s.lastActor,preUno:!!s.preUnoById[self],unoWindow:s.unoWindow,teams:[...s.teams],
    summary:s.summary,winner:s.winner||null,winnerId:s.winnerId??null,winnerTeam:s.winnerTeam??null,token:s.token,deckCount:s.deck.length,discard:s.discard.slice(-3),message:s.current!==self&&s.message.startsWith('Você')?'':s.message,log:s.log.slice(0,40),
    players:s.players.map(p=>{const m=member(room,p.id);return {id:p.id,memberId:m.id,name:m.name,avatar:m.avatar,team:m.team,bot:m.bot,substituted:!m.bot&&automated(m),idleBot:!!m.idleBot,connected:m.connected!==false,score:p.score,count:p.hand.length,...(visible(p.id)?{hand:p.hand.map(c=>({...c}))}:{})};}),
    actions:{legal,cuts,draw,reclaim:!!member(room,self).idleBot,distributePossible:own.hand.filter(c=>c.type==='dist'&&core.canDistribute(c)).map(c=>c.id),pass:enabled&&s.phase==='playing'&&s.current===self&&core.canActNow()&&s.drawn!==null,challenge:enabled&&!!core.canChallenge(self)&&core.canActNow(),
      announce:enabled&&core.canAnnounceUNO(self),report:enabled&&s.phase==='playing'&&!!s.unoWindow&&s.unoWindow.id!==self,mustBuy:draw&&!legal.length},
    events:s.events.map(event=>{if(event.type!=='draw')return event;return {id:event.id,type:'draw',actor:event.actor,...(visible(event.actor)?{card:{...event.card}}:{})};})};
}
