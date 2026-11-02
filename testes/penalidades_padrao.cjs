// Geometria e integração visual. Nenhuma regra alternativa é implementada pelo teste.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_MAIS4_MAIS6.json')));
const composition=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_INTERACAO_V2.json')));
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/penalty-400x850-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const setup=type=>p.evaluate(type=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,unlockAt:0,cutOpen:false,pendingAction:null,penalty:0,highest:0,lastPenalty:null,drawn:null,activeColor:'red',direction:1,finisher:null,lastActor:null,deadline:0,unoWindow:null,token:s.token+1});
  Object.assign(s.o,{timeout:0,infinite:false,cut:true,challenge:true,duo:false,wild6:true});
  s.players.forEach((player,i)=>player.hand=[{id:920000+i*100,type:'num',color:'blue',num:7},{id:920001+i*100,type:'num',color:'green',num:5}]);
  s.players[0].hand.push({id:920002,type,color:null});
  s.deck=Array.from({length:30},(_,i)=>({id:930000+i,type:'num',color:'yellow',num:2}));s.discard=[{id:940000,type:'num',color:'red',num:9}];document.getElementById('useCardArt').onchange();
 },type);
 try{
  await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  const masks=await p.evaluate(async()=>{
   const paths=['assets/padronizadas/verso_oficial_400x850.png',...[4,6].flatMap(n=>['completa','base_sem_ingredientes'].map(s=>`assets/cartas_mais4_mais6/carta_mais${n}_${s}.png`))];
   let expected;const sizes=[];let mismatches=0;
   for(const path of paths){const im=new Image();im.src=path;await im.decode();sizes.push([im.naturalWidth,im.naturalHeight]);const c=document.createElement('canvas');c.width=400;c.height=850;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,400,850).data;if(!expected)expected=a;else for(let i=3;i<a.length;i+=4)if(a[i]!==expected[i])mismatches++;}
   return {sizes,mismatches};
  });assert.equal(masks.mismatches,0);assert.ok(masks.sizes.every(s=>s[0]===400&&s[1]===850));
  console.log('PASS frentes/bases 400x850, máscara alfa idêntica ao verso padronizado, incluindo todos os cantos');
  for(const [width,height] of [[568,320],[844,390],[915,412],[1280,800],[568,240],[390,844]])for(const type of ['wild4','wild6']){
   await p.setViewportSize({width,height});await setup(type);
   const normal=await p.evaluate(()=>{
    const special=document.querySelector('[data-card="920002"] .card'),number=document.querySelector('[data-card="920000"] .card'),im=special.querySelector('img');const style=getComputedStyle(im);
    return {sameBox:special.offsetWidth===number.offsetWidth&&special.offsetHeight===number.offsetHeight,border:getComputedStyle(special).borderWidth,radius:style.borderRadius,fit:style.objectFit,ratio:style.aspectRatio,source:im.getAttribute('src'),scroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};
   });assert.ok(normal.sameBox&&!normal.scroll);assert.equal(normal.border,'0px');assert.equal(normal.radius,'0px');assert.equal(normal.fit,'contain');assert.equal(normal.ratio,'400 / 850');assert.match(normal.source,new RegExp(`carta_mais${type.slice(-1)}_completa.png$`));
   if(width===844)await p.screenshot({path:path.join(out,`${type}-mao.png`)});
   await p.locator('[data-card="920002"]').tap();await p.locator('.color-picker').waitFor();await p.locator('.color-picker-card').evaluate(e=>e.style.aspectRatio='auto');
   const geometry=await p.evaluate(()=>{
    const card=document.querySelector('.color-picker-card').getBoundingClientRect(),dialog=document.querySelector('.color-picker-dialog').getBoundingClientRect();
    const controlsInside=[...document.querySelectorAll('.color-picker h2,.color-picker p,.color-picker-card,#cancelColor')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+.1&&r.bottom<=innerHeight+.1});
    return {ratio:card.width/card.height,inside:controlsInside&&dialog.left>=0&&dialog.top>=0&&dialog.right<=innerWidth+.1&&dialog.bottom<=innerHeight+.1,completeUnder:document.querySelector('.color-picker-base').src.includes('_completa.png'),layers:[...document.querySelectorAll('.ingredient-layer')].map(layer=>{
     const image=layer.querySelector('img'),r=image.getBoundingClientRect(),hit=document.querySelector(`[data-color="${layer.dataset.ingredient}"]`),hr=hit.getBoundingClientRect();
     return {color:layer.dataset.ingredient,images:layer.querySelectorAll('image,img').length,path:image.getAttribute('src'),x:(r.x-card.x)/card.width,y:(r.y-card.y)/card.height,width:r.width/card.width,height:r.height/card.height,proportional:getComputedStyle(image).objectFit==='contain',opacity:getComputedStyle(image).opacity,hit:document.elementFromPoint(hr.x+hr.width/2,hr.y+hr.height/2)===hit,target:[hr.width,hr.height]};
    })};
   });assert.ok(Math.abs(geometry.ratio-400/850)<.001&&geometry.inside&&!geometry.completeUnder,JSON.stringify({width,height,geometry}));
   for(const [name,l] of Object.entries(composition.layouts[type].layers)){
    const layer=geometry.layers.find(l=>l.color==={tomates:'red',queijos:'yellow',mirtilos:'blue',alfaces:'green'}[name]);
    assert.equal(layer.images,1);assert.equal(layer.path,l.path);assert.ok(layer.proportional&&layer.hit&&layer.target.every(n=>n>=44));assert.equal(layer.opacity,'1');
    assert.ok(Math.abs(layer.x)<.001&&Math.abs(layer.y)<.001&&Math.abs(layer.width-1)<.001&&Math.abs(layer.height-1)<.001,JSON.stringify(layer));
   }
   assert.equal(await p.locator('.color-picker-clean,.ingredient-art').count(),0);assert.equal(await p.locator('.color-picker-base').getAttribute('src'),composition.layouts[type].base);
   if(width===844||width===568&&height===320)await p.screenshot({path:path.join(out,`${type}-${width}x${height}-seletor.png`)});
   await p.locator('#cancelColor').tap();
  }
  console.log('PASS 12 layouts: mesmas caixas numéricas, contain sem borda, seletor 400x850, ingredientes únicos das novas artes sem deformação, coordenadas oficiais e alvos >=44px');
  await p.setViewportSize({width:844,height:390});
  for(const type of ['wild4','wild6']){
   await setup(type);await p.evaluate(type=>{const s=CartasTest.getState();s.players[0].hand.pop();s.deck[s.deck.length-1]={id:950000,type,color:null};document.getElementById('useCardArt').onchange()},type);
   await p.locator('#buyBtn').tap();assert.ok(await p.locator('.drawn-card>.deck-back').count());
   assert.match(await p.locator('[data-card="950000"] .card-image').getAttribute('src'),new RegExp(`carta_mais${type.slice(-1)}_completa.png$`));
   await p.locator('[data-card="950000"]').tap();await p.locator('[data-color=green]').tap();
   const flight=p.locator('.played-card[data-card-id="950000"] .flight-front .card-image');assert.match(await flight.getAttribute('src'),new RegExp(`carta_mais${type.slice(-1)}_completa.png$`));
   assert.match(await p.locator('#discard .discard-top .card-image').getAttribute('src'),new RegExp(`carta_mais${type.slice(-1)}_completa.png$`));
   assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'green');await p.locator('.color-picker').waitFor({state:'hidden'});await p.screenshot({path:path.join(out,`${type}-descarte.png`)});
   await p.context().setOffline(true);await setup(type);await p.locator('[data-card="920002"]').tap();await p.locator('[data-color=blue]').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');await p.locator('.color-picker').waitFor({state:'hidden'});await p.context().setOffline(false);
  }
  assert.deepEqual(errors,[]);console.log('PASS compra real, frente na mão/voo/descarte e escolhas offline nas duas cartas; sem erros JavaScript');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
