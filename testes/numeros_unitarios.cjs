// Composição real no navegador: o PNG unitário não recebe deformação nem recorte novo.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS'),out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/numeros-refeitos';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_CARTAS_470X800.json')));
 const units=manifest.assets.filter(a=>a.path.includes('/elementos/'));assert.equal(units.length,13);
 for(const a of units){assert.match(a.path,/_refeito\.png$/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256);}
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:900},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8000');
  await p.evaluate(()=>{
   const section=document.createElement('section');section.id='unitGallery';section.style='position:fixed;inset:0;z-index:200;background:#261033;display:grid;grid-template-columns:repeat(13,1fr);align-content:center;gap:12px;padding:18px;--card-width:82px';
   const cards=['red','blue','green','yellow'].flatMap(color=>[...Array.from({length:10},(_,num)=>({type:'num',num,color})),...['draw2','skip','reverse'].map(type=>({type,color}))]);
   section.innerHTML=cards.map(c=>PanelinhaCards.html(c)).join('');document.body.append(section);
  });
  await p.waitForFunction(()=>[...document.querySelectorAll('#unitGallery img')].every(im=>im.complete&&im.naturalWidth));
  const cards=await p.locator('#unitGallery>.card').evaluateAll(ns=>ns.map(n=>{
   const f=n.querySelector('.card-face'),r=f.getBoundingClientRect(),relative=im=>{const b=im.getBoundingClientRect(),s=getComputedStyle(im);return{x:(b.x-r.x)/r.width,y:(b.y-r.y)/r.height,w:b.width/r.width,h:b.height/r.height,fit:s.objectFit,events:s.pointerEvents,src:im.getAttribute('src'),drag:im.draggable};};
   return{type:n.dataset.cardType,key:n.querySelector('.card-symbol').getAttribute('src').split('/').at(-1).replace('_refeito.png',''),images:[...f.querySelectorAll('img')].map(relative),text:n.textContent.trim()};
  }));
  assert.equal(cards.length,52);
  for(const c of cards){
   assert.equal(c.images.length,4);assert.equal(c.text,'');assert.match(c.images[0].src,/\/fundos\//);
   const [center,top,bottom]=c.images.slice(1);
   const ink=await p.evaluate(({key,images})=>{const [l,t,r,b]=PanelinhaCards.symbolArt.bounds[key],{width,height}=PanelinhaCards.symbolArt;return images.map(i=>({x:i.x+i.w*l/width,y:i.y+i.h*t/height,w:i.w*(r-l)/width,h:i.h*(b-t)/height}));},{key:c.key,images:[center,top,bottom]});
   const [main,upper,lower]=ink;
   assert.ok([center,top,bottom].every(i=>i.src===center.src&&i.events==='none'&&i.fit==='contain'&&!i.drag));
   for(const i of [center,top,bottom])assert.ok(i.x>=0&&i.y>=0&&i.x+i.w<=1.001&&i.y+i.h<=1.001,JSON.stringify(i));
   assert.ok(Math.abs((main.x+main.w/2)-.5)<.002);assert.ok(Math.abs((main.y+main.h/2)-374/800)<.002);
   assert.ok(main.w*470>=190&&main.w*470<=351&&main.h*800>=250&&main.h*800<=316,JSON.stringify({c,ink}));
   assert.ok(Math.abs(upper.x-40/470)<.002&&Math.abs(upper.y-38/800)<.002);
   assert.ok(Math.abs(lower.x+lower.w-(1-40/470))<.002&&Math.abs(lower.y+lower.h-(1-38/800))<.002);
   assert.ok(Math.abs(top.w-bottom.w)<.002&&Math.abs(top.h-bottom.h)<.002);
  }
  // Ajustar somente o centro não desloca fundo, moldura ou símbolos dos cantos.
  const adjustable=await p.locator('#unitGallery>.card').first().evaluate(n=>{
   const original=n.getAttribute('style');const positions=()=>[...n.querySelectorAll('.card-frame,.card-image')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}),before=positions();
   n.style.setProperty('--symbol-center-x','55%');n.style.setProperty('--symbol-center-width','65%');const after=positions();n.setAttribute('style',original);return{before,after};
  });
  for(const i of [0,1,3,4])assert.deepEqual(adjustable.before[i],adjustable.after[i]);assert.notDeepEqual(adjustable.before[2],adjustable.after[2]);
  await p.screenshot({path:path.join(out,'unitarios-52-combinacoes.png')});await p.locator('#unitGallery').evaluate(n=>n.remove());
  console.log('PASS 52 combinações: fundo + três instâncias idênticas, centro/cantos independentes, contain, margem interna, sem eventos nas imagens; 13 PNGs íntegros');
  await p.locator('#singlePlayerBtn').click();await p.locator('#profileContinueBtn').click();await p.locator('#startBtn').click();await p.waitForTimeout(600);
  for(const [width,height]of [[568,320],[844,390],[1024,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(250);
   const sizes=await p.evaluate(()=>{const hand=document.querySelector('#hand .card');return{ratio:hand.offsetWidth/hand.offsetHeight,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
   // Valores calc/clamp são resolvidos num elemento de referência, sem afetar o leque.
   const increase=await p.evaluate(()=>{const table=document.getElementById('table'),r=document.createElement('div');r.style='position:absolute;pointer-events:none;width:var(--card-base-width);height:0';table.append(r);const base=r.getBoundingClientRect().width,actual=parseFloat(getComputedStyle(document.getElementById('pile')).width);r.remove();return actual/base;});
   assert.ok(Math.abs(increase/(height<=340?1.02:1.05)-1.08)<.002);assert.equal(sizes.overflow,false);assert.ok(Math.abs(sizes.ratio-520/850)<.02);
   await p.screenshot({path:path.join(out,'unitarios-mesa-'+width+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS aumento relativo de 8% sobre a versão anterior, proporção/bordas e mesa sem rolagem em celular/tablet/desktop');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
