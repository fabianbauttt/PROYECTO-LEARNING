import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const bad=[];
p.on('pageerror',e=>errs.push(p.url().split('/').pop()+': '+e.message));
p.on('response',r=>{ if(r.status()>=400 && r.url().includes('localhost')) bad.push(r.status()+' '+r.url().split('/').pop()); });
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const BASE='http://localhost:8766/conflicto-armado/';
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); };
const hub=async()=>{ await p.goto(BASE+'index.html'); await p.waitForTimeout(400); if(await p.isVisible('#enterHubBtn')) { await p.click('#enterHubBtn'); await p.waitForTimeout(900);} 
  return p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('archivoCentralMemoria.hubState')||'{}'); return {unlocked:(s.unlocked||[]).length, completed:(s.completed||[]).join(','), nodosActivos:[...document.querySelectorAll('.node')].filter(n=>!n.disabled && !n.classList.contains('node--fogged')).map(n=>n.dataset.id).join(',')};}); };
log('hub inicial', JSON.stringify(await hub()));
const done=async()=>p.evaluate(()=>!!document.querySelector('.completion-banner.show, #completionBanner.show'));
async function playMatch(file){
  await p.goto(BASE+file); await p.waitForTimeout(500);
  let wrongTested=false, guard=0;
  while(!(await done()) && guard++<80){
    if(await p.isVisible('#noteClose')){ await tap(p.locator('#noteClose')); continue; }
    if(await p.locator('#dossierBackdrop.open').count()){ await tap(p.locator('#dossierClose')); await p.waitForTimeout(300); continue; }
    if(await p.isVisible('#continueModuleBtn')){ await tap(p.locator('#continueModuleBtn')); await p.waitForTimeout(400); continue; }
    const piece=p.locator('.piece:not(.matched)').first();
    if(!(await piece.count())){ await p.waitForTimeout(400); continue; }
    const nid=await piece.getAttribute('data-node-id'), typ=await piece.getAttribute('data-type');
    if(!wrongTested){ const wz=p.locator(`.dropzone:not(.filled):not([data-node-id="${nid}"][data-type="${typ}"])`).first();
      if(await wz.count()){ await tap(piece); await tap(wz); await p.waitForTimeout(300); log(file,'colocación incorrecta → pista visible:', await p.isVisible('#noteClose')); wrongTested=true; continue; } }
    await tap(piece); await tap(p.locator(`.dropzone[data-node-id="${nid}"][data-type="${typ}"]`)); await p.waitForTimeout(250);
  }
  log(file,'completada:', await done(), '(pasos', guard+')');
}
async function playDecision(file){
  await p.goto(BASE+file); await p.waitForTimeout(500);
  let wrongTested=false, guard=0;
  while(!(await done()) && guard++<60){
    if(await p.isVisible('#noteClose')){ await tap(p.locator('#noteClose')); continue; }
    if(await p.locator('#dossierBackdrop.open').count()){ await tap(p.locator('#dossierClose')); await p.waitForTimeout(300); continue; }
    if(await p.isVisible('#continueModuleBtn')){ await tap(p.locator('#continueModuleBtn')); await p.waitForTimeout(400); continue; }
    if(!wrongTested && await p.locator('.decision-option[data-correct="false"]').count()){ await tap(p.locator('.decision-option[data-correct="false"]').first()); await p.waitForTimeout(300); log(file,'opción incorrecta → nota visible:', await p.isVisible('#noteClose')); wrongTested=true; continue; }
    const ok=p.locator('.decision-option[data-correct="true"]:not([disabled])');
    if(await ok.count() && await ok.first().isEnabled()){ await tap(ok.first()); await p.waitForTimeout(500); continue; }
    const next=p.locator('button:visible').filter({hasText:/Siguiente|Continuar|Avanzar/});
    if(await next.count()){ await tap(next.first()); await p.waitForTimeout(400); continue; }
    await p.waitForTimeout(400);
  }
  log(file,'completada:', await done(), '(pasos', guard+')');
}
await playMatch('core-1.html'); log('hub tras Fase 1', JSON.stringify(await hub()));
// probar un nodo de misión desbloqueado
const m=p.locator('.node[data-id="m1a"]'); log('misión m1a → habilitada:', await m.isEnabled(), '| clases:', (await m.getAttribute('class')), '| etiqueta:', await m.locator('.node__badge').textContent()); await m.click({force:true}).catch(()=>{}); await p.waitForTimeout(600); log('tras tocarla, URL:', p.url().split('/').pop());
await p.screenshot({path:'aca-hub-soon.png'});
await playMatch('core-2.html'); log('hub tras Fase 2', JSON.stringify(await hub()));
await playDecision('core-3.html'); log('hub tras Fase 3', JSON.stringify(await hub()));
await playDecision('core-4.html'); log('hub tras Fase 4', JSON.stringify(await hub()));
await p.goto(BASE+'core-5.html'); await p.waitForTimeout(600);
await p.fill('#passwordInput','clave falsa'); await tap(p.locator('#validateBtn')); await p.waitForTimeout(400); log('Fase 5 clave falsa → nota:', await p.isVisible('#noteClose'));
if(await p.isVisible('#noteClose')) await tap(p.locator('#noteClose'));
await p.fill('#passwordInput','memoria viva'); await tap(p.locator('#validateBtn')); await p.waitForTimeout(1500);
log('Fase 5 "memoria viva" → botón volver visible:', await p.isVisible('#returnHubBtn'));
const h=await hub(); log('hub final', JSON.stringify(h), '| banner final visible:', await p.isVisible('#completionBanner.show')); await p.screenshot({path:'aca-final.png'}); await p.click('#closeCompletionBtn'); await p.waitForTimeout(300); log('banner cerrado:', !(await p.isVisible('#completionBanner.show')));
log('overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| 404:', JSON.stringify(bad), '| errores:', JSON.stringify(errs));
await b.close();
