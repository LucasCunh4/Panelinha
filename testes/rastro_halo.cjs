const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/rastro-halo-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:4});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const render=()=>p.evaluate(()=>document.getElementById('useCardArt').onchange());
 const card=(type='num',color='red',num=3,id=810001)=>({id,type,color,num});
 const fixture=async(extra={},hand=[card()])=>p.evaluate(({extra,hand})=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,unlockAt:0,cutOpen:false,pendingAction:null,penalty:0,highest:0,lastPenalty:null,drawn:null,activeColor:'blue',direction:1,finisher:null,lastActor:null,deadline:0,unoWindow:null,preUno:false,token:s.token+1});
  Object.assign(s.o,{duo:false,single:true,timeout:0,infinite:false,cut:true,challenge:true,wild6:true,dist:true});
  s.players.forEach((player,i)=>player.hand=i===0?hand:Array.from({length:7},(_,n)=>({id:820000+i*100+n,type:'num',color:'red',num:n})));
  s.deck=Array.from({length:50},(_,i)=>({id:830000+i,type:'num',color:'blue',num:2}));
  s.discard=[{id:840000,type:'num',color:'blue',num:9}];Object.assign(s,extra);document.getElementById('useCardArt').onchange();
 },{extra,hand});
 const glow=async expected=>{
  const actual=await p.evaluate(()=>{const b=document.getElementById('buyBtn'),a=document.getElementById('pileAura'),c=getComputedStyle(b);return {flag:b.dataset.mandatory,visible:getComputedStyle(a).display!=='none',filter:c.filter,outline:c.outlineStyle,old:getComputedStyle(b,'::after').display}});
  assert.deepEqual(actual,{flag:String(expected),visible:expected,filter:'none',outline:'none',old:'none'});
 };
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  for(const [name,hand,state,expected] of [
   ['cor ativa',[card('num','blue')],{},false],['mesmo número',[card('num','red',9)],{},false],
   ['mesmo símbolo',[card('skip','red')],{discard:[card('skip','blue',null,840001)]},false],
   ['Coringa',[card('wild',null)],{},false],['+4',[card('wild4',null)],{},false],['+6',[card('wild6',null)],{},false],
   ['Panela legal',[card('dist',null),card()],{},false],['sem carta válida',[card()],{},true],
   ['bot',[card()],{current:1},false],['resposta +2',[card('draw2','yellow')],{penalty:12,highest:2},false],
   ['resposta +4',[card('wild4',null)],{penalty:12,highest:4},false],['resposta +6',[card('wild6',null)],{penalty:20,highest:6},false],
   ['Panela responde',[card('dist',null),card()],{penalty:20,highest:6},false],
   ['+2 não responde a +6',[card('draw2','blue')],{penalty:20,highest:6},true],
   ['cor não responde a penalidade',[card('num','blue')],{penalty:12,highest:2},true],
   ['desafio continua disponível, sem carta de resposta',[card()],{penalty:6,highest:6,lastPenalty:{id:1,type:'wild6',challengeable:true}},true],
   ['compra já concluída',[card()],{drawn:810001},false],['resolvendo escolha',[card()],{pendingAction:{id:0}},false],
   ['fim da rodada',[card()],{phase:'roundOver'},false],['janela de corte',[card()],{unlockAt:Date.now()+86400000},false],
  ]){await fixture(state,hand);await glow(expected);console.log('PASS condição real: '+name);}
  // A compra usa o comando real, sem chamar render manualmente depois dela.
  await fixture();await glow(true);await p.locator('#buyBtn').tap();await glow(false);
  assert.equal(await p.evaluate(()=>CartasTest.getState().players[0].hand.length),2);
  assert.equal(await p.evaluate(()=>CartasTest.getState().drawn),830049);
  assert.ok(await p.locator('[data-card="830049"]').isEnabled());
  console.log('PASS compra real disponibiliza carta válida e retira imediatamente todo o brilho');
  await fixture();await glow(true);
  await p.evaluate(()=>{CartasTest.getState().activeColor='red';document.getElementById('useCardArt').onchange()});await glow(false);
  await p.evaluate(()=>{CartasTest.getState().activeColor='blue';document.getElementById('useCardArt').onchange()});await glow(true);
  await p.evaluate(()=>{CartasTest.getState().players[0].hand.push({id:810010,type:'wild',color:null});document.getElementById('useCardArt').onchange()});await glow(false);
  await p.evaluate(()=>{const s=CartasTest.getState();s.penalty=6;s.highest=6;document.getElementById('useCardArt').onchange()});await glow(true);
  await p.evaluate(()=>{const s=CartasTest.getState();s.penalty=0;s.highest=0;document.getElementById('useCardArt').onchange()});await glow(false);
  await p.screenshot({path:path.join(out,'carta-valida-sem-brilho.png'),scale:'css'});
  console.log('PASS alterações de cor, mão e penalidade atualizam a indicação sem condição antiga persistente');
  for(const [width,height] of [[568,320],[844,390],[1280,800],[390,844]]){
   await p.setViewportSize({width,height});await fixture();
   const geometry=await p.evaluate(()=>{
    const e=document.getElementById('stoveOrbit'),m=e.getScreenCTM(),b=e.getBBox(),scale=m.a;
    const center=new DOMPoint(245,245).matrixTransform(m),burner=document.getElementById('burner').getBoundingClientRect(),discard=document.getElementById('discard').getBoundingClientRect();
    // Confrontar pontos reais da curva com a elipse anterior. A alteração só pode estar embaixo.
    let topError=0,lowerError=0;const total=e.getTotalLength();
    for(let i=0;i<=2000;i++){const q=e.getPointAtLength(total*i/2000),angle=Math.acos(Math.max(-1,Math.min(1,(q.x-245)/220))),sin=Math.sin(angle),base=194*sin;
     if(q.y<245)topError=Math.max(topError,Math.abs(q.y-(245-base))*scale);
     else lowerError=Math.max(lowerError,Math.abs(q.y-(245+base+2/scale*sin*sin))*scale);
    }
    return {left:b.x,right:b.x+b.width,top:b.y,bottomExtra:(b.y+b.height-439)*scale,topError,lowerError,dx:center.x-burner.x-burner.width/2,dy:center.y-burner.y-burner.height/2,discardDx:discard.x+discard.width/2-burner.x-burner.width/2,identical:[...document.querySelectorAll('.stove-flow')].every(n=>n.getAttribute('d')===e.getAttribute('d')),duration:e.getAnimations()[0].effect.getTiming().duration};
   });
   assert.deepEqual([geometry.left,geometry.right,geometry.top],[25,465,51]);assert.ok(Math.abs(geometry.bottomExtra-2)<.01);
   // getPointAtLength aproxima arcos internamente; tolerância de 0,2px CSS.
   // Os extremos acima são medidos separadamente, com precisão de 0,01px.
   assert.ok(geometry.topError<.2&&geometry.lowerError<.2,JSON.stringify(geometry));
   assert.ok(Math.abs(geometry.dx+4)<.1&&Math.abs(geometry.dy)<.1&&Math.abs(geometry.discardDx)<.1);
   assert.ok(geometry.identical);assert.equal(geometry.duration,7500);
   await p.screenshot({path:path.join(out,`${width}x${height}-rastro-halo.png`),scale:'css'});
  }
  console.log('PASS trajetória real: +2px CSS somente embaixo em quatro escalas; topo, lados, centro −4px, chama/descarte e velocidade preservados');
  // Isolar no screenshot o DOM real, incluindo CSS, contain, deslocamentos e sombras.
  // O teste anterior copiava apenas o SVG: não detectava contorno/filtro herdado do botão.
  for(const [width,height] of [[568,320],[844,390],[1280,800]]){
   await p.setViewportSize({width,height});await fixture({penalty:20,highest:6});await glow(true);
   const style=await p.addStyleTag({content:'html,body{background:transparent!important}body *{visibility:hidden!important}#buyBtn,#buyBtn *{visibility:visible!important}'});
   const box=await p.locator('#pileAura').boundingBox(),clip={x:Math.floor(box.x),y:Math.floor(box.y),width:Math.ceil(box.x+box.width)-Math.floor(box.x),height:Math.ceil(box.y+box.height)-Math.floor(box.y)};
   const hideHalo=await p.addStyleTag({content:'#pileAura,#pileAura *{visibility:hidden!important}'});
   const cards=await p.screenshot({clip,omitBackground:true});await hideHalo.evaluate(e=>e.remove());
   const hideCards=await p.addStyleTag({content:'#pile,#pile *{visibility:hidden!important}'});
   for(const time of [0,275,550,825,1100]){
    await p.locator('#pileAura').evaluate((e,time)=>{const a=e.getAnimations()[0];a.pause();a.currentTime=time},time);
    const halo=await p.screenshot({clip,omitBackground:true});
    const pixels=await p.evaluate(async({cards,halo})=>{
     const read=async data=>{const i=new Image();i.src='data:image/png;base64,'+data;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return {w:c.width,h:c.height,data:ctx.getImageData(0,0,c.width,c.height).data}};
     const ref=await read(cards),light=await read(halo),alpha=(r,x,y)=>r.data[(y*r.w+x)*4+3];
     let overlap=0;for(let y=0;y<ref.h;y++)for(let x=0;x<ref.w;x++)if(alpha(ref,x,y)>8&&alpha(light,x,y)>8)overlap++;
     const edge=(vertical,sign)=>{const len=vertical?ref.h:ref.w,cross=Math.floor((vertical?ref.w:ref.h)/2),at=(r,n)=>vertical?alpha(r,cross,n):alpha(r,n,cross);let n=sign<0?0:len-1,step=sign<0?1:-1;while(n>=0&&n<len&&at(ref,n)<=8)n+=step;const source=n;while(n>=0&&n<len&&at(light,n)<=8)n-=step;return Math.abs(n-source)/4};
     return {overlap,gaps:[edge(true,-1),edge(true,1),edge(false,-1),edge(false,1)]};
    },{cards:cards.toString('base64'),halo:halo.toString('base64')});
    assert.equal(pixels.overlap,0,JSON.stringify({width,time,pixels}));assert.ok(pixels.gaps.every(n=>n>=3.5&&n<=7),JSON.stringify({width,time,pixels}));assert.ok(Math.max(...pixels.gaps)-Math.min(...pixels.gaps)<=1,JSON.stringify({width,time,pixels}));
    console.log(`PASS pixels DOM ${width}x${height}, pulsação ${time}ms: zero contato; vãos ${pixels.gaps.join('/')}px`);
   }
   await hideCards.evaluate(e=>e.remove());await style.evaluate(e=>e.remove());
  }
  await p.context().setOffline(true);await fixture();await glow(true);await fixture({},[card('wild',null)]);await glow(false);
  assert.deepEqual(errors,[]);console.log('PASS offline e ausência de erros JavaScript');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
