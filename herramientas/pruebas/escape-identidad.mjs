import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(p.url().split('/').pop().split('?')[0]+': '+e.message));
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const begin=async()=>{ await p.locator('#btn-begin').waitFor({state:'visible',timeout:30000}); await p.locator('#btn-begin').click(); await p.waitForTimeout(300); };
// place card into container: desktop drag, mobile tap-cycling (k taps)
const place=async(cardId,targetSel,taps)=>{ if(mobile){ for(let i=0;i<taps;i++){ await p.locator('#'+cardId).tap(); await p.waitForTimeout(80);} } else { await p.locator('#'+cardId).dragTo(p.locator(targetSel)); await p.waitForTimeout(80);} };
const fb=async()=>(await p.textContent('#feedback')).trim().slice(0,90);
const shot=async n=>p.screenshot({path:`aic-${mobile?'m':'d'}-${n}.png`,fullPage:false});

await p.goto('http://localhost:8766/escape-identidad/index.html');
await begin();
await p.click('#btn-start'); log('index sin nombre →', await fb());
await p.fill('#agent-input','Ana, Luis'); await p.click('#btn-start'); await p.waitForURL(/level0/,{timeout:10000});
log('→', p.url().split('/').pop());

// LEVEL 0
await begin(); await shot('l0');
const key=async d=>p.click(`.key[data-digit="${d}"]`);
await key(1); await key(2); await p.click('#btn-enter'); await p.waitForTimeout(200); log('L0 código 12 →', await fb());
await p.waitForTimeout(2700);
await key(3); await key(5); await p.click('#btn-enter'); await p.waitForTimeout(200); log('L0 35 sin clasificar →', await fb());
await p.waitForTimeout(3100);
await place('card-3','#zone-a-body',1); await place('card-5','#zone-a-body',1);
await key(5); await key(3); await p.click('#btn-enter'); await p.waitForTimeout(2500);
log('L0 correcto → pantalla final visible:', await p.isVisible('#level-complete'));
await p.click('.next-tag'); await p.waitForURL(/level1/); log('→', decodeURIComponent(p.url().split('/').pop()));

// LEVEL 1
await begin(); await shot('l1');
await p.click('#btn-scan'); log('L1 vacío →', await fb());
await place('card-a','#zone-physical-body',1); await place('card-c','#zone-physical-body',1);
await place('card-b','#zone-psych-body',2); await place('card-d','#zone-psych-body',2);
await place('card-e','#zone-psych-body',2); await p.click('#btn-scan'); log('L1 con distractor →', await fb());
await place('card-e','#card-pool',1);
await p.click('#btn-scan'); await p.waitForTimeout(2500); log('L1 correcto → final visible:', await p.isVisible('#level-complete'));
await p.click('.next-tag'); await p.waitForURL(/level2/); log('→', decodeURIComponent(p.url().split('/').pop()));

// LEVEL 2
await begin(); await shot('l2');
for(let i=0;i<3;i++){ await p.click('#btn-inject'); await p.waitForTimeout(150); }
log('L2 tres fallos →', await fb(), '| botón deshabilitado:', await p.isDisabled('#btn-inject'));
await p.waitForTimeout(15500); log('L2 tras 15 s → botón habilitado:', !(await p.isDisabled('#btn-inject')));
await place('card-a','#zone-premise-1',1); await place('card-b','#zone-premise-2',1); await place('card-f','#zone-conclusion',1);
await p.click('#btn-inject'); await p.waitForTimeout(3300); log('L2 correcto → final visible:', await p.isVisible('#level-complete'));
await p.click('.next-tag'); await p.waitForURL(/level3/); log('→', decodeURIComponent(p.url().split('/').pop()));

// LEVEL 3
await begin(); await shot('l3');
await place('card-a','#zone-reid-body',1); await place('card-b','#zone-reid-body',1);
await place('card-c','#zone-hume-body',2); await place('card-d','#zone-hume-body',2);
await p.click('#btn-classify'); await p.waitForTimeout(300); log('L3 clasificación → módulo de descifrado visible:', await p.isVisible('#decode-input'));
await p.fill('#decode-input','EL YO ES ILUSION'); await p.click('#btn-decode'); log('L3 "EL YO ES ILUSION" →', await fb());
await p.fill('#decode-input','fm zp ft jmvtjpo'); await p.click('#btn-decode'); await p.waitForTimeout(3100); log('L3 "fm zp ft jmvtjpo" → final visible:', await p.isVisible('#level-complete'));
await p.click('.next-tag'); await p.waitForURL(/level4/); log('→', decodeURIComponent(p.url().split('/').pop()));

// LEVEL 4
await begin(); await shot('l4');
await p.click('#btn-lockdown'); log('L4 sin cápsula →', await fb());
await p.locator('label[for="pod-1"], #pod-1').first().click({force:true}); await p.click('#btn-lockdown'); log('L4 cápsula 1 →', await fb());
await p.locator('label[for="pod-2"], #pod-2').first().click({force:true}); await p.click('#btn-lockdown'); await p.waitForTimeout(200);
log('L4 cápsula 2 → autenticación visible:', await p.isVisible('#btn-confirm-auth'));
await p.locator('label[for="auth-2"], #auth-2').first().click({force:true}); await p.click('#btn-confirm-auth'); await p.waitForTimeout(3200);
log('L4 correcto → éxito visible:', await p.isVisible('#screen-success'), '| nombres:', await p.textContent('#certificate-names'), '|', await p.textContent('#certificate-time'));
await shot('fin');
log('overflow horizontal final:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth));
log('errores JS:', JSON.stringify(errs));
await b.close();
