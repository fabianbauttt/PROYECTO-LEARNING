import { chromium } from 'playwright';
import fs from 'fs';
const POOL=JSON.parse(fs.readFileSync('eu-pool.json','utf8'));
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1200,height:900}});
const p=await ctx.newPage(); const errs=[]; const bad=[]; p.on('pageerror',e=>errs.push(e.message));
p.on('response',r=>{ if(r.status()>=400 && r.url().includes('localhost')) bad.push(r.status()+' '+r.url().split('/').pop()); });
await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=document.getElementById('grandFinaleOverlay');if(o)new MutationObserver(()=>{if(!o.classList.contains('hidden'))window.__finale=(window.__finale||0)+1}).observe(o,{attributes:true});});});
await p.route(/fonts\./,r=>r.abort()); await p.goto('http://localhost:8766/paises-europa/index.html'); await p.waitForTimeout(600);
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); };
await tap(p.locator('#startBtn')); await p.waitForTimeout(400);
const modes=['flagMode','capital','language','demonym','curiosity','demographic'];
const dismiss=async()=>{ for(let k=0;k<4;k++){ let hit=false; for(const sel of ['#continueBtn','#grandFinaleClose','.cert-btn.primary','#closeModal']){ const l=p.locator(sel+':visible'); if(await l.count()){ try{await tap(l.first()); hit=true; await p.waitForTimeout(150);}catch{} } } if(!hit) break; } };
let wrongTested={mc:false,slider:false};
for(let mi=0; mi<modes.length; mi++){
  const mode=modes[mi];
  await tap(p.locator('.mode-card').nth(mi)); await p.waitForTimeout(300);
  let solved=0, guard=0;
  while(guard++<30){
    const card=p.locator('.case-card:not([disabled])').filter({hasNot:p.locator('.stamp')}).first();
    if(!(await card.count())) break;
    const name=(await card.locator('.card-name').textContent()).trim();
    const cid=await card.getAttribute('data-country-id'); const country=POOL[name]||Object.values(POOL).find(c=>c.id===cid); const clue=country?.[mode]; if(!clue){ log('SIN DATOS para', name); break; }
    await tap(card); await p.waitForTimeout(200);
    if(mode==='demographic'){
      if(!wrongTested.slider){ await p.evaluate(m=>{const s=document.getElementById('popSlider'); s.value=m; s.dispatchEvent(new Event('input'));}, clue.max); await tap(p.locator('#confirmSliderBtn')); await p.waitForTimeout(250); log('estimación incorrecta ('+name+') → pista:', (await p.textContent('#feedbackNote')).slice(0,70)); wrongTested.slider=true; }
      await p.evaluate(t=>{const s=document.getElementById('popSlider'); s.value=t; s.dispatchEvent(new Event('input'));}, clue.targetRaw);
      await tap(p.locator('#confirmSliderBtn'));
    } else {
      if(!wrongTested.mc){ const w=clue.options.find(o=>o!==clue.correctRaw); await tap(p.locator('#optionsGrid button').filter({hasText:w}).first()); await p.waitForTimeout(250); log('respuesta incorrecta → pista:', (await p.textContent('#feedbackNote')).slice(0,70)); wrongTested.mc=true; }
      await tap(p.locator('#optionsGrid button').filter({hasText:clue.correctRaw}).first());
    }
    await p.waitForTimeout(250); await dismiss(); solved++;
  }
  log(mode.padEnd(12),'resueltos',solved,'|', (await p.textContent('#overallLabel').catch(()=>'?')));
  await tap(p.locator('#backToMenu')).catch(()=>{}); await p.waitForTimeout(250);
}
log('final mostrado:', await p.evaluate(()=>window.__finale||0), '| 404:', JSON.stringify([...new Set(bad)]), '| overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores:', JSON.stringify(errs));
await b.close();
