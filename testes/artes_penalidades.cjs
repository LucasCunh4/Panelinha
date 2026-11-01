// Somente integração visual: as regras continuam no script original do jogo.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_MAIS4_MAIS6.json')));
const repaired=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_INTERACAO_V2.json')));
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/mais4-mais6-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url())});
 const setup=(type='wild4',penalty=0,highest=0)=>p.evaluate(({type,penalty,highest})=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,unlockAt:0,penalty,highest,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'red',direction:1,deadline:0,lastActor:null,token:s.token+1});
  Object.assign(s.o,{timeout:0,cut:true,challenge:true,infinite:false,duo:false,single:true});
  s.players.forEach((player,i)=>player.hand=[{id:71000+i,type:'num',color:'blue',num:3},{id:72000+i,type:'num',color:'green',num:5}]);
  s.players[0].hand=[{id:70000,type,color:null},{id:70001,type:'num',color:'blue',num:7},{id:70002,type:'num',color:'green',num:9}];
  s.discard=[{id:73000,type:penalty?(highest===2?'draw2':highest===4?'wild4':'wild6'):'num',color:highest>=4?null:'red',num:2}];
  s.deck=Array.from({length:100},(_,i)=>({id:74000+i,type:'num',color:'yellow',num:i%10}));document.getElementById('useCardArt').onchange();
 },{type,penalty,highest});
 const open=async(type='wild4',penalty=0,highest=0)=>{await setup(type,penalty,highest);await p.locator('[data-card="70000"]').tap();await p.locator('.color-picker').waitFor()};
 try{
  await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  assert.equal(manifest.assets.length,22);
  for(const a of manifest.assets){const r=await p.request.get(new URL(a.path,base).href);assert.equal(r.status(),200);assert.equal(crypto.createHash('sha256').update(await r.body()).digest('hex'),a.sha256)}
  for(const file of ['MANIFESTO_52_PNG.json','MANIFESTO_MESA_V1.json','MANIFESTO_MENU_V1.json','MANIFESTO_ESPECIAIS_V1.json']){
   const m=JSON.parse(fs.readFileSync(path.join(root,'documentacao',file)));for(const a of m.files||m.asset_files||m.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256);
  }
  assert.ok(await p.evaluate(async assets=>{await Promise.all(assets.map(async a=>{const im=new Image();im.src=a.path;await im.decode();if(!im.naturalWidth)throw Error(a.path)}));return true},manifest.assets));
  console.log('PASS 22 PNGs novos por SHA-256/HTTP/decodificação; todas as artes anteriores preservadas');
  for(const type of ['wild4','wild6']){
   await open(type);const layout=repaired.layouts[type],n=type.slice(-1);
   assert.equal(await p.locator('.color-picker-base').getAttribute('src'),layout.base);
   assert.match(await p.locator('[data-card="70000"] .card-image').getAttribute('src'),new RegExp(`carta_mais${n}_completa.png$`));
   for(const [name,l] of Object.entries(layout.layers)){
    const color={tomates:'red',queijos:'yellow',mirtilos:'blue',alfaces:'green'}[name];
    assert.equal(await p.locator(`[data-ingredient="${color}"] img`).getAttribute('src'),l.path);
    const measured=await p.locator(`[data-color="${color}"]`).evaluate(e=>{const c=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return [(r.x-c.x)/c.width,(r.y-c.y)/c.height,r.width/c.width,r.height/c.height]});
    [l.hitRegion.x,l.hitRegion.y,l.hitRegion.width,l.hitRegion.height].forEach((expected,i)=>assert.ok(Math.abs(expected-measured[i])<.001));
   }
   // Composição apenas em memória: igualdade de pixels com o preview fornecido.
   const compositionDelta=await p.evaluate(async n=>{
    const load=async name=>{const im=new Image();im.src=`assets/cartas_mais4_mais6/carta_mais${n}_${name}.png`;await im.decode();return im};
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(await load('base_sem_ingredientes'),0,0);for(const name of ['tomates','queijos','mirtilos','alfaces'])ctx.drawImage(await load(name+'_overlay_full'),0,0);
    const actual=ctx.getImageData(0,0,1024,1536).data;ctx.clearRect(0,0,1024,1536);ctx.drawImage(await load('montada_camadas_preview'),0,0);const expected=ctx.getImageData(0,0,1024,1536).data;
    let max=0;for(let i=0;i<actual.length;i++)max=Math.max(max,Math.abs(actual[i]-expected[i]));return max;
   },n);assert.ok(compositionDelta<=1,`Composição desalinhada: diferença ${compositionDelta}`); // Arredondamento alfa do Canvas: até 1/255 por canal.
   await p.locator('#cancelColor').tap();
   for(const [width,height] of [[320,568],[390,844],[412,915],[568,320],[844,390],[1280,800]]){
    await p.setViewportSize({width,height});await open(type);
    assert.ok(await p.locator('[data-color]').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&e===document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)})));
    await p.locator('.ingredient-layer img').evaluateAll(es=>Promise.all(es.map(im=>im.decode())));
    if(width===390||width===568)await p.screenshot({path:path.join(out,`${type}-${width}x${height}.png`)});
    await p.locator('#cancelColor').tap();
   }
  }
  console.log('PASS bases reparadas/camadas da Coringa; montagem histórica preservada (alfa <=1/255); 12 layouts, alvos >=44px e frente completa na mão');
  await p.setViewportSize({width:390,height:844});
  for(const type of ['wild4','wild6'])for(const [penalty,highest] of [[0,0],[2,2],[12,4],...(type==='wild6'?[[20,6]]:[])])for(const color of ['red','yellow','blue','green']){
   await open(type,penalty,highest);const before=await p.evaluate(()=>{const s=CartasTest.getState();return [...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()});
   assert.equal(await p.locator('.ingredient-layer').evaluateAll(es=>es.filter(e=>e.getAnimations().some(a=>a.effect.getTiming().iterations===Infinity)).length),4);
   await p.locator(`[data-color="${color}"]`).tap();
   const result=await p.evaluate(()=>{const s=CartasTest.getState();return {color:s.activeColor,penalty:s.penalty,pending:s.pendingAction,top:s.discard[s.discard.length-1].type,ids:[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id).sort().join()}});
   assert.equal(result.color,color);assert.equal(result.penalty,penalty+Number(type.slice(-1)));assert.equal(result.pending,null);assert.equal(result.top,type);assert.equal(result.ids,before);
   assert.equal(await p.locator('.ingredient-selected').count(),1);
   assert.match(await p.locator('#discard .discard-top .card-image').getAttribute('src'),new RegExp(`carta_mais${type.slice(-1)}_completa.png$`));
   const flight=p.locator('.played-card[data-card-id="70000"] .flight-front .card-image');assert.ok(await flight.count());assert.match(await flight.first().getAttribute('src'),/carta_mais[46]_completa.png$/);
   await p.locator(`[data-color="${color}"]`).dispatchEvent('click');assert.equal(await p.evaluate(()=>CartasTest.getState().discard.length),2);
   await p.locator('.color-picker').waitFor({state:'hidden'});
  }
  console.log('PASS 28 escolhas por toque: quatro cores, penalidades +2/+4/+6 acumuladas, conservação, destaque e envio único; frente oficial no descarte e no voo');
  await setup('wild4',6,6);assert.ok(await p.locator('[data-card="70000"]').isDisabled());
  for(const type of ['wild4','wild6']){
   await setup(type);await p.evaluate(()=>{CartasTest.getState().players[0].hand.length=1;document.getElementById('useCardArt').onchange()});await p.locator('[data-card="70000"]').tap();assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().finisher),0);
   await p.emulateMedia({reducedMotion:'reduce'});await open(type);assert.equal(await p.locator('.ingredient-layer').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).length),0);await p.context().setOffline(true);await p.locator('[data-color="blue"]').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');await p.context().setOffline(false);await p.emulateMedia({reducedMotion:'no-preference'});
  }
  console.log('PASS +4 proibido sobre +6, última carta sem seletor, escolha offline e movimento reduzido nas duas cartas');
  // Mouse real no mesmo componente, com origem localizada e apenas uma camada expandida.
  const d=await b.newPage({viewport:{width:1280,height:800}});await d.goto(base);
  for(const cardType of ['wild4','wild6']){
   await d.evaluate(cardType=>PanelinhaColorPicker.open(document.getElementById('modalRoot'),{cardType,choose(c){window.__chosenColor=c},cancel(){}}),cardType);
   for(const color of ['red','yellow','blue','green']){
    await d.locator(`[data-color="${color}"]`).hover();assert.equal(await d.locator('.ingredient-hover').count(),1);assert.equal(await d.locator(`[data-ingredient="${color}"]`).evaluate(e=>e.classList.contains('ingredient-hover')),true);
   }
   await d.screenshot({path:path.join(out,`${cardType}-hover.png`)});await d.locator('[data-color="green"]').click();assert.equal(await d.evaluate(()=>window.__chosenColor),'green');await d.locator('.color-picker').waitFor({state:'hidden'});
  }
  await d.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS hover nas oito regiões das duas cartas, clique e feedback; sem erros JS ou solicitações externas');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
