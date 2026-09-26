import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile'; const dup = process.argv[3]==='dup';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1366,height:768}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+(dup?'[repetidos] ':'')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(120); };
await p.goto('http://localhost:8766/el-juego-de-la-supervivencia/index.html'); await p.waitForTimeout(600);
const ids=await p.evaluate(()=>[...document.querySelectorAll('button[id]')].map(b=>b.id)); 
for(let i=0;i<10;i++) if(dup ? i<2 : i===0) await p.fill('#tribeInput'+i, dup?'Lobos':'Los Cóndores');
await tap(p.locator('#'+ids.find(i=>/start/i.test(i))));
const adv=ids.find(i=>/advance/i.test(i)), nxt=ids.find(i=>/next/i.test(i));
for(let r=0;r<7;r++){
  await p.waitForTimeout(400);
  const rows=p.locator('.tribe-row'); const n=await rows.count();
  for(let t=0;t<n;t++){ const btns=rows.nth(t).locator('.vote-btn'); await tap(btns.nth((t+r)%2)); }
  const prog=await p.textContent('.vote-progress, [id*=Progress], [id*=progress]').catch(()=>'?');
  const ready=await p.locator('#'+adv).evaluate(b=>b.classList.contains('ready'));
  if(r===0) log('filas de votación:', n, '| progreso:', (prog||'').trim(), '| botón avanzar listo:', ready);
  if(!ready){ log('⚠ BLOQUEADO en la situación', r+1); break; }
  await tap(p.locator('#'+adv)); await p.waitForTimeout(400);
  await tap(p.locator('#'+nxt));
}
await p.waitForTimeout(800);
const sb=(await p.locator('.scoreboard-row').allInnerTexts().catch(()=>[])).map(x=>x.replace(/\s+/g,' '));
if(sb.length) log('marcador:', sb.length,'filas |', sb.slice(0,3).join(' || '));
log('overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores JS:', JSON.stringify(errs));
await b.close();
