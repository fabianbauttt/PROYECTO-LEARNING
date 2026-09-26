import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const order = (process.argv[3]||'medicalFile,diaries,ship').split(',');
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\.|cdn\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(350); };
await p.goto('http://localhost:8766/habitacion-del-amnesico/index.html'); await p.waitForTimeout(500);
await tap(p.locator('#lightbulbBtn')); await p.waitForTimeout(500); await tap(p.locator('#startBtn'));
await tap(p.locator('#doorBtn')); log('puerta sin examinar →', ((await p.textContent('#doorMsg').catch(()=>''))||'').trim().slice(0,70));
for(const [i,id] of order.entries()){
  await tap(p.locator(`[data-obj="${id}"]`));
  const closeVisible=await p.isVisible('#closeModalBtn');
  await tap(p.locator('#revealParadoxBtn'));
  const luc=await p.evaluate(()=>state.lucidity);
  log(id,'→ se podía cerrar antes de la paradoja:', closeVisible, '| lucidez:', luc);
  if(i===1){ await p.reload(); await p.waitForTimeout(600); log('   recarga con el expediente abierto → sigue abierto:', await p.isVisible('#closeModalBtn')); }
  await tap(p.locator('#closeModalBtn'));
  if(i===0){ await tap(p.locator(`[data-obj="${id}"]`)); await tap(p.locator('#revealParadoxBtn')); log('   reexaminar no baja más la lucidez:', await p.evaluate(()=>state.lucidity)===luc); await tap(p.locator('#closeModalBtn')); }
}
log('desbordamiento en la habitación:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
await tap(p.locator('#doorBtn')); await p.waitForTimeout(500);
const t=(await p.locator('#app').innerText()).replace(/\s+/g,' ');
log('epílogo → primer objeto:', (t.match(/Examinaste primero: ([^.]*)/)||[])[1], '| reflexión:', !!(t.split('Examinaste primero')[1]||'').trim());
await p.reload(); await p.waitForTimeout(500); log('recarga en el epílogo → sigue ahí:', await p.isVisible('#restartBtn'));
await tap(p.locator('#restartBtn')); log('reiniciar → bombilla visible:', await p.isVisible('#lightbulbBtn'));
log('desbordamiento:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
