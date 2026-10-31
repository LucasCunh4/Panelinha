const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{delete String.prototype.replaceAll;delete Element.prototype.getAnimations;delete Document.prototype.getAnimations;});
  await page.clock.install();await page.goto(process.env.PANELAS_TEST_URL||'http://127.0.0.1:8002/');
  await page.locator('#startBtn').tap();
  assert.equal(await page.locator('.seat .pan-avatar').count(),4);
  await page.evaluate(()=>{document.querySelector('#testPenalty').click();document.querySelector('#buyBtn').click();});
  await page.clock.runFor(1000);
  assert.ok(await page.evaluate(()=>CartasTest.getState().log.some(x=>/Bot [123] (jogou|comprou)/.test(x))));
  await page.evaluate(()=>{const s=CartasTest.getState();Object.assign(s,{current:0,direction:1,penalty:0,highest:0,phase:'playing',finisher:null,unlockAt:0,drawn:null,activeColor:'blue',token:s.token+1});s.players[0].hand=[{id:94000,type:'reverse',color:'blue',num:null},{id:94001,type:'num',color:'red',num:7}];document.querySelector('#useCardArt').onchange();});
  await page.locator('[data-card="94000"]').tap();
  assert.equal(await page.locator('#directionGlyph').innerText(),'↻');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.getElementById('directionGlyph').getAnimations().length===0);
  assert.deepEqual(errors,[]);
  console.log('PASS WebView antigo simulado: mesa completa, bot automático e Inverter sem replaceAll/getAnimations nativos');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
