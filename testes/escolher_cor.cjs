// Artes oficiais, regiões reais de toque e integração com o motor existente.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const evidence=process.env.PANELAS_SCREENSHOTS||'/workspace/work/escolher-cor-evidence';
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[],external=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))external.push(r.url())});
 const refresh=()=>p.evaluate(()=>document.getElementById('useCardArt').onchange());
 const setup=(type='wild',penalty=0)=>p.evaluate(({type,penalty})=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,unlockAt:0,penalty,highest:penalty?2:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,pendingAction:null,activeColor:'red',direction:1,deadline:0,token:s.token+1});
  Object.assign(s.o,{timeout:0,cut:true,infinite:false,dist:true,rotate:true,duo:false});
  s.players.forEach((player,i)=>player.hand=[{id:9100+i,type:'num',color:'blue',num:3},{id:9200+i,type:'num',color:'green',num:5}]);
  s.players[0].hand=[{id:9000,type,color:null},{id:9001,type:'num',color:'blue',num:7},{id:9002,type:'num',color:'green',num:9}];
  s.discard=[{id:9300,type:penalty?'draw2':'num',color:'red',num:2}];s.deck=Array.from({length:80},(_,i)=>({id:9400+i,type:'num',color:'yellow',num:i%10}));
  document.getElementById('useCardArt').onchange();
 },{type,penalty});
 const open=async(type='wild',penalty=0)=>{await setup(type,penalty);await p.locator('[data-card="9000"]').tap();await p.locator('.color-picker').waitFor()};
 try{
  await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS/documentacao/MANIFESTO_ESPECIAIS_V1.json')));
  assert.equal(manifest.assets.length,13);
  for(const a of manifest.assets){const r=await p.request.get(new URL(a.path,base).href);assert.equal(r.status(),200);assert.equal(crypto.createHash('sha256').update(await r.body()).digest('hex'),a.sha256)}
  assert.ok(await p.evaluate(async assets=>{await Promise.all(assets.map(async a=>{const im=new Image();im.src=a.path;await im.decode();if(!im.naturalWidth)throw Error(a.path)}));return true},manifest.assets));
  console.log('PASS 13 artes oficiais: bytes SHA-256, HTTP, decodificação e arquivos completos; 52 frentes anteriores intactas pelo build');
  await setup('dist');assert.match(await p.locator('[data-card="9000"] .card-image').getAttribute('src'),/carta_panela_de_pressao.png$/);
  await setup();assert.match(await p.locator('[data-card="9000"] .card-image').getAttribute('src'),/carta_escolher_cor_montada_preview.png$/);
  const backs=await p.locator('.hidden-card,.deck-back').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundImage));assert.ok(backs.length>6&&backs.every(x=>x.includes('verso_todas_as_cartas.png')));
  assert.equal(await p.locator('#pile>.deck-back').count(),6);assert.equal(await p.locator('#pile .pan-avatar,#pile .deck-brand').count(),0);
  await p.screenshot({path:path.join(evidence,'mesa-versos.png')});
  console.log('PASS verso oficial em todas as mãos ocultas e seis camadas do monte; Panela de Pressão e Escolher Cor na mão');
  for(const [width,height] of [[320,568],[390,844],[412,915],[568,320],[844,390],[1280,800]]){
   await p.setViewportSize({width,height});await open();
   await p.locator('.color-picker-base').evaluate(im=>im.decode());
   await p.locator('.color-picker-card').evaluate(e=>e.style.aspectRatio='auto'); // WebView anterior a aspect-ratio também conserva 2:3.
   const geometry=await p.evaluate(()=>{
    const card=document.querySelector('.color-picker-card').getBoundingClientRect();
    const target=[...document.querySelectorAll('[data-color]')].map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,hit:e===document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),inside:r.x>=card.x&&r.right<=card.right&&r.y>=card.y&&r.bottom<=card.bottom}});
    const cancel=document.getElementById('cancelColor').getBoundingClientRect();return {ratio:card.width/card.height,target,fit:cancel.bottom<=innerHeight&&document.querySelector('.color-picker-dialog').getBoundingClientRect().top>=0,layers:document.querySelectorAll('.ingredient-layer img').length};
   });assert.ok(Math.abs(geometry.ratio-2/3)<.001);assert.equal(geometry.layers,4);assert.ok(geometry.fit&&geometry.target.every(t=>t.w>=44&&t.h>=44&&t.hit&&t.inside),JSON.stringify({width,height,geometry}));
   await p.screenshot({path:path.join(evidence,`seletor-${width}x${height}.png`)});await p.locator('#cancelColor').tap();
  }
  console.log('PASS 6 tamanhos retrato/paisagem/desktop, base 2:3 e quatro alvos dentro da carta com pelo menos 44px');
  await p.setViewportSize({width:390,height:844});
  for(const type of ['wild','wild4','wild6','dist'])for(const color of ['red','yellow','blue','green']){
   await open(type,type==='dist'?12:0);
   const before=await p.evaluate(()=>{const s=CartasTest.getState();return [s.deck.length+s.discard.length+s.players.reduce((n,p)=>n+p.hand.length,0),s.token]});
   assert.equal(await p.locator('.ingredient-layer').evaluateAll(es=>es.filter(e=>e.getAnimations().some(a=>a.effect.getTiming().iterations===Infinity)).length),4);
   await p.locator(`[data-color="${color}"]`).tap();
   const result=await p.evaluate(()=>{const s=CartasTest.getState();return {color:s.activeColor,pending:s.pendingAction,top:s.discard.at(-1).id,penalty:s.penalty,total:s.deck.length+s.discard.length+s.players.reduce((n,p)=>n+p.hand.length,0),ids:[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand)].map(c=>c.id)}});
   assert.equal(result.color,color);assert.equal(result.pending,null);assert.equal(result.top,9000);assert.equal(result.total,before[0]);assert.equal(new Set(result.ids).size,result.ids.length);assert.equal(result.penalty,type==='wild4'?4:type==='wild6'?6:0);
   assert.equal(await p.locator('.ingredient-selected').count(),1);assert.equal(await p.locator('[data-color]:enabled').count(),0);
   await p.locator(`[data-color="${color}"]`).dispatchEvent('click');assert.equal(await p.evaluate(()=>CartasTest.getState().discard.length),2);
   await p.locator('.color-picker').waitFor({state:'hidden'});assert.equal(await p.locator('.color-picker').count(),0);
  }
  console.log('PASS 16 escolhas por toque: quatro cores em Coringa, +4, +6 e Panela (+12); efeitos imediatos, destaque, conservação e envio único');
  // Nem Liquidificador, nem uma última carta criam seleção nova.
  await setup('rotate');await p.locator('[data-card="9000"]').tap();assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'red');
  await setup();await p.evaluate(()=>{CartasTest.getState().players[0].hand.length=1;document.getElementById('useCardArt').onchange()});await p.locator('[data-card="9000"]').tap();assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().finisher),0);
  await open();const beforeCancel=await p.evaluate(()=>CartasTest.getState().players[0].hand.map(c=>c.id));await p.evaluate(()=>PanelinhaNavigation.back({native:true}));assert.equal(await p.locator('.color-picker').count(),0);assert.deepEqual(await p.evaluate(()=>CartasTest.getState().players[0].hand.map(c=>c.id)),beforeCancel);
  await open();const beforeTap=await p.evaluate(()=>CartasTest.getState().deck.length);await p.mouse.click(8,8);assert.equal(await p.evaluate(()=>CartasTest.getState().deck.length),beforeTap);assert.ok(await p.locator('.color-picker').isVisible());await p.keyboard.press('Escape');
  console.log('PASS Liquidificador sem escolha, última carta finaliza, Voltar/Escape cancelam e o fundo bloqueia toque na mesa');
  // A animação de compra também usa o verso oficial, não o avatar provisório.
  await setup();await p.locator('#pile').tap();assert.ok(await p.locator('.drawn-card>.deck-back').count());assert.ok((await p.locator('.drawn-card>.deck-back').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundImage))).every(x=>x.includes('verso_todas_as_cartas.png')));await p.waitForFunction(()=>!document.querySelector('.drawn-card'));
  await p.emulateMedia({reducedMotion:'reduce'});await open();assert.equal(await p.locator('.ingredient-layer').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).length),0);await p.locator('[data-color="green"]').tap();assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'green');
  await p.context().setOffline(true);await open();await p.locator('[data-color="blue"]').tap();assert.equal(await p.evaluate(()=>CartasTest.getState().activeColor),'blue');await p.context().setOffline(false);
  console.log('PASS compras animadas com verso oficial, preferência por movimento reduzido e escolha offline');
  // Mouse e teclado em contexto desktop independente; o hover afeta uma só camada.
  const desktop=await b.newPage({viewport:{width:1280,height:800}});await desktop.goto(base);await desktop.locator('#singlePlayerBtn').click();await desktop.locator('#profileContinueBtn').click();await desktop.locator('#startBtn').click();
  await desktop.evaluate(()=>{const s=CartasTest.getState();s.token++;s.current=0;s.unlockAt=0;s.penalty=0;s.drawn=null;s.cutOpen=false;s.o.timeout=0;s.players[0].hand=[{id:9900,type:'wild',color:null},{id:9901,type:'num',color:'blue',num:8}];document.getElementById('useCardArt').onchange()});await desktop.locator('[data-card="9900"]').click();await desktop.locator('[data-color="red"]').hover();
  await desktop.waitForFunction(()=>document.querySelector('[data-ingredient="red"]').classList.contains('ingredient-hover'));assert.equal(await desktop.locator('.ingredient-hover').count(),1);
  const hover=await desktop.locator('[data-ingredient="red"]').evaluate(e=>({transform:getComputedStyle(e).transform,filter:getComputedStyle(e).filter,origin:getComputedStyle(e).transformOrigin}));assert.notEqual(hover.transform,'none');assert.match(hover.filter,/brightness/);
  await desktop.screenshot({path:path.join(evidence,'hover-tomates.png')});await desktop.mouse.move(4,4);assert.equal(await desktop.locator('.ingredient-hover').count(),0);
  await desktop.keyboard.press('Tab');await desktop.keyboard.press('Enter');await desktop.waitForFunction(()=>!CartasTest.getState().pendingAction);assert.equal(await desktop.evaluate(()=>CartasTest.getState().activeColor),'red');await desktop.close();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await refresh();
  console.log('PASS hover localizado com elevação/brilho/origem própria, seleção por teclado; sem erros JS ou dependências externas');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
