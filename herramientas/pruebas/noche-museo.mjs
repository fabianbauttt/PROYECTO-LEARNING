import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(250); };
const beats=async()=>{ for(let i=0;i<8;i++){ const bt=p.locator('#beatContinueBtn'); if(!(await bt.count())) return; await p.waitForTimeout(350); await tap(bt); await p.waitForTimeout(700);} };
const opt=async(container,value)=>{ await beats(); await tap(p.locator(`#${container} .option-btn[data-value="${value}"]`)); await p.waitForTimeout(300); };
const h1=async()=>((await p.textContent('h1').catch(()=>''))||'').trim();
await p.goto('http://localhost:8766/noche-museo/index.html'); await p.waitForTimeout(400);
async function play(path){
  await tap(p.locator('#switchBtn')); await p.waitForTimeout(500);
  await beats(); if(await p.locator('#startBtn').count()) await tap(p.locator('#startBtn'));
  await beats(); await tap(p.locator('[data-pick="'+path.art+'"]')); await opt('reasonOptions', path.rArt);
  await beats(); await tap(p.locator('[data-pick="'+path.food+'"]')); await opt('reasonOptions', path.rFood);
  await opt('universalOptions', path.univ); await opt('pressureOptions', path.pres);
  await beats();
  const t=await p.locator('.tension-block .t-label').allInnerTexts();
  log(path.name,'→ estación de coherencia:', t.length? t.join(' | ') : (await p.textContent('#tensionContent')).trim().slice(0,60), '| confianza:', await p.evaluate(()=>state.confidence));
  if(path.revise){ await tap(p.locator(`[data-revise="${path.revise[0]}"]`).first()); await opt(path.revise[1], path.revise[2]); await beats();
    const t2=await p.locator('.tension-block .t-label').allInnerTexts(); log('   tras revisar', path.revise[0], '→', t2.length? t2.join(' | '):'sin tensiones', '| confianza:', await p.evaluate(()=>state.confidence), '| pantalla:', await p.evaluate(()=>state.screen)); }
  await tap(p.locator('#tensionContinueBtn'));
  await p.fill('#justifyText', path.just); await tap(p.locator('#verdictBtn')); await beats();
  const prof=(await p.textContent('.profile-name').catch(()=>'¿?')).trim();
  const sum=(await p.locator('.summary-grid').innerText().catch(()=>'')).replace(/\s+/g,' ');
  log('   veredicto → perfil:', prof, '| justificación en el resumen:', sum.includes(path.just||'(no escribió'), '| preguntas de debate:', await p.locator('.debate-block p').count());
  await tap(p.locator('#restartBtn')); await p.waitForTimeout(400); log('   volver a empezar → interruptor:', await p.isVisible('#switchBtn'));
}
await play({name:'Recorrido 1', art:'sneakers', rArt:'objetiva', food:'cake', rFood:'siento', univ:'universal', pres:'presion', revise:['reasonFood','reasonOptions','objetiva'], just:'El gusto se educa.'});
await play({name:'Recorrido 2', art:'painting', rArt:'inseguro', food:'sphere', rFood:'siento', univ:'inseguro', pres:'firme', just:''});
log('desbordamiento:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
