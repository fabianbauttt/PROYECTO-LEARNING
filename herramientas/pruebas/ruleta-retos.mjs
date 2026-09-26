import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const nf=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('response',r=>{if(r.status()>=400)nf.push(r.url())});
await p.route(/fonts\.g/,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
await p.goto('http://localhost:8766/ruleta-retos/index.html'); await p.waitForTimeout(600);
const geo=await p.evaluate(()=>{const w=document.getElementById('wheelDisc').getBoundingClientRect();const s=document.getElementById('spinBtn').getBoundingClientRect();return {w:[w.x,w.y,w.width,w.height].map(Math.round),inView:w.bottom<=innerHeight, btn:Math.round(s.width), ovf:document.documentElement.scrollWidth-innerWidth};});
log('rueda',JSON.stringify(geo), '| segmentos', await p.locator('#wheelDisc path').count());
let ok=0, bad=[], seen=new Set();
for(let i=0;i<15;i++){
  if(mobile) await p.tap('#spinBtn'); else await p.click('#spinBtn');
  await p.waitForSelector('#modalOverlay.open',{timeout:9000});
  const r=await p.evaluate(()=>{const w=document.getElementById('wheelDisc').getBoundingClientRect();
    const x=w.x+w.width/2, y=w.y; let best=null,bd=1e9;
    document.querySelectorAll('#wheelDisc .segment-icon').forEach(e=>{const r=e.getBoundingClientRect();const d=Math.hypot(r.x+r.width/2-x,r.y+r.height/2-y); if(d<bd){bd=d;best=e;}});
    return {icon:best.textContent, dist:Math.round(bd), modalIcon:document.getElementById('modalIcon').textContent, title:document.getElementById('modalTitle').textContent};});
  seen.add(r.title);
  if(r.icon===r.modalIcon) ok++; else bad.push(JSON.stringify(r));
  await p.waitForTimeout(200);
  if(i%3==0) await p.click('#modalOk'); else if(i%3==1) await p.keyboard.press('Escape'); else await p.mouse.click(5,5);
  await p.waitForTimeout(250);
  if(await p.locator('#modalOverlay.open').count()) log('modal no cerró en ronda',i);
}
log('coincidencias puntero↔modal:',ok,'de 15', bad.length?'| fallos '+bad.join(' '):'');
// Tab detrás del modal
if(mobile) await p.tap('#spinBtn'); else await p.click('#spinBtn');
await p.waitForSelector('#modalOverlay.open',{timeout:9000}); await p.waitForTimeout(150);
const foc=[]; for(let i=0;i<4;i++){ await p.keyboard.press('Tab'); foc.push(await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName)); }
log('foco con Tab dentro del modal:',foc.join(' → '));
await p.screenshot({path:'rr-'+(mobile?'m':'d')+'.png'});
log('404:',JSON.stringify(nf),'| errores:',JSON.stringify(errs));
await b.close();
