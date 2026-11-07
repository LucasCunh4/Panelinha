const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/elementos-cores';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS/documentacao/MANIFESTO_SELECAO_COR.json')));
 assert.equal(manifest.assets.length,4);for(const a of manifest.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../IMPORTACAO_PANELAS',a.path))).digest('hex'),a.sha256);
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url())});
  await p.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000');
  async function open(type){await p.evaluate(type=>{window.colorCalls=[];window.colorCancels=0;PanelinhaColorPicker.open(document.getElementById('modalRoot'),{cardType:type,choose:color=>colorCalls.push(color),cancel:()=>colorCancels++});},type);await p.waitForFunction(()=>[...document.querySelectorAll('.color-picker img')].every(im=>im.complete&&im.naturalWidth));}
  const mapping={red:'tomate_panelinha_512.png',blue:'mirtilos_panelinha_512.png',yellow:'queijo_panelinha_512.png',green:'alface_panelinha_512.png'};
  for(const [width,height]of [[1280,800],[1024,600],[844,390],[568,320],[390,844]])for(const type of ['wild','wild4','wild6']){
   await p.setViewportSize({width,height});await open(type);
   const layout=await p.locator('.color-picker').evaluate(n=>({
    images:[...n.querySelectorAll('.ingredient-image')].map(im=>{const s=getComputedStyle(im),r=im.getBoundingClientRect(),a=new DOMMatrix(s.transform),canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);return{color:im.dataset.ingredient,src:im.getAttribute('src'),natural:[im.naturalWidth,im.naturalHeight],w:r.width,h:r.height,x:r.x,y:r.y,right:r.right,bottom:r.bottom,fit:s.objectFit,opacity:s.opacity,animation:s.animationName,dy:a.f,scale:a.a,alpha:ctx.getImageData(0,0,1,1).data[3],preview:!!im.closest('.color-picker-card')};}),
    buttons:[...n.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,background:s.backgroundColor,border:s.borderTopWidth,color:b.dataset.color};}),
    old:n.querySelectorAll('.ingredient-layer,.color-zone,.color-picker-content').length,
    preview:n.querySelectorAll('.color-picker-card .card-image').length
   }));
   assert.equal(layout.old,0);assert.equal(layout.preview,1);assert.equal(layout.images.length,4);
   for(const im of layout.images){assert.ok(im.src.endsWith('/'+mapping[im.color]));assert.deepEqual(im.natural,[512,512]);assert.ok(Math.abs(im.w/im.h-1)<.001);assert.equal(im.fit,'contain');assert.equal(im.opacity,'1');assert.equal(im.animation,'none');assert.equal(im.dy,0);assert.equal(im.scale,1);assert.equal(im.alpha,0);assert.equal(im.preview,false);assert.ok(im.x>=0&&im.y>=8&&im.right<=width&&im.bottom<=height,JSON.stringify({width,height,im}));}
   for(const b of layout.buttons){assert.ok(b.x>=0&&b.y>=0&&b.right<=width+.5&&b.bottom<=height+.5,JSON.stringify({width,height,b}));assert.ok(b.w>=44&&b.h>=36);if(b.color){assert.equal(b.background,'rgba(0, 0, 0, 0)');assert.equal(b.border,'0px');}}
   await p.screenshot({path:path.join(out,type+'-'+width+'.png')});await p.locator('#cancelColor').click();assert.equal(await p.evaluate(()=>colorCancels),1);
  }
  console.log('PASS três cartas/cinco tamanhos: quatro PNGs corretos, transparentes, opacos no desenho, proporção e controles visíveis; estado normal parado e sem zonas/ingredientes sobrepostos');
  await p.setViewportSize({width:1280,height:800});await open('wild4');
  const before=await p.locator('.ingredient-image').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y};}));await p.locator('[data-color=red]').hover();await p.waitForTimeout(220);
  const hovered=await p.locator('[data-ingredient=red]').evaluate(n=>{const s=getComputedStyle(n),m=new DOMMatrix(s.transform);return{dy:m.f,scale:m.a,transition:s.transitionDuration};});assert.ok(Math.abs(hovered.dy+8)<.02&&Math.abs(hovered.scale-1.08)<.002);assert.ok(hovered.transition.includes('0.18s'));
  const after=await p.locator('.ingredient-image').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y};}));for(let i=1;i<4;i++)assert.deepEqual(before[i],after[i]);await p.mouse.move(5,5);await p.waitForTimeout(220);assert.equal(await p.locator('.ingredient-hover').count(),0);
  console.log('PASS hover de -8px/1,08 em 180ms, retorno suave e vizinhos imóveis');
  for(const type of ['wild','wild4','wild6'])for(const [i,color]of Object.keys(mapping).entries()){
   await open(type);if(i%2)await p.locator('[data-color='+color+']').tap();else await p.locator('[data-color='+color+']').click();assert.deepEqual(await p.evaluate(()=>colorCalls),[color]);await p.locator('.color-picker').waitFor({state:'hidden'});
  }
  await open('wild');await p.locator('[data-color=green]').dispatchEvent('pointerdown',{pointerType:'touch'});assert.equal(await p.locator('.ingredient-pressed').count(),1);assert.deepEqual(await p.evaluate(()=>colorCalls),[]);await p.locator('[data-color=green]').tap();assert.deepEqual(await p.evaluate(()=>colorCalls),['green']);await p.locator('.color-picker').waitFor({state:'hidden'});
  await open('wild6');await p.keyboard.press('Tab');assert.equal(await p.locator('[data-color=red]').evaluate(n=>n===document.activeElement),true);await p.keyboard.press('Enter');assert.deepEqual(await p.evaluate(()=>colorCalls),['red']);await p.locator('.color-picker').waitFor({state:'hidden'});
  await open('wild');await p.keyboard.press('Escape');assert.equal(await p.locator('.color-picker').count(),0);assert.equal(await p.evaluate(()=>colorCancels),1);
  assert.equal(await p.evaluate(()=>PanelinhaColorPicker.open(null,{cardType:'dist'})),false);assert.equal(await p.evaluate(()=>PanelinhaColorPicker.open(null,{cardType:'rotate'})),false);
  await p.emulateMedia({reducedMotion:'reduce'});await open('wild');await p.locator('[data-color=blue]').tap();assert.deepEqual(await p.evaluate(()=>colorCalls),['blue']);assert.equal(await p.locator('.color-picker').count(),0);
  await p.context().setOffline(true);await open('wild4');assert.equal(await p.locator('.ingredient-image').count(),4);await p.locator('[data-color=yellow]').tap();assert.deepEqual(await p.evaluate(()=>colorCalls),['yellow']);await p.context().setOffline(false);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS 12 escolhas por mouse/toque, feedback móvel, teclado, cancelar/Escape, movimento reduzido, recursos carregados offline e recusa de Panela/Liquidificador; nenhum erro JS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
