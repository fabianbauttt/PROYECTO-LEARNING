import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
await p.clock.install();
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(60); };
const wait=async ms=>{ await p.clock.runFor(ms); await p.waitForTimeout(40); };
await p.goto('http://localhost:8766/tablasdel1al5/index.html'); await p.waitForTimeout(400);
async function pick(levelIdx){
  if(await p.isVisible('#btn-goto-pet-select')) await tap(p.locator('#btn-goto-pet-select'));
  if(await p.isVisible('.pet-card')) { await tap(p.locator('.pet-card').nth(levelIdx)); await tap(p.locator('#btn-goto-level-select')); }
  await tap(p.locator('.level-card').nth(levelIdx)); await tap(p.locator('#btn-start-game')); await wait(300);
}
const ready=async()=>{ for(let i=0;i<40;i++){ if(await p.isVisible('#screen-win')) return; if(await p.locator('.opt-btn:not([disabled])').count()) return; await wait(200);} };
const fb=async()=>((await p.textContent('#feedback-msg'))||'').trim();
const fbv=async()=>((await p.textContent('#feedback-msg-vertical'))||'').trim();
// NIVEL 1
await pick(0);
let q=async()=>[Number(await p.textContent('#q-a')), Number(await p.textContent('#q-b'))];
let [a,bb]=await q(); const wrongBtn=()=>p.locator('.opt-btn:not([disabled])').filter({hasNotText:new RegExp('^'+(a*bb)+'$')}).first();
await tap(wrongBtn()); log('N1 1er fallo →', await fb(), '| pista:', await p.isVisible('#hint-section .hint-group'));
await wait(900); let [a2,b2]=await q(); log('   misma pregunta:', a2===a&&b2===bb, '| opciones habilitadas:', await p.locator('.opt-btn:not([disabled])').count(), '| reloj:', await p.textContent('#timer-text'));
await tap(wrongBtn()); log('N1 2º fallo →', await fb(), '| pista visible:', await p.isVisible('#hint-section .hint-group'), '| grupos:', await p.locator('#hint-section .hint-group').count(), '(=', a, ')');
await wait(3600); [a,bb]=await q(); log('   pasa a otra pregunta, pista oculta:', !(await p.isVisible('#hint-section .hint-group')));
await wait(26000); log('N1 1er tiempo agotado →', await fb(), '| misma pregunta:', JSON.stringify(await q())===JSON.stringify([a,bb]));
await wait(900); log('   reloj reiniciado:', await p.textContent('#timer-text'));
await wait(26000); log('N1 2º tiempo agotado →', await fb(), '| pista visible:', await p.isVisible('#hint-section .hint-group'));
await wait(3600); [a,bb]=await q();
await tap(wrongBtn()); await wait(900); await tap(p.locator('.opt-btn').filter({hasText:new RegExp('^'+(a*bb)+'$')}).first()); log('N1 fallo y luego acierto →', await fb());
await wait(1200);
let n1=0; while(!(await p.isVisible('#screen-win')) && n1<15){ await ready(); if(await p.isVisible('#screen-win')) break; [a,bb]=await q(); const btn=p.locator('.opt-btn').filter({hasText:new RegExp('^'+(a*bb)+'$')}); if(!(await btn.count())){ log('⚠ sin opción correcta para',a,'×',bb); break;} await tap(btn.first()); await wait(1000); n1++; }
log('N1 → victoria:', await p.isVisible('#screen-win'), 'tras', n1, 'aciertos | puntaje:', await p.textContent('#win-score'), '|', (await p.textContent('#win-best')).trim(), '| botón siguiente nivel:', await p.isVisible('#btn-next-level'));
// NIVEL 2 (vertical)
if(await p.isVisible('#btn-next-level')) await tap(p.locator('#btn-next-level')); else { await tap(p.locator('#btn-home')); await pick(1); }
await wait(300);
const readV=async()=>p.$$eval('#vgrid-grid .vg-digit',ds=>ds.map(d=>d.textContent));
const factors=async()=>{ const d=await readV(); const h=d.length/2; return [Number(d.slice(0,h).join('')), Number(d.slice(h).join(''))]; };
const fill=async(str)=>{ const ins=p.locator('.vg-answer-input'); const n=await ins.count(); for(let i=0;i<n;i++){ await ins.nth(i).fill(str[i]||''); } await tap(p.locator('#btn-verify-vertical')); };
let [x,y]=await factors(); let prod=String(x*y);
// llevada olvidada: sumar sin llevadas
const noCarry=(()=>{ const ad=String(x).split('').reverse().map(Number), bd=String(y).split('').reverse().map(Number); let s=''; for(let pl=0;pl<prod.length;pl++){ let r=0; for(let j=0;j<=pl;j++) r+=(ad[j]||0)*(bd[pl-j]||0); s=(r%10)+s; } return s; })();
log('N2', x,'×',y,'=',prod,'| sin llevadas daría', noCarry);
if(noCarry!==prod){ await fill(noCarry); log('N2 llevada olvidada →', await fbv(), '| casilla de llevada resaltada:', await p.locator('.carry-highlight').count()); }
await fill('0'.repeat(prod.length)); log('N2 todo mal →', await fbv());
let n2=0; while(!(await p.isVisible('#screen-win')) && n2<12){ for(let i=0;i<30 && !(await p.isVisible('#screen-win')) && !(await p.locator('.vg-answer-input:not([disabled])').count());i++) await wait(200); if(await p.isVisible('#screen-win')) break; [x,y]=await factors(); await fill(String(x*y)); await wait(1000); n2++; }
log('N2 → victoria:', await p.isVisible('#screen-win'), 'tras', n2, '| siguiente nivel:', await p.isVisible('#btn-next-level'));
// NIVEL 3
if(await p.isVisible('#btn-next-level')) await tap(p.locator('#btn-next-level')); else { await tap(p.locator('#btn-home')); await pick(2); }
await wait(300);
let n3=0; while(!(await p.isVisible('#screen-win')) && n3<10){ await ready(); if(await p.isVisible('#screen-win')) break; [a,bb]=await q(); const btn=p.locator('.opt-btn').filter({hasText:new RegExp('^'+(a*bb)+'$')}); if(!(await btn.count())){ log('⚠ sin opción correcta',a,bb); break;} await tap(btn.first()); await wait(1000); n3++; }
log('N3 → victoria:', await p.isVisible('#screen-win'), 'tras', n3, '| siguiente nivel visible:', await p.isVisible('#btn-next-level'));
log('mejores puntajes guardados:', await p.evaluate(()=>localStorage.getItem('tcmBestScores')));
log('desbordamiento:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
