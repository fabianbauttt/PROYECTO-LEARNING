import { chromium } from 'playwright';
import fs from 'fs';
const R=JSON.parse(fs.readFileSync('lab.json','utf8'));
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const bad=new Set();
p.on('pageerror',e=>errs.push(e.message)); p.on('response',r=>{ if(r.status()>=400 && r.url().includes('localhost')) bad.add(r.url().split('/').slice(-2).join('/')); });
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(120); };
const vis=async sel=>p.locator(sel).first().isVisible().catch(()=>false);
await p.goto('http://localhost:8766/laboratorio-creadores-digitales/index.html'); await p.waitForTimeout(600);
await tap(p.locator('#onboarding-start')); log('registro vacío → sigue abierto:', await vis('#onboarding-overlay.is-open'));
await p.fill('#onboarding-name','Ana Prueba'); await p.fill('#onboarding-username','anaprueba'); await tap(p.locator('#onboarding-start')); await p.waitForTimeout(700);
const tested={text:0,cal:0,audio:0,order:0};
log('estado tras registro:', JSON.stringify(await p.evaluate(()=>({overlay:document.getElementById('onboarding-overlay').className, inert:[...document.querySelectorAll('[inert]')].map(e=>e.id), links:[...document.querySelectorAll('.card-link')].map(b=>b.disabled)}))));
for(const [pi,ph] of R.entries()){
  const link=p.locator('.card-link').nth(pi);
  log('Fase',ph.id,'→ botón contenido (DOM) habilitado:', !(await link.evaluate(b=>b.disabled)));
  await link.scrollIntoViewIfNeeded(); log('  Playwright lo ve habilitado:', await link.isEnabled()); await tap(link); await p.waitForTimeout(400);
  for(const [mi,m] of ph.modules.entries()){
    await tap(p.locator(`.drawer-tab[data-module-index="${mi}"]`)); await p.waitForTimeout(200);
    let guard=0; while(await vis('#theory-continue-btn') && guard++<20) await tap(p.locator('#theory-continue-btn'));
    const type = m.text?'text':m.cal?'cal':m.audio?'audio':m.order?'order':null;
    if(!type){ log('  mód',mi,m.tab,'(solo teoría) → sin reto'); continue; }
    if(await vis('#module-task-start')) await tap(p.locator('#module-task-start'));
    const tasks=m[type];
    for(const [ti,t] of tasks.entries()){
      if(type==='text'||type==='audio'){
        if(!tested[type]){ const w=[0,1,2,3].find(i=>i!==t.correctIndex && i<t.options.length); await tap(p.locator(`.quiz-option[data-index="${w}"]`)); log('  incorrecta ('+type+') →', ((await p.locator('.quiz-feedback').first().textContent())||'').slice(0,50)); tested[type]=1; }
        if(type==='audio'){ const src=await p.locator('audio').first().getAttribute('src').catch(()=>null); if(ti===0) log('  audio del reto:', src); }
        await tap(p.locator(`.quiz-option[data-index="${t.correctIndex}"]`));
      } else if(type==='cal'){
        const set=async v=>p.evaluate(v=>{const s=document.getElementById('calibration-slider'); s.value=v; s.dispatchEvent(new Event('input',{bubbles:true})); s.dispatchEvent(new Event('change',{bubbles:true}));},v);
        if(!tested.cal){ await set(t.minRange); await tap(p.locator('#calibration-confirm')); log('  calibración fuera de rango →', ((await p.locator('.quiz-feedback').first().textContent())||'').slice(0,50)); tested.cal=1; }
        await set(Math.round((t.sweetSpot[0]+t.sweetSpot[1])/2)); await tap(p.locator('#calibration-confirm'));
      } else if(type==='order'){
        if(!tested.order){ await tap(p.locator('#order-confirm')); const fb=((await p.locator('.quiz-feedback').first().textContent())||''); log('  orden inicial sin tocar →', fb.slice(0,50)); tested.order=1; }
        for(let i=0;i<t.correctOrder.length;i++){
          for(let k=0;k<10;k++){ const vals=await p.$$eval('#order-list .timeline-clip',cs=>cs.map(c=>c.dataset.value)); const pos=vals.indexOf(t.correctOrder[i]); if(pos<=i) break; await tap(p.locator('#order-list .timeline-clip').nth(pos).locator('.order-btn[data-dir="left"]')); }
        }
        await tap(p.locator('#order-confirm'));
      }
      await p.waitForTimeout(250);
      const next=p.locator('.quiz-next:visible').filter({hasText:'Siguiente Reto'});
      if(ti<tasks.length-1){ if(await next.count()) await tap(next.first()); else { log('  ⚠ no apareció "Siguiente Reto" tras reto',ti+1,'de',m.tab); break; } }
    }
    await p.waitForTimeout(300);
    log('  mód',mi,m.tab,type,'x'+tasks.length,'→ superado:', await vis('.quiz-passed') || await p.locator('.drawer-tab[data-module-index="'+mi+'"] .tab-check').count()>0);
  }
  if(await vis('#victory-overlay.is-open')) break;
  if(await vis('#drawer-close')) await tap(p.locator('#drawer-close'));
  await p.waitForTimeout(300);
}
log('victoria visible:', await vis('#victory-overlay.is-open'), '| nombre:', await p.textContent('#victory-name').catch(()=>'?'));
await p.screenshot({path:'lab-'+(mobile?'m':'d')+'-fin.png'});
log('archivos que faltan:', JSON.stringify([...bad]), '| overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores:', JSON.stringify(errs));
await b.close();
