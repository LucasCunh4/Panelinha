/* Núcleo compartilhado extraído do motor local validado. Sem DOM, rede ou timers. */
(() => { 'use strict';
const COLORS=['red','blue','green','yellow'];
const CN={red:'Vermelho',blue:'Azul',green:'Verde',yellow:'Amarelo'};
const TYPES={num:'Número',draw2:'+2',wild4:'+4',wild6:'+6',skip:'Bloqueio',reverse:'Inverter',wild:'Coringa',dist:'Panela de Pressão',rotate:'Liquidificador'};
const SHORT={skip:'BLOQ',reverse:'INV',wild:'COR',dist:'PANELA DE PRESSÃO',rotate:'LIQUIDIFICADOR'};
const COLORLESS=new Set(['wild','wild4','wild6','dist','rotate']);
const COLOR_CHOOSERS=new Set(['wild','wild4','wild6']);
const SPECIAL=new Set(['draw2','wild4','wild6','wild','dist','rotate']);
const VALUE={num:2,draw2:4,skip:4,reverse:4,wild4:6,wild6:8,wild:10,dist:10,rotate:10};
const CUT_PAUSE_MS=2200; // tempo mínimo antes de o próximo jogador agir; corte aparece imediatamente

function drawSequence(count){
  const steps=Array.from({length:count},(_,i)=>Math.max(500,1100*Math.pow(.96,i)));
  const scale=Math.min(1,14000/(steps.reduce((sum,n)=>sum+n,0)||1));let elapsed=0;
  const items=steps.map(step=>{const interval=step*scale,item={delay:elapsed,duration:count===1?2400:Math.max(420,interval*1.65)};elapsed+=interval;return item;});
  return {items,duration:Math.ceil(Math.max(0,...items.map(item=>item.delay+item.duration)))};
}

function create(ctx){
let s=null,uid=0;
const now=()=>ctx.now?ctx.now():Date.now();
const rnd=n=>Math.floor((ctx.random?ctx.random():Math.random())*n),pick=a=>a[rnd(a.length)];
const names=id=>ctx.name?.(id)||'Jogador '+(id+1);
const human=id=>ctx.human?ctx.human(id):id===0;
const preAnnounced=id=>s.preUnoById?!!s.preUnoById[id]:(id===0&&s.preUno);
const clearJobs=()=>ctx.clearJobs?.(),render=()=>ctx.render?.(),queueBots=()=>ctx.queueBots?.(),startTurn=(...args)=>ctx.startTurn?.(...args);
const PanelasMesa={recordDraw:(...args)=>ctx.draw?.(...args)};
const PanelinhaSFX={event:(...args)=>ctx.sound?.(...args)};
const PanelinhaAnnouncements={round:(...args)=>ctx.round?.(...args),announce:(...args)=>ctx.announce?.(...args)};
function canChallenge(id){return s.phase==='playing'&&s.o.challenge&&s.penalty>0&&s.current===id&&s.lastPenalty&&s.lastPenalty.challengeable&&(['wild4','wild6'].includes(s.lastPenalty.type));}
function make(type,color=null,num=null){uid=Math.max(uid,s?.uid||0);const card={id:++uid,type,color,num};if(s)s.uid=uid;return card;}

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}

function descriptor(c){if(!c)return '—';return c.type==='num'?String(c.num):TYPES[c.type];}

function description(c){return descriptor(c)+(c.color?' '+CN[c.color]:'');}

function isColorless(c){return COLORLESS.has(c.type)}

function equals(a,b){return a&&b&&a.type===b.type&&(a.type==='num'?a.num===b.num&&a.color===b.color:(!a.color||a.color===b.color));}

function power(c){return c.type==='draw2'?2:c.type==='wild4'?4:c.type==='wild6'?6:0;}

function buildDeck(o){let a=[];for(const color of COLORS){for(let n=0;n<=9;n++){a.push(make('num',color,n),make('num',color,n));}for(let k=0;k<2;k++){a.push(make('draw2',color),make('skip',color),make('reverse',color));}}for(let k=0;k<4;k++)a.push(make('wild4'),make('wild'));if(o.wild6!==false)for(let k=0;k<2;k++)a.push(make('wild6'));if(o.dist)for(let k=0;k<2;k++)a.push(make('dist'));if(o.rotate)for(let k=0;k<2;k++)a.push(make('rotate'));return shuffle(a);}

function log(msg){s.log.unshift(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);s.log=s.log.slice(0,70);}

function top(){return s.discard[s.discard.length-1];}

function nextActive(from,steps=1){let i=from;for(let st=0;st<steps;st++){let tries=0;do{i=(i+4+s.direction)%4;tries++;}while(s.players[i].hand.length===0&&tries<4);}return i;}

function refill(){if(s.deck.length||s.discard.length<=1)return;let t=s.discard.pop();s.deck=shuffle(s.discard);s.discard=[t];log('Monte reabastecido com os descartes.');PanelinhaSFX.event('deck-refilled');}

function drawCard(id){refill();let c=s.deck.pop();if(c){s.players[id].hand.push(c);PanelasMesa.recordDraw(s,id,c);PanelinhaSFX.event('card-drawn');}return c||null;}

function drawMany(id,n){let got=0;for(let i=0;i<n;i++){if(!drawCard(id))break;got++;}return got;}

function redistribute(extra=0,exclude=[],actor=null){
  const eligible=s.players.filter(p=>!exclude.includes(p.id)&&(p.id===actor||p.hand.length>0));
  const beforeCounts=s.players.map(p=>p.hand.length);
  if(!eligible.length)return;
  const cap=actor===null?null:s.players[actor].hand.length;
  let collected=[];
  for(const p of eligible){collected.push(...p.hand);p.hand=[];}
  const added=[];
  for(let i=0;i<extra;i++){refill();const c=s.deck.pop();if(!c)break;collected.push(c);added.push(c);}
  shuffle(collected);
  const author=eligible.find(p=>p.id===actor);
  const others=shuffle(eligible.filter(p=>p!==author));
  const counts=new Map();
  // A redução é sorteada após o descarte; mínimo 1, sem reincluir quem bateu.
  const reduction=author&&cap>1?1+rnd(Math.min(3,cap-1)):0;
  if(author)counts.set(actor,cap-reduction);
  const remaining=collected.length-(author?counts.get(actor):0);
  if(others.length){
    const base=Math.floor(remaining/others.length),rest=remaining%others.length;
    const portions=others.map((_,i)=>base+(i<rest?1:0));
    // Variações pequenas preservam o total, o mínimo e a diferença máxima de 2.
    for(let i=0;i<others.length*3;i++){
      const from=rnd(others.length),to=rnd(others.length);
      if(from===to||portions[from]<=1)continue;
      const trial=portions.slice();trial[from]--;trial[to]++;
      if(Math.max(...trial)-Math.min(...trial)<=2){portions[from]--;portions[to]++;}
    }
    others.forEach((p,i)=>counts.set(p.id,portions[i]));
  }
  let offset=0;
  for(const p of eligible){const n=counts.get(p.id);p.hand=collected.slice(offset,offset+n);offset+=n;if(s.preUnoById)delete s.preUnoById[p.id];}
  if(offset!==collected.length||eligible.some(p=>p.hand.length<1)||(author&&author.hand.length!==cap-reduction)||(others.length&&Math.max(...others.map(p=>p.hand.length))-Math.min(...others.map(p=>p.hand.length))>2))throw Error('Panela de Pressão: conservação/limites inválidos');
  const penaltyIds=new Set(added.map(c=>c.id));
  for(const p of eligible)for(const c of p.hand)if(penaltyIds.has(c.id))PanelasMesa.recordDraw(s,p.id,c);
  const text=eligible.map(p=>`${names(p.id)}: ${p.hand.length}`).join(' · ');
  s.lastDistribution={beforeCounts,afterCounts:s.players.map(p=>p.hand.length),counts:text,penaltyAdded:added.length,active:eligible.map(p=>p.id),actor,actorLimit:cap,actorReduction:author?reduction:null,actorReceived:author?author.hand.length:null,total:collected.length};
  if(s.unoWindow&&s.players[s.unoWindow.id].hand.length!==1)s.unoWindow=null;
  log(`Panela de Pressão ALEATÓRIA (${text})${extra?` · punição: ${added.length}/${extra} cartas adicionadas`:''}.`);
}

function rotateHands(exclude=[],actor=null){
  const order=[],beforeCounts=s.players.map(p=>p.hand.length),transfers=[];
  for(let i=0;i<4;i++)if(s.players[i].hand.length>0&&!exclude.includes(i))order.push(i);
  if(order.length<2)return;
  const next={};
  for(const id of order){
    let to=id,count=0;
    do{to=(to+4+s.direction)%4;count++;}while(!order.includes(to)&&count<4);
    next[to]=s.players[id].hand;
    transfers.push({from:id,to,count:s.players[id].hand.length});
  }
  for(const id of order){s.players[id].hand=next[id];if(s.preUnoById)delete s.preUnoById[id];}
  // Não publicar identidades de cartas: a interface só precisa da rota e contagem.
  if(actor!==null){
    s.lastRotation={serial:(s.rotationSerial=(s.rotationSerial||0)+1),duration:2000,actor,direction:s.direction,active:order,transfers,beforeCounts,afterCounts:s.players.map(p=>p.hand.length)};
    s.presentationUntil=now()+2000;
  }
  log(`Liquidificador: mãos transferidas no sentido ${s.direction===-1?'horário':'anti-horário'}.`);
}

function newRound(starter=0,direction=1){PanelinhaSFX.event('round-prepare');PanelinhaAnnouncements.round(s);clearJobs();s.token++;s.round++;s.players.forEach(p=>p.hand=[]);s.deck=buildDeck(s.o);s.discard=[];s.direction=direction;s.current=starter;s.penalty=0;s.highest=0;s.lastPenalty=null;s.finisher=null;s.drawn=null;s.preUno=false;s.unoWindow=null;s.cutOpen=false;s.unlockAt=0;s.lastActor=null;s.lastDistribution=null;s.lastRotation=null;s.roundScore=null;s.finalStandings=null;s.blockedPlayer=null;s.lastPenaltyPurchase=null;s.presentationUntil=0;s.pendingAction=null;s.phase='playing';s.message='';for(let j=0;j<7;j++)for(const p of s.players)drawCard(p.id);let first=s.deck.pop();s.discard.push(first);s.activeColor=first.color||pick(COLORS);log(`Rodada ${s.round}: carta inicial ${description(first)}.`);
if(first.type==='skip'){s.blockedPlayer=starter;s.current=(starter+s.direction+4)%4;log('Bloqueio inicial: primeiro jogador pulado.');}
else if(first.type==='reverse'){s.direction*=-1;s.current=(starter+s.direction+4)%4;log('Inverter inicial: sentido invertido.');}
else if(power(first)){s.penalty=power(first);s.highest=power(first);log(`Penalidade inicial de +${s.penalty}.`);}
else if(first.type==='dist')redistribute();
else if(first.type==='rotate')rotateHands();
if(s.finisher!==null){finishRound();return;}PanelinhaSFX.event('round-start');startTurn();}

function canActNow(){return !!s&&!s.paused&&now()>=Math.max(s.unlockAt||0,s.presentationUntil||0);}

function closeUnoOnAction(){if(s.unoWindow)s.unoWindow=null;s.blockedPlayer=null;}

function canDistribute(c){
  if(s.penalty>0)return false;
  const author=s.players.find(p=>p.hand.some(q=>q.id===c.id));
  if(!author)return true;
  const after=author.hand.length-1;
  // Sem outro destinatário não há como reduzir/repassar uma penalidade.
  // A última carta normal pode encerrar; seu autor não recebe cartas.
  return s.players.some(p=>p.id!==author.id&&p.hand.length>0)||(!s.penalty&&after<=1);
}

function canPlay(c){if(c.type==='dist'&&!canDistribute(c))return false;if(s.penalty){return power(c)>0&&power(c)>=s.highest;}let t=top();if(isColorless(c))return true;return c.color===s.activeColor||(!isColorless(t)&&c.type===t.type&&(c.type==='num'?c.num===t.num:true));}

function checkCards(id,ids,isCut){
  if(!s||s.phase!=='playing'||s.paused||now()<(s.presentationUntil||0)||ids.length!==1||id===s.blockedPlayer)return false;
  const c=s.players[id].hand.find(q=>q.id===ids[0]);
  if(!c)return false;
  if(isCut)return !!(s.o.cut&&s.cutOpen&&now()<s.unlockAt&&s.finisher===null&&id!==s.current&&equals(c,top())&&canPlay(c));
  if(id!==s.current||!canActNow())return false;
  if(s.drawn!==null&&ids[0]!==s.drawn)return false;
  return canPlay(c); // Se há punição, SOMENTE + válido; Panela de Pressão é proibida.
}

function resolvePressurePlay(actor,repeatedOwnCut){
  if(s.penalty>0)return false;
  const extra=0;s.highest=0;s.lastPenalty=null;
  if(!repeatedOwnCut){
    redistribute(extra,[s.finisher].filter(x=>x!==null),actor);
    if(s.lastDistribution){
      s.presentationUntil=now()+2000;
      Object.assign(s.lastDistribution,{serial:(s.distributionSerial=(s.distributionSerial||0)+1),duration:2000});
    }
  }
}

function applyPlay(id,ids,isCut,color){
  // Guarda de segurança também para bots/modal: nenhuma jogada atravessa uma penalidade.
  if(!checkCards(id,ids,isCut))return false;
  clearJobs();
  const p=s.players[id],c=p.hand.find(x=>x.id===ids[0]);
  // Mesmo participante cortando a própria carta idêntica: segundo descarte sem repetir efeito.
  const repeatedOwnCut=isCut&&s.lastActor===id&&equals(c,top());
  const illegal=(c.type==='wild4'||c.type==='wild6')&&p.hand.some(q=>q.id!==c.id&&q.type!=='wild4'&&q.type!=='wild6'&&canPlay(q));
  closeUnoOnAction();
  p.hand=p.hand.filter(q=>q.id!==c.id);
  s.discard.push(c);if(c.type!=='rotate'&&c.type!=='dist')s.activeColor=c.color||color||s.activeColor;
  s.drawn=null;s.pendingAction=null;s.lastActor=id;s.lastDistribution=null;s.lastRotation=null;s.lastPenaltyPurchase=null;
  PanelinhaSFX.event('card-played',{cardType:c.type,cut:isCut});
  log(`${names(id)} ${isCut?'CORTOU com':'jogou'} ${description(c)}${COLOR_CHOOSERS.has(c.type)&&p.hand.length?' (cor: '+CN[s.activeColor]+')':''}.`);
  if(p.hand.length===1){const announced=preAnnounced(id)||(!human(id)&&(ctx.random?ctx.random():Math.random())<.75);if(announced){log(`${names(id)} anunciou ÚLTIMA CARTA.`);if(!human(id))PanelinhaAnnouncements.announce(s,id,names(id),'after-play');}else{s.unoWindow={id};log(`${names(id)} ficou com 1 carta sem anunciar!`);}}
  s.preUno=false;if(s.preUnoById)delete s.preUnoById[id];
  if(p.hand.length===0&&s.finisher===null){s.finisher=id;log(`${names(id)} terminou suas cartas!`);}
  if(c.type==='dist'){
    resolvePressurePlay(id,repeatedOwnCut);
  }else if(power(c)){
    if(!repeatedOwnCut){s.penalty+=power(c);s.highest=power(c);}
    if(!repeatedOwnCut)s.lastPenalty={id,type:c.type,illegal,challengeable:p.hand.length>0};
    else if(s.lastPenalty)s.lastPenalty.challengeable=p.hand.length>0;
    log(`Penalidade acumulada: +${s.penalty}${repeatedOwnCut?' (segunda cópia, sem novo efeito)':''}.`);
  }else if(c.type==='rotate'){
    if(!repeatedOwnCut&&!(s.o.duo&&s.finisher!==null))rotateHands([s.finisher].filter(x=>x!==null),id);
  }else{s.lastPenalty=null;}
  if(c.type==='skip')s.blockedPlayer=nextActive(id);
  if(c.type==='reverse'&&!repeatedOwnCut)s.direction*=-1;
  if(s.finisher!==null&&(!s.penalty||s.players.every(q=>q.hand.length===0))){finishRound();return true;}
  s.current=nextActive(id,c.type==='skip'?2:1);
  s.message=c.type==='dist'&&s.lastDistribution?'Panela de Pressão aleatória: '+s.lastDistribution.counts:(isCut?'Corte executado. A sequência agora segue de quem cortou.':'');
  startTurn(CUT_PAUSE_MS); // corte imediato; próximo jogador aguarda a pausa.
  return true;
}

function holdPenaltyPurchase(actor,count,reason){
  if(!count)return;
  const duration=drawSequence(count).duration+200;
  s.lastPenaltyPurchase={serial:(s.purchaseSerial=(s.purchaseSerial||0)+1),actor,count,reason,duration,cardIds:s.players[actor].hand.slice(-count).map(c=>c.id)};
  const started=now();s.presentationUntil=started+duration;
  // Denúncia não consome o turno atual: congela seus prazos e a decisão de compra.
  if(reason==='uno'){
    for(const key of ['unlockAt','deadline','countdownAt','botAt','botCutAt','reportAt','idleAt'])if(s[key]>0)s[key]=Math.max(started,s[key])+duration;
    s.unlockAt=Math.max(s.unlockAt||0,s.presentationUntil);
  }
}

function finishPenaltyDraw(id){clearJobs();closeUnoOnAction();let amount=s.penalty;let got=drawMany(id,amount);holdPenaltyPurchase(id,got,'penalty');PanelinhaSFX.event('penalty-resolved',{amount});log(`${names(id)} comprou ${got} cartas da penalidade (+${amount}) e perdeu o turno.`);s.penalty=0;s.highest=0;s.lastPenalty=null;if(s.finisher!==null){finishRound();return;}s.current=nextActive(id);startTurn();}

function challenge(id=0){if(!canChallenge(id)||!canActNow())return;clearJobs();closeUnoOnAction();const offender=s.lastPenalty.id,total=s.penalty;
if(s.lastPenalty.illegal){const got=drawMany(offender,total);holdPenaltyPurchase(offender,got,'challenge');PanelinhaSFX.event('penalty-resolved',{amount:total});log(`Desafio CORRETO: ${names(offender)} recebeu +${total}. ${ctx.online?names(id):'Você'} mantém o turno.`);s.penalty=0;s.highest=0;s.lastPenalty=null;startTurn();}
else{const got=drawMany(id,total+2);holdPenaltyPurchase(id,got,'challenge');PanelinhaSFX.event('penalty-resolved',{amount:total+2});log(`Desafio INCORRETO: ${ctx.online?names(id):'você'} recebeu +${total+2} e perdeu a vez.`);s.penalty=0;s.highest=0;s.lastPenalty=null;if(s.finisher!==null){finishRound();return;}s.current=nextActive(id);startTurn();}}

function buy(id=0){if(!s||s.phase!=='playing'||s.current!==id||s.drawn!==null||!canActNow())return;clearJobs();closeUnoOnAction();if(s.penalty){finishPenaltyDraw(id);return;}let got=null,n=0;do{got=drawCard(id);if(!got)break;n++;}while(s.o.infinite&&!canPlay(got)&&n<200);log(`${names(id)} comprou ${n} carta(s).`);if(got&&canPlay(got)){s.drawn=got.id;s.message='Você pode jogar a carta comprada ou guardá-la e passar.';render();}
else{s.message='Nenhuma carta válida comprada. Turno encerrado.';s.current=nextActive(id);startTurn();}}

function keepPass(id=0){if(s.phase!=='playing'||s.current!==id||s.drawn===null||!canActNow())return;clearJobs();log(`${names(id)} guardou a carta comprada e passou.`);s.drawn=null;s.current=nextActive(id);startTurn();}

// O anúncio preventivo usa a mesma validação do descarte, incluindo mão comprada.
function canAnnounceUNO(id=0){
  if(!s||s.phase!=='playing'||s.current!==id||!canActNow()||preAnnounced(id)||s.players[id].hand.length!==2)return false;
  return s.players[id].hand.some(c=>{
    if(!checkCards(id,[c.id],false))return false;
    if(c.type!=='rotate')return true; // Panela após descarte de duas conserva mínimo 1.
    // Liquidificador entrega ao autor a mão anterior na direção vigente.
    let from=id;for(let n=0;n<4;n++){from=(from+4-s.direction)%4;if(s.players[from].hand.length)return s.players[from].hand.length===1;}
    return false;
  });
}
function announceUNO(id=0){
  if(!canAnnounceUNO(id))return false;
  PanelinhaAnnouncements.announce(s,id,names(id),'preemptive');
  s.preUno=true;if(s.preUnoById)s.preUnoById[id]=true;
  s.message='Última carta anunciada preventivamente; agora descarte para ficar com uma.';
  log(`${names(id)} anunciou a última carta preventivamente.`);render();return true;
}

function reportUno(by=0){if(!s||!s.unoWindow||s.phase!=='playing'||now()<(s.presentationUntil||0))return;let id=s.unoWindow.id;if(id===by)return;s.unoWindow=null;let got=drawMany(id,2);holdPenaltyPurchase(id,got,'uno');PanelinhaSFX.event('penalty-resolved',{amount:2});log(`${names(by)} denunciou ${names(id)} por esquecer ÚLTIMA CARTA (+${got}).`);render();queueBots();}

function handPoints(p){return p.hand.reduce((a,c)=>a+VALUE[c.type],0);}

function specialCount(p){return p.hand.filter(c=>SPECIAL.has(c.type)).length;}

function effectCount(p){return p.hand.filter(c=>c.type==='skip'||c.type==='reverse').length;}

function numberCount(p){return p.hand.filter(c=>c.type==='num').length;}

function rankPlayers(){let others=s.players.filter(p=>p.id!==s.finisher);others.sort((a,b)=>handPoints(a)-handPoints(b)||specialCount(a)-specialCount(b)||effectCount(a)-effectCount(b)||numberCount(a)-numberCount(b)||a.id-b.id);return [s.players[s.finisher],...others];}

function finalStandings(){
  if(s.o.duo){
    const winner=s.winnerTeam??s.finisher%2;
    return [winner,1-winner].map((team,i)=>({place:i+1,team,playerIds:s.players.filter(p=>p.id%2===team).map(p=>p.id),total:s.teams[team],victories:s.pastWinners.filter(id=>id%2===team).length}));
  }
  if(s.o.single)return s.summary.map(row=>({place:row.place,playerIds:[row.id],total:s.players[row.id].score,victories:victories(row.id)}));
  const ordered=[...s.players].sort((a,b)=>b.score-a.score||victories(b.id)-victories(a.id)),groups=[];
  for(const player of ordered){
    const last=groups.at(-1),wins=victories(player.id);
    if(last&&last.total===player.score&&last.victories===wins)last.playerIds.push(player.id);
    else groups.push({place:groups.reduce((n,g)=>n+g.playerIds.length,0)+1,playerIds:[player.id],total:player.score,victories:wins});
  }
  return groups;
}

function finishRound(){const beforeScores=s.players.map(p=>p.score),beforeTeams=[...s.teams];PanelinhaAnnouncements.round(s);clearJobs();s.token++;s.phase='roundOver';s.unoWindow=null;const ranks=rankPlayers();s.summary=ranks.map((p,i)=>({id:p.id,place:i+1,remaining:p.hand.length,cost:handPoints(p)}));
s.pastWinners.push(s.finisher);
if(s.o.duo){let team=s.finisher%2;s.teams[team]++;log(`Rodada encerrada: equipe ${team===0?names(0)+' + '+names(2):names(1)+' + '+names(3)} ganhou 1 ponto.`);}
else{ranks.forEach((p,i)=>p.score+=3-i);log(`Classificação: ${ranks.map((p,i)=>`${i+1}º ${names(p.id)} (${handPoints(p)} pontos na mão)`).join('; ')}.`);}
s.roundScore={players:s.players.map(p=>({id:p.id,before:beforeScores[p.id],total:p.score,earned:p.score-beforeScores[p.id]})),teams:s.teams.map((total,id)=>({id,before:beforeTeams[id],total,earned:total-beforeTeams[id]}))};
s.winnerId=null;s.winnerTeam=null;let victor=null;if(s.o.duo){const reached=s.teams.map((v,i)=>({v,i})).filter(x=>x.v>=s.o.goal);if(reached.length)victor=(s.winnerTeam=reached.sort((a,b)=>b.v-a.v)[0].i)===0?'Equipe '+names(0)+' + '+names(2):'Equipe '+names(1)+' + '+names(3);}
else{const reached=s.players.filter(p=>p.score>=s.o.goal);if(reached.length){let ordered=[...reached].sort((a,b)=>b.score-a.score||victories(b.id)-victories(a.id));if(ordered.length>1&&ordered[0].score===ordered[1].score&&victories(ordered[0].id)===victories(ordered[1].id)){log('Empate em pontos e vitórias: rodada extra de desempate.');}else{s.winnerId=ordered[0].id;victor=names(ordered[0].id);}}}
if(s.o.single||victor){s.phase='gameOver';s.winner=victor;s.finalStandings=finalStandings();}
const summary=s.summary.map(x=>`${x.place}º ${names(x.id)} — ${x.cost} pts nas cartas, ${x.remaining} cartas`).join(' | ');
s.message=(s.phase==='gameOver'?(victor?`🏆 Vitória da partida: ${victor}. `:'🏆 Rodada única concluída. '):'Rodada encerrada. ')+summary;
PanelinhaSFX.event('round-result',{won:victor?(s.o.duo?victor==='Equipe '+names(0)+' + '+names(2):victor===names(0)):(s.o.duo?s.finisher%2===0:s.finisher===0)});
render();}

function victories(id){return s.pastWinners?s.pastWinners.filter(x=>x===id).length:0;}

function botTurn(){if(!s||s.phase!=='playing'||human(s.current)||s.pendingAction)return;if(!canActNow()){queueBots();return;}let id=s.current;
const p=s.players[id];let choices=p.hand.filter(canPlay);let chosen=null;
if(s.penalty){const defending=choices.filter(c=>power(c));if(defending.length)chosen=defending.sort((a,b)=>power(a)-power(b))[0];}
else if(choices.length){let numeric=choices.filter(c=>c.type==='num');let colored=choices.filter(c=>!isColorless(c)&&c.type!=='num');let regularWild=choices.filter(c=>c.type==='wild');let specials=choices.filter(c=>isColorless(c)&&c.type!=='wild');chosen=pick(numeric.length?numeric:colored.length?colored:regularWild.length?regularWild:specials);}
if(chosen){let color=colorForPlay(chosen,p.hand.filter(c=>c.id!==chosen.id));applyPlay(id,[chosen.id],false,color);return;}
if(s.penalty){finishPenaltyDraw(id);return;}
let drawn=null,n=0;do{drawn=drawCard(id);if(!drawn)break;n++;}while(s.o.infinite&&!canPlay(drawn)&&n<200);log(`${names(id)} comprou ${n} carta(s).`);
if(drawn&&canPlay(drawn)){// Bots use a bought special only when they have no other ordinary play.
let normal=p.hand.some(c=>c.id!==drawn.id&&c.type==='num'&&canPlay(c));if(!normal){applyPlay(id,[drawn.id],false,colorForPlay(drawn,p.hand.filter(c=>c.id!==drawn.id)));return;}}
s.current=nextActive(id);startTurn();}

function colorForPlay(card,hand){return card.color||(COLOR_CHOOSERS.has(card.type)?bestColor(hand):s.activeColor);}

function bestColor(cards){let counts=COLORS.map(color=>({color,n:cards.filter(c=>c.color===color).length})).sort((a,b)=>b.n-a.n);return counts[0].n?counts[0].color:pick(COLORS);}
const functions={make,shuffle,descriptor,description,isColorless,equals,power,buildDeck,log,top,nextActive,refill,drawCard,drawMany,redistribute,rotateHands,newRound,holdPenaltyPurchase,canActNow,closeUnoOnAction,canDistribute,canPlay,checkCards,resolvePressurePlay,applyPlay,finishPenaltyDraw,challenge,buy,keepPass,canAnnounceUNO,announceUNO,reportUno,handPoints,specialCount,effectCount,numberCount,rankPlayers,finishRound,finalStandings,victories,botTurn,colorForPlay,bestColor,canChallenge};
return Object.fromEntries(Object.entries(functions).map(([name,fn])=>[name,(...args)=>{s=ctx.getState();return fn(...args)}]));
}
globalThis.PanelinhaRules=Object.freeze({create,COLORS,CN,TYPES,SHORT,COLORLESS,COLOR_CHOOSERS,SPECIAL,VALUE,CUT_PAUSE_MS,drawSequence});
})();
