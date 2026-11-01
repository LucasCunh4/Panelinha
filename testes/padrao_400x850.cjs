// Mesma geometria da mesa e encaixe contain; somente duas imagens substituídas.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_PADRAO_400X850.json')));
const base=process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000/';
const out=process.env.PANELAS_SCREENSHOTS||'/workspace/work/padrao-evidence';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const settle=async()=>{await p.locator('#hand').evaluate(e=>e.getAnimations().forEach(a=>a.finish()))};
 const fixture=(duo=false)=>p.evaluate(duo=>{
  const s=CartasTest.getState();Object.assign(s,{phase:'playing',current:0,activeColor:'blue',direction:1,penalty:0,highest:0,lastPenalty:null,finisher:null,drawn:null,cutOpen:false,unlockAt:0,pendingAction:null,deadline:0,lastActor:null,token:s.token+1});Object.assign(s.o,{timeout:0,duo,single:true});
  s.players.forEach((player,i)=>player.hand=[{id:76000+i,type:'num',color:'blue',num:5},{id:76100+i,type:'dist',color:null}]);
  s.discard=[{id:76200,type:'num',color:'blue',num:5}];s.deck=Array.from({length:80},(_,i)=>({id:76300+i,type:'num',color:'yellow',num:i%10}));document.getElementById('useCardArt').onchange();
 },duo);
 try{
  await p.goto(base);await p.locator('#singlePlayerBtn').tap();await p.locator('#profileContinueBtn').tap();await p.locator('#startBtn').tap();
  assert.equal(manifest.assets.length,2);
  for(const a of manifest.assets){const r=await p.request.get(new URL(a.path,base).href);assert.equal(r.status(),200);assert.equal(crypto.createHash('sha256').update(await r.body()).digest('hex'),a.sha256)}
  const masks=await p.evaluate(async assets=>{
   const arrays=[];
   for(const a of assets){const im=new Image();im.src=a.path;await im.decode();if(im.naturalWidth!==400||im.naturalHeight!==850)throw Error('Dimensões');const c=document.createElement('canvas');c.width=400;c.height=850;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const bytes=ctx.getImageData(0,0,400,850).data;arrays.push(Array.from(bytes.filter((_,i)=>i%4===3)))}
   return {equal:arrays[0].every((n,i)=>n===arrays[1][i]),corners:arrays.every(a=>[a[0],a[399],a[849*400],a[a.length-1]].every(n=>n===0)),rounded:arrays.every(a=>a[11*400+10]===0&&a[30*400+30]>0)};
  },manifest.assets);assert.ok(masks.equal&&masks.corners&&masks.rounded,JSON.stringify(masks));
  for(const file of ['MANIFESTO_52_PNG.json','MANIFESTO_MESA_V1.json','MANIFESTO_MENU_V1.json','MANIFESTO_MAIS4_MAIS6.json','MANIFESTO_ESPECIAIS_V1.json']){
   const m=JSON.parse(fs.readFileSync(path.join(root,'documentacao',file)));for(const a of m.files||m.asset_files||m.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256);
  }
  assert.ok(!fs.existsSync(path.join(root,'assets/especiais/verso_todas_as_cartas.png')));assert.ok(!fs.existsSync(path.join(root,'assets/especiais/carta_panela_de_pressao.png')));
  console.log('PASS dois PNGs oficiais por SHA-256/HTTP, 400x850 RGBA, alfas idênticos e cantos transparentes; demais artes intactas, antigas removidas');
  for(const [width,height] of [[568,320],[844,390],[915,412],[1280,800],[320,568],[390,844]])for(const duo of [false,true]){
   await p.setViewportSize({width,height});await fixture(duo);await settle();
   const styles=await p.evaluate(()=>{
    const standard=document.querySelector('[data-card="76100"] .card'),number=document.querySelector('[data-card="76000"] .card');
    const back=[...document.querySelectorAll('.hidden-card,.deck-back')];
    const image=standard.querySelector('img'),style=getComputedStyle(image);
    return {sameBox:standard.offsetWidth===number.offsetWidth&&standard.offsetHeight===number.offsetHeight,art:image.getAttribute('src'),fit:style.objectFit,radius:style.borderRadius,border:getComputedStyle(standard).borderTopWidth,backs:back.length,allBacks:back.every(e=>{const s=getComputedStyle(e);return s.backgroundImage.includes('verso_oficial_400x850.png')&&s.backgroundSize==='contain'&&s.borderTopWidth==='0px'&&s.borderRadius==='0px'}),layers:document.querySelectorAll('#pile>.deck-back').length,noScroll:document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight};
   });assert.ok(styles.sameBox&&styles.allBacks&&styles.noScroll,JSON.stringify(styles));assert.match(styles.art,/panela_de_pressao_400x850.png$/);assert.equal(styles.fit,'contain');assert.equal(styles.border,'0px');assert.equal(styles.radius,'0px');assert.equal(styles.layers,6);assert.ok(styles.backs>6);
   if(width===844||width===390)await p.screenshot({path:path.join(out,`mesa-${width}x${height}-${duo?'duplas':'individual'}.png`)});
  }
  console.log('PASS 12 layouts individual/duplas, panorama e fallback retrato: caixa da Panela igual à numérica, contain sem borda/recorte CSS, verso em todas as mãos e seis camadas do monte');
  await p.setViewportSize({width:844,height:390});await fixture();await p.locator('[data-card="76100"]').tap();await p.locator('[data-color=red]').tap();
  assert.match(await p.locator('#discard .discard-top .card-image').getAttribute('src'),/panela_de_pressao_400x850.png$/);
  assert.match(await p.locator('.played-card[data-card-id="76100"] .flight-front .card-image').getAttribute('src'),/panela_de_pressao_400x850.png$/);
  await p.locator('.color-picker').waitFor({state:'hidden'});await p.waitForFunction(()=>!document.querySelector('.played-card'));
  await fixture();await p.locator('#pile').tap();assert.ok(await p.locator('.drawn-card>.deck-back').count());assert.ok((await p.locator('.drawn-card>.deck-back').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundImage))).every(x=>x.includes('verso_oficial_400x850.png')));await p.waitForFunction(()=>!document.querySelector('.drawn-card'));
  await p.context().setOffline(true);await fixture(true);assert.match(await p.locator('#player2 .standard-card .card-image').getAttribute('src'),/panela_de_pressao_400x850.png$/);await p.context().setOffline(false);
  assert.deepEqual(errors,[]);console.log('PASS Panela no descarte/voo, compra com verso novo e parceiro aberto offline; sem exceções JS');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
