import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const bad=new Set();
p.on('pageerror',e=>errs.push(e.message)); p.on('response',r=>{ if(r.status()>=400) bad.add(r.status()+' '+r.url().split('/').pop()); });
p.on('dialog',d=>d.accept());
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(250); };
const vis=async s=>p.locator(s).first().isVisible().catch(()=>false);
await p.goto('http://localhost:8766/dos-mundos/index.html'); await p.waitForTimeout(600);
const DATA=await p.evaluate(()=>GAME_DATA.scenarios.map(s=>({id:s.id,title:s.title,opts:s.options.map(o=>({id:o.id,tier:o.tier})),bonus:s.bonusChallenge?s.bonusChallenge.options.map(o=>({id:o.id,correct:!!o.correct})):null})));
log('episodios:', DATA.length, '| tiers:', DATA.map(s=>s.opts.map(o=>o.tier[0]).join('')).join(' '), '| bonus con 1 correcta:', DATA.every(s=>!s.bonus||s.bonus.filter(o=>o.correct).length===1));
await tap(p.locator('#btn-start'));
let lowTried=0;
for(const [i,s] of DATA.entries()){
  // prueba opciones "low" en los dos primeros episodios
  for(const o of s.opts.filter(o=>o.tier==='low')){ if(lowTried>=4) break; await tap(p.locator(`[data-scenario="${s.id}"][data-option="${o.id}"]`)); lowTried++;
    const txt=(await p.locator('#btn-retry-scenario').textContent().catch(()=>'')).trim(); const cp=await p.getByText(p=>false).count().catch(()=>0);
    log(' ep',i+1,'opción baja → "',txt,'" | punto de control:', await p.locator('text=/Punto de control|checkpoint/i').count());
    await tap(p.locator('#btn-retry-scenario'));
    log('   opción usada deshabilitada:', await p.locator(`[data-scenario="${s.id}"][data-option="${o.id}"]`).isDisabled());
  }
  const best=s.opts.find(o=>o.tier==='high')||s.opts.find(o=>o.tier!=='low');
  await tap(p.locator(`[data-scenario="${s.id}"][data-option="${best.id}"]`));
  if(s.bonus){ await tap(p.locator(`#bonus-toggle-${s.id}`)); const w=s.bonus.find(o=>!o.correct); await tap(p.locator(`[data-bonus-scenario="${s.id}"][data-bonus-option="${w.id}"]`));
    const hintOk=await p.locator('text=Todavía no es esta').count(); const c=s.bonus.find(o=>o.correct); await tap(p.locator(`[data-bonus-scenario="${s.id}"][data-bonus-option="${c.id}"]`));
    log(' ep',i+1,s.title,'| bonus: pista tras error:', hintOk>0, '| insignia:', await p.locator('text=Insignia de alto rendimiento').count()>0); }
  if(i===2){ await p.reload(); await p.waitForTimeout(700); log(' recarga en ep 3 → sigue en la pantalla de resultado:', await vis('#btn-continue-scenario'), '| o en dilema:', await p.locator(`[data-scenario="${s.id}"]`).count()>0);
    if(!(await vis('#btn-continue-scenario'))){ await tap(p.locator(`[data-scenario="${s.id}"][data-option="${best.id}"]`)).catch(()=>{}); } }
  await tap(p.locator('#btn-continue-scenario'));
}
await p.waitForTimeout(600);
const epi=(await p.locator('body').innerText()).replace(/\s+/g,' ');
log('cierre visible:', await vis('#reflection-input'), '| texto:', epi.slice(epi.indexOf('PCH')-40, epi.indexOf('PCH')+80));
await p.fill('#reflection-input','Aprendí que hubo dos miradas.'); await p.waitForTimeout(900); log('reflexión → etiqueta:', await p.textContent('#reflection-saved').catch(()=>'?'));
await p.reload(); await p.waitForTimeout(700); log('tras recargar, reflexión conservada:', await p.inputValue('#reflection-input').catch(()=>'?'));
await tap(p.locator('#btn-restart-end')); await p.waitForTimeout(500); log('reiniciar → inicio visible:', await vis('#btn-start'));
log('404:', JSON.stringify([...bad]), '| overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
