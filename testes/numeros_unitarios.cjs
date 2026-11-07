// Composição real no navegador: o PNG unitário não recebe deformação nem recorte novo.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'../IMPORTACAO_PANELAS'),out=process.env.PANELINHA_TEST_OUTPUT||'/workspace/work/numeros-unitarios';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentacao/MANIFESTO_CARTAS_470X800.json')));
 const units=manifest.assets.filter(a=>a.path.includes('/elementos/'));assert.equal(units.length,13);
 for(const a of units){assert.match(a.path,/_unitario\.png$/);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,a.path))).digest('hex'),a.sha256);}
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
   return{type:n.dataset.cardType,images:[...f.querySelectorAll('img')].map(relative),text:n.textContent.trim()};
  }));
  assert.equal(cards.length,52);
  for(const c of cards){
   assert.equal(c.images.length,4);assert.equal(c.text,'');assert.match(c.images[0].src,/\/fundos\//);
   const [center,top,bottom]=c.images.slice(1),size=['draw2','reverse'].includes(c.type)?350:340;
   assert.ok([center,top,bottom].every(i=>i.src===center.src&&i.events==='none'&&i.fit==='contain'&&!i.drag));
   for(const i of [center,top,bottom])assert.ok(i.x>=0&&i.y>=0&&i.x+i.w<=1.001&&i.y+i.h<=1.001,JSON.stringify(i));
   assert.ok(Math.abs((center.x+center.w/2)-.5)<.002);assert.ok(Math.abs((center.y+center.h/2)-380/800)<.002);
   assert.ok(Math.abs(center.w-size/470)<.002&&Math.abs(center.h-size/800)<.002);
   assert.ok(Math.abs(top.x-28/470)<.002&&Math.abs(top.y-34/800)<.002);
   assert.ok(Math.abs(bottom.x+bottom.w-(1-28/470))<.002&&Math.abs(bottom.y+bottom.h-(1-34/800))<.002);
   assert.ok(Math.abs(top.w-bottom.w)<.002&&Math.abs(top.h-bottom.h)<.002);
  }
  // Ajustar somente o centro não desloca fundo, moldura ou símbolos dos cantos.
  const adjustable=await p.locator('#unitGallery>.card').first().evaluate(n=>{
   const positions=()=>[...n.querySelectorAll('.card-frame,.card-image')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}),before=positions();
   n.style.setProperty('--symbol-center-x','55%');n.style.setProperty('--symbol-center-width','65%');const after=positions();return{before,after};
  });
  for(const i of [0,1,3,4])assert.deepEqual(adjustable.before[i],adjustable.after[i]);assert.notDeepEqual(adjustable.before[2],adjustable.after[2]);
  await p.screenshot({path:path.join(out,'unitarios-52-combinacoes.png')});await p.locator('#unitGallery').evaluate(n=>n.remove());
  console.log('PASS 52 combinações: fundo + três instâncias idênticas, centro/cantos independentes, contain, margem interna, sem eventos nas imagens; 13 PNGs íntegros');
  await p.locator('#singlePlayerBtn').click();await p.locator('#profileContinueBtn').click();await p.locator('#startBtn').click();await p.waitForTimeout(600);
  for(const [width,height]of [[568,320],[844,390],[1024,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(250);
   const sizes=await p.evaluate(()=>{const table=document.getElementById('table'),s=getComputedStyle(table),base=parseFloat(s.getPropertyValue('--card-base-width')),w=document.getElementById('pile').offsetWidth,hand=document.querySelector('#hand .card');return{base,w,scale:+s.getPropertyValue('--card-display-scale'),ratio:hand.offsetWidth/hand.offsetHeight,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
   // Valores calc/clamp são resolvidos num elemento de referência, sem afetar o leque.
   const increase=await p.evaluate(()=>{const table=document.getElementById('table'),r=document.createElement('div');r.style='position:absolute;pointer-events:none;width:var(--card-base-width);height:0';table.append(r);const base=r.getBoundingClientRect().width,actual=parseFloat(getComputedStyle(document.getElementById('pile')).width);r.remove();return actual/base;});
   assert.ok(Math.abs(increase-(height<=340?1.02:1.05))<.002);assert.equal(sizes.overflow,false);assert.ok(Math.abs(sizes.ratio-520/850)<.02);
   await p.screenshot({path:path.join(out,'unitarios-mesa-'+width+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS aumento proporcional 5% (2% em landscape muito baixo), proporção/bordas e mesa sem rolagem em celular/tablet/desktop');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
