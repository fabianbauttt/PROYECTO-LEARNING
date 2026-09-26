import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(150); };
const fb=async id=>((await p.textContent('#'+id))||'').replace(/\s+/g,' ').trim().slice(0,75);
await p.goto('http://localhost:8766/laboratoriobioetico/index.html'); await p.waitForTimeout(400);
await tap(p.locator('button[onclick="startGame()"]'));
await tap(p.locator('#btn-check-r1')); log('S1 sin clasificar →', await fb('feedback-r1'));
const ans=['fact','value','fact','value','fact','value','fact'];
for(let i=0;i<7;i++){ const c = i===1?'fact':ans[i]; await tap(p.locator(`.phrase-btn.${c}[onclick*="selectPhrase(${i},"]`)); }
await tap(p.locator('#btn-check-r1')); log('S1 con un error →', await fb('feedback-r1'), '| marcados en rojo:', await p.locator('.phrase-item.wrong').count());
await tap(p.locator(`.phrase-btn.value[onclick*="selectPhrase(1,"]`)); await tap(p.locator('#btn-check-r1')); log('S1 correcta → código visible:', await p.isVisible('#code-r1'));
await tap(p.locator('#btn-advance-r1'));
await tap(p.locator('#btn-check-r2')); log('S2 sin opción →', await fb('feedback-r2'));
await tap(p.locator('#options-r2 .option-item').nth(0)); await tap(p.locator('#btn-check-r2')); log('S2 opción A → sección de error visible:', await p.isVisible('#wrong-code-section'));
await tap(p.locator('#options-r2 .option-item').nth(1)); await tap(p.locator('#btn-check-r2')); log('S2 opción B → cifrado visible:', await p.isVisible('#cipher-section-r2'));
await p.fill('#cipher-answer-r2','CRISPA'); await tap(p.locator('button',{hasText:'DESCIFRAR'})); log('S2 "CRISPA" →', await fb('feedback-r2'));
await p.fill('#cipher-answer-r2','crispr'); await tap(p.locator('button',{hasText:'DESCIFRAR'})); log('S2 "crispr" →', await fb('feedback-r2'), '| botón:', (await p.textContent('#btn-advance-r2')).trim());
await tap(p.locator('#btn-advance-r2'));
await tap(p.locator('#args-r3 .argument-item').nth(3)); await tap(p.locator('#btn-check-r3')); log('S3 argumento D →', await fb('feedback-r3'));
await tap(p.locator('#args-r3 .argument-item').nth(1)); await tap(p.locator('#btn-check-r3')); log('S3 argumento B → candado visible:', await p.isVisible('#keyword-answer-r3'));
for(const w of ['Helsinki','Nuremberg','NÜRNBERG','Código de Núremberg','núremberg']){
  await p.fill('#keyword-answer-r3',w); const ok=await p.evaluate(()=>{ const i=document.getElementById('keyword-answer-r3'); const n=i.value.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z]/g,'').replace(/^CODIGO(DE)?/,''); return n==='NUREMBERG'||n==='NURNBERG'; });
  log('S3 palabra "'+w+'" → se aceptaría:', ok);
}
await p.fill('#keyword-answer-r3','Nuremberg'); await tap(p.locator('button',{hasText:'ACTIVAR ESCAPE'})); await p.waitForTimeout(1800);
log('"Nuremberg" → pantalla final:', await p.isVisible('#screen-success'), '| tiempo:', await p.textContent('#final-time'));
await tap(p.locator('button[onclick="restartGame()"]')); log('reiniciar → sala 1:', await p.isVisible('#screen-room1'), '| clasificaciones limpias:', await p.locator('.phrase-btn.selected').count()===0);
log('desbordamiento:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
