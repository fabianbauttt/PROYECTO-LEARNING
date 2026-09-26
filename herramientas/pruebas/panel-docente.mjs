import { chromium } from 'playwright';
const [,,game,intro,startSel]=process.argv;
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
for(const m of [false,true]){
const p=await (await b.newContext(m?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\.g/,r=>r.abort());
const L=(...a)=>console.log((m?'[móvil] ':'[pc] ')+a.join(' '));
await p.goto(`http://localhost:8766/${game}/index.html`); L('botón a los 50 ms:', await p.locator('#panel-docente .pd-open').isVisible().catch(()=>'-')); await p.waitForTimeout(1500);
const btn=p.locator('#panel-docente .pd-open');
L('botón en inicio:', await btn.isVisible());
await btn.click(); await p.locator('#panel-docente input').fill(process.argv[5]||'0000'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
L('clave antigua →', await p.locator('#panel-docente .pd-err').textContent());
await p.locator('#panel-docente input').fill(process.env.PANEL_CLAVE||''); await p.keyboard.press('Enter'); await p.waitForTimeout(1800);
L('clave nueva →', await p.locator('#panel-docente .pd-title').textContent(), '|', (await p.locator('#panel-docente .pd-tab').allTextContents()).join(' · '));
let ov=0; for(let i=0;i<6;i++){ await p.locator('#panel-docente .pd-tab').nth(i).click(); ov=Math.max(ov, await p.evaluate(()=>{const r=document.querySelector('#panel-docente').shadowRoot.querySelector('.pd-box'); return r.scrollWidth-r.clientWidth;})); }
L('desborde máx en pestañas:', ov);
await p.keyboard.press('Escape');
if(startSel){ await p.click(startSel); await p.waitForTimeout(1200); L('botón tras iniciar el juego:', await btn.isVisible()); }
L('errores:', JSON.stringify(errs));
}
await b.close();
