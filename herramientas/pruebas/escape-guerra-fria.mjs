import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
let answers=[]; const alerts=[];
p.on('dialog',async d=>{ if(d.type()==='prompt'){ await d.accept(answers.shift()??''); } else { alerts.push(d.message().replace(/\s+/g,' ').slice(0,70)); await d.accept(); } });
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(250); };
await p.goto('http://localhost:8766/escape-guerra-fria/index.html'); await p.waitForTimeout(400);
await tap(p.locator('button',{hasText:'INICIAR MISIÓN'}));
await tap(p.locator('#nb-m3')); log('M3 bloqueada →', alerts.pop());
await tap(p.locator('button',{hasText:'ABRIR SOBRE 1'}));
const plan=[[1,['121','122']],[2,['cosmos']],[3,['M.L.P.L']],[4,['892 891']]];
for(const [n,tries] of plan){ for(const t of tries){ answers=[t]; await tap(p.locator(`#m${n} button`,{hasText:/VERIFICAR|ACTIVAR/})); log('M'+n,'"'+t+'" →', alerts.pop()); } }
log('victoria visible:', await p.isVisible('#victoria'), '| nav M4 desbloqueada:', !(await p.locator('#nb-m4').textContent()).includes('🔒'));
log('desbordamiento:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
