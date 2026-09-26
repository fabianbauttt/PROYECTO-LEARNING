import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; const bad=new Set();
p.on('pageerror',e=>errs.push(e.message)); p.on('response',r=>{ if(r.status()>=400) bad.add(r.status()+' '+r.url().split('/').slice(-2).join('/')); });
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const vis=async s=>p.locator(s).first().isVisible().catch(()=>false);
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(120); };
const clearOverlays=async()=>{ for(let i=0;i<8;i++){ if(await vis('#t-next')){ await tap(p.locator('#t-next')); continue;} if(await vis('#hq-skip')){ await tap(p.locator('#hq-skip')); continue;} break; } };
await p.goto('http://localhost:8766/ubica-y-ubicate/index.html'); await p.waitForTimeout(1200);
await clearOverlays();
await p.evaluate(()=>{ window.__pt=(id)=>{ const it=items[id]; let t=pointOf(id);
   if(it.kind==='dep'){ const ok=q=>{const h=polyAt(q); return h && (h==='bogota'? id==='d479' : depFromPoly(h)===id);}; if(!ok(t)){ outer: for(let r=.2;r<8;r+=.2) for(let a=0;a<6.28;a+=.3){ const q={x:t.x+r*Math.cos(a),y:t.y+r*Math.sin(a)}; if(ok(q)){t=q;break outer;} } } }
   ensureVisible(t); return t; };
 window.__scr=(t)=>{ const r=wrap.getBoundingClientRect(); return {x:r.left+V.tx+(t.x/100*LW)*V.k, y:r.top+V.ty+(t.y/100*LH)*V.k}; }; });
const mapTap=async(t)=>{ const s=await p.evaluate(t=>__scr(t),t); if(mobile) await p.touchscreen.tap(s.x,s.y); else await p.mouse.click(s.x,s.y); await p.waitForTimeout(150); if(mobile && await vis('#b-confirm') && await p.locator('#b-confirm').isEnabled()) { await tap(p.locator('#b-confirm')); } };
async function chooseRoute(name){ await tap(p.locator('#routes .route',{hasText:name}).first()); }
async function playQuiz(label){
  await tap(p.locator('#go-quiz')); await p.waitForTimeout(500); await clearOverlays();
  let n=0, wrongDone=false, guard=0;
  while(guard++<200){
    if(await vis('#overlay .result')) break;
    const id=await p.evaluate(()=>G.queue[0]); if(!id){ await p.waitForTimeout(400); continue; }
    if(!wrongDone){ await mapTap({x:3,y:97}); wrongDone=true; log('  '+label,'toque fuera de lugar → aviso:', (await p.textContent('#toast')).slice(0,60)); }
    const t=await p.evaluate(id=>__pt(id),id); await p.waitForTimeout(350);
    await mapTap(t); n++;
    const still=await p.evaluate(id=>G.queue.includes(id)&&G.queue[0]===id,id);
    if(still){ log('  ⚠ no aceptó', id, await p.evaluate(id=>items[id].name,id), '| aviso:', (await p.textContent('#toast')).slice(0,70)); await p.evaluate(()=>{ if(G.queue.length>1){G.queue.push(G.queue.shift());} }); }
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(900);
  const res=(await p.locator('#overlay').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,120);
  log(label,'→ toques',n,'| resultado:',res);
  if(await vis('#r-home')) await tap(p.locator('#r-home')); else await tap(p.locator('#back'));
  await p.waitForTimeout(400); await clearOverlays();
}
for(const r of ['Caribe e insular','Andina','Pacífica','Orinoquía','Amazonía']){ await chooseRoute(r); await playQuiz(r); }
log('estrellas totales:', await p.textContent('#h-stars'), '| postales:', await p.textContent('#h-ncards'));
await chooseRoute('Gran reto'); log('gran reto → botón:', await p.textContent('#go-quiz'));
if(await p.locator('#go-quiz').isEnabled()) await playQuiz('Gran reto');
// Siluetas
await tap(p.locator('#m-shape')); await chooseRoute('Pacífica'); await tap(p.locator('#go-quiz')); await p.waitForTimeout(500); await clearOverlays();
for(let i=0;i<6 && !(await vis('#overlay .result'));i++){ const id=await p.evaluate(()=>G.sh&&!G.sh.done?G.sh.id:null); if(!id){await p.waitForTimeout(700);continue;} const name=await p.evaluate(id=>id==='d328'?'San Andrés y Prov.':items[id].name,id); await tap(p.locator('#opts .opt',{hasText:name}).first()); await p.waitForTimeout(1500); }
log('Siluetas Pacífica → resultado:', (await p.locator('#overlay').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,90));
if(await vis('#r-home')) await tap(p.locator('#r-home'));
// Vecinos
await tap(p.locator('#m-nb')); await chooseRoute('Orinoquía'); await tap(p.locator('#go-quiz')); await p.waitForTimeout(600); await clearOverlays();
for(let g=0; g<40 && !(await vis('#overlay .result')); g++){
  const st=await p.evaluate(()=>G.nb&&!G.nb.done?{t:G.nb.t,todo:(ADJ[G.nb.t]||[]).filter(n=>!G.nb.found.has(n)&&!G.nb.shown.has(n))}:null);
  if(!st||!st.todo.length){ await p.waitForTimeout(700); continue; }
  const t=await p.evaluate(id=>__pt(id),st.todo[0]); await p.waitForTimeout(350); await mapTap(t);
}
log('Vecinos Orinoquía → resultado:', (await p.locator('#overlay').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,90));
if(await vis('#r-home')) await tap(p.locator('#r-home'));
// Contrarreloj (se deja correr)
await tap(p.locator('#m-time')); await chooseRoute('Amazonía'); await tap(p.locator('#go-quiz')); await p.waitForTimeout(600); await clearOverlays();
const tEnd=Date.now()+64000; let hits=0;
while(Date.now()<tEnd && !(await vis('#overlay .result'))){ const id=await p.evaluate(()=>G.queue[0]); if(!id){await p.waitForTimeout(300);continue;} const t=await p.evaluate(id=>__pt(id),id); await p.waitForTimeout(250); await mapTap(t); hits++; }
await p.waitForTimeout(800);
log('Contrarreloj → toques',hits,'| resultado:', (await p.locator('#overlay').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,100));
log('404:', JSON.stringify([...bad]), '| overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
