import { chromium } from 'playwright';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const p=await b.newPage({viewport:{width:1200,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=document.getElementById('grandFinaleOverlay');new MutationObserver(()=>{if(!o.classList.contains('hidden'))window.__finale=(window.__finale||0)+1}).observe(o,{attributes:true});});});
await p.route(/fonts\./,r=>r.abort()); await p.goto('http://localhost:8766/paises-america/index.html'); await p.waitForTimeout(600);
await p.click('#startBtn'); await p.waitForTimeout(400);
const modes=await p.evaluate('MODES.map(m=>m.id)');
const dismiss=async()=>{ for(let k=0;k<4;k++){ let hit=false; for(const sel of ['#continueBtn','#grandFinaleClose','.cert-btn.primary','#closeModal']){ const l=p.locator(sel+':visible'); if(await l.count()){ try{await l.first().click({timeout:800}); hit=true; await p.waitForTimeout(150);}catch{} } } if(!hit) break; } };
let finale=false;
for(let mi=0; mi<modes.length; mi++){
  const mode=modes[mi];
  await p.locator('.mode-card').nth(mi).click(); await p.waitForTimeout(300);
  let solved=0, guard=0;
  while(guard++<40){
    const card=p.locator('.case-card:not([disabled])').filter({hasNot:p.locator('.stamp')}).first();
    if(!(await card.count())) break;
    const name=(await card.locator('.card-name').textContent()).trim();
    await card.click(); await p.waitForTimeout(200);
    const clue=await p.evaluate(([mode,name])=>{for(const cs of Object.values(ZONES)){const c=cs.find(c=>c.name===name); if(c) return c[mode];}},[mode,name]);
    if(mode==='demographic'){
      await p.evaluate(t=>{const s=document.getElementById('popSlider'); s.value=t; s.dispatchEvent(new Event('input'));}, clue.target);
      await p.click('#confirmSliderBtn');
    } else {
      await p.locator('#optionsGrid button').filter({hasText:clue.correct}).first().click();
    }
    await p.waitForTimeout(250);
    if(await p.locator('#grandFinaleOverlay:not(.hidden)').count()) finale=true;
    await dismiss(); solved++;
  }
  const label=await p.textContent('.overall-label, #overallLabel').catch(()=>'?');
  console.log(mode.padEnd(12),'resueltos',solved, '|', label);
  await p.click('#backToMenu').catch(()=>{}); await p.waitForTimeout(250);
}
console.log('final mostrado (veces):', await p.evaluate(()=>window.__finale||0), '| allModesComplete:', await p.evaluate('allModesComplete()'), '| errores:', errs);
await b.close();
