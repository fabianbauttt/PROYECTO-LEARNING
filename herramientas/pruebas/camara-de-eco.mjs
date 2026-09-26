import { chromium } from 'playwright';
import fs from 'fs';
const L=JSON.parse(fs.readFileSync('ce-levels.json','utf8'));
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); };
await p.goto('http://localhost:8766/camara-de-eco/index.html'); await p.waitForTimeout(500);
if(await p.isVisible('#bootOverlay')){ await p.click('#bootOverlay'); await p.waitForTimeout(800); }
await p.fill('#nameInput','Ana'); await tap(p.locator('#startBtn')); await p.waitForTimeout(400);
for(const [li,l] of L.entries()){
  const scr=p.locator('#screen-level'+(li+1));
  for(const [ii,it] of l.items.entries()){
    const act=scr.locator('.item.active');
    await act.waitFor({timeout:5000});
    if(li===0 && ii===0){ await tap(act.locator('.opt-btn',{hasText:it.wrong}).first()); await p.waitForTimeout(300); log('respuesta incorrecta → retroalimentación:', (await act.locator('.feedback.bad').first().textContent()).slice(0,60)); }
    await tap(act.locator('.opt-btn').filter({hasText:it.correct}).first()); await p.waitForTimeout(1300);
  }
  const pad=scr.locator('.keypad');
  await pad.waitFor({timeout:5000});
  if(li===0){ for(const k of '1111') await tap(pad.locator('button',{hasText:new RegExp('^'+k+'$')})); await p.waitForTimeout(400); log(l.key,'código incorrecto → aviso:', await scr.locator('.lock-wrap .feedback.bad').isVisible()); await p.waitForTimeout(400); }
  for(const k of l.code) await tap(pad.locator('button',{hasText:new RegExp('^'+k+'$')}));
  await p.waitForTimeout(700);
  const letter=await scr.locator('.letter-badge').textContent().catch(()=>'?');
  log(l.key,'código',l.code,'→ letra revelada:', letter);
  if(li===1){ await p.reload(); await p.waitForTimeout(900);
    log('RECARGA tras abrir candado 2 → nivel2 visible:', await p.isVisible('#screen-level2'), '| candado visible:', await scr.locator('.keypad').isVisible().catch(()=>false),
        '| teclado habilitado:', await scr.locator('.keypad button').first().isEnabled().catch(()=>'-'), '| letra visible:', await scr.locator('.letter-badge').isVisible().catch(()=>false),
        '| botón continuar:', await scr.locator('button',{hasText:'YA LA ANOTÉ'}).isVisible().catch(()=>false));
    await scr.screenshot({path:'ce-reload.png'}).catch(()=>{});
    if(!(await scr.locator('button',{hasText:'YA LA ANOTÉ'}).isVisible().catch(()=>false))){ for(const k of l.code) await tap(scr.locator('.keypad button',{hasText:new RegExp('^'+k+'$')})); await p.waitForTimeout(700); log('reingresando el código → botón continuar:', await scr.locator('button',{hasText:'YA LA ANOTÉ'}).isVisible()); }
  }
  await tap(scr.locator('button',{hasText:'YA LA ANOTÉ'})); await p.waitForTimeout(600);
}
// FINAL LOCK
await p.locator('#screen-level4').waitFor({timeout:5000});
await p.fill('#final1','corto'); await tap(p.locator('#finalBtn')); await p.waitForTimeout(200); log('final con texto corto → aviso:', await p.locator('#screen-level4 .feedback, #screen-level4 [id*=Warn]').first().isVisible().catch(()=>'?'));
await p.fill('#final1','Revisar si una decisión es realmente mía'); await p.fill('#final2','Pensar qué datos comparto y con quién'); await p.fill('#final3','Verificar la fuente antes de compartir');
await p.fill('#finalKeyword','SOL'); await tap(p.locator('#finalBtn')); await p.waitForTimeout(200); log('palabra incorrecta → sigue en nivel 4:', await p.isVisible('#screen-level4'));
await p.fill('#finalKeyword','ser'); await tap(p.locator('#finalBtn')); await p.waitForTimeout(600);
log('palabra "ser" → victoria visible:', await p.isVisible('#screen-victory'), '|', (await p.locator('#screen-victory').innerText()).replace(/\s+/g,' ').slice(0,160));
await p.reload(); await p.waitForTimeout(800); log('recarga en victoria → victoria visible:', await p.isVisible('#screen-victory'));
await tap(p.locator('#resetBtn')); await p.waitForTimeout(800); if(await p.isVisible('#bootOverlay')){ await p.click('#bootOverlay'); await p.waitForTimeout(600);} log('reiniciar → pantalla inicial visible:', await p.isVisible('#screen-intro'));
log('overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores:', JSON.stringify(errs));
await b.close();
