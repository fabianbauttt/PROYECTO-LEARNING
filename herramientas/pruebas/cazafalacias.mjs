import { chromium } from 'playwright';
import fs from 'fs';
// Lee los datos directamente del juego (carpeta hermana de PROYECTO-LEARNING).
const dataSrc=fs.readFileSync(new URL('../../../cazafalacias/data.js', import.meta.url),'utf8');
const { FALLACIES, PRACTICE } = await import('data:text/javascript,'+encodeURIComponent(dataSrc));
const mobile = process.argv[2]==='mobile';
const byText = new Map(PRACTICE.map(([f,t])=>[t,f]));
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const nf=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('response',r=>{if(r.status()>=400)nf.push(r.url())});
await p.route(/fonts\.g/,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); };
const ovf=async()=>p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
const tips=async()=>{ while(await p.locator('.tip-dismiss').first().isVisible().catch(()=>false)){ await tap(p.locator('.tip-dismiss').first()); await p.waitForTimeout(150);} };
await p.goto('http://localhost:8766/cazafalacias/index.html'); await p.waitForTimeout(900);
log('recorrido guiado visible:', await p.isVisible('#coachOverlay'));
if(await p.isVisible('#coachOverlay')){ for(let i=0;i<3;i++){ await tap(p.locator('#coachNext')); await p.waitForTimeout(300);} }
log('recorrido cerrado:', !(await p.isVisible('#coachOverlay')), '| overflow', await ovf());
// Catálogo
const fams=await p.locator('.family-card').count(); log('familias:',fams);
let fichas=0, quizzes=0;
for(let i=0;i<fams;i++){
  await tap(p.locator('.family-card').nth(i)); await p.waitForTimeout(400);
  const vis = p.locator('#catalog-root .card:visible, #catalog-root [class*="fallacy"]:visible');
  fichas += await p.locator('#catalog-root .card-top:visible').count();
  // mini-práctica de familia
  const fq=p.locator('.family-quiz-top:visible').first();
  if(await fq.count()){ await tap(fq); await p.waitForTimeout(300);
    for(let c=0;c<3;c++){
      const body=p.locator('.fq-body:visible').first();
      const txt=await body.locator('.statement-text').textContent();
      const fid=byText.get(txt); if(!fid){log('texto de caso de familia no encontrado:',txt.slice(0,50)); break;}
      if(c===0){ const w=body.locator('.opt-btn:not([data-fid="'+fid+'"])').first(); await tap(w); await p.waitForTimeout(200);}
      await tap(body.locator('.opt-btn[data-fid="'+fid+'"]')); await p.waitForTimeout(250);
      await tap(body.locator('.next-btn')); await p.waitForTimeout(250);
    }
    quizzes += await p.locator('.fq-done:visible').count();
  }
  log(' familia',i+1,'overflow',await ovf());
  await tap(p.locator('#familyBackBtn')); await p.waitForTimeout(300);
}
log('mini-prácticas completadas:',quizzes,'de',fams);
// Proyección
await tap(p.locator('#projBtn')); await p.waitForTimeout(300);
let n=1; while(await p.locator('#presentNext').isEnabled()){ await tap(p.locator('#presentNext')); n++; await p.waitForTimeout(80);} 
log('proyección:', await p.textContent('#presentProgress'),'| recorridos',n,'| overflow', await ovf());
await tap(p.locator('#presentClose')); await p.waitForTimeout(200);
// Práctica
await tap(p.locator('#tab-practica')); await p.waitForTimeout(300); await tips();
for(let k=0;k<36;k++){
  await tips();
  const txt=await p.textContent('#statementTextInner'); const fid=byText.get(txt);
  if(!fid){ log('caso sin respuesta conocida',k); break; }
  if(k===0){ await tap(p.locator('#optionsRoot .opt-btn:not([data-fid="'+fid+'"])').first()); await p.waitForTimeout(200); await tips();
    log('fallo 1 → pista:', (await p.textContent('#feedbackVerdict')), '| siguiente habilitado:', await p.locator('#nextBtn').isEnabled()); }
  if(k===1){ for(let j=0;j<2;j++){ await tap(p.locator('#optionsRoot .opt-btn:not([data-fid="'+fid+'"]):not([disabled])').first()); await p.waitForTimeout(200); await tips(); }
    log('fallo 2 → cierre:', await p.textContent('#feedbackVerdict'), '| correcta marcada:', await p.locator('#optionsRoot .opt-btn.correct').count());
  } else { await tap(p.locator('#optionsRoot .opt-btn[data-fid="'+fid+'"]')); await p.waitForTimeout(150); }
  await tips();
  if(k===5) log('caso 6 overflow', await ovf(), '|', await p.textContent('#progressLabel'));
  await tap(p.locator('#nextBtn')); await p.waitForTimeout(120);
}
log('diario visible:', await p.isVisible('#journalPanel'), '|', await p.textContent('#scoreLabelText'), '|', await p.textContent('#attemptsLabelText'));
log('diario:', (await p.locator('.skill-row-pct').allTextContents()).join(' / '), '| overflow', await ovf());
await tap(p.locator('#journalRestartBtn')); await p.waitForTimeout(300);
log('tras reiniciar:', await p.textContent('#progressLabel'), '|', await p.textContent('#scoreLabelText'));
await tap(p.locator('#projBtn')); await p.waitForTimeout(200); log('texto grande:', await p.evaluate(()=>document.body.classList.contains('projection')), 'overflow', await ovf());
await p.screenshot({path:'cz-'+(mobile?'m':'d')+'.png'});
log('fichas vistas:',fichas,'| 404:',JSON.stringify(nf),'| errores:',JSON.stringify(errs));
await b.close();
