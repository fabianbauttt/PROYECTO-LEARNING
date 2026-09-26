import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(80); };
const txt=async sel=>((await p.locator(sel).first().textContent().catch(()=>''))||'').trim().slice(0,80);
await p.goto('http://localhost:8766/escape-descartes/index.html'); await p.waitForTimeout(500);
await tap(p.locator('button[onclick="startGame()"]'));
// M1
await tap(p.locator('#a0f')); for(const i of [1,2]) await tap(p.locator('#a'+i+'p')); await tap(p.locator('#a3f'));
log('M1 con error →', await txt('#m1-hint'), '| botón extraer visible:', await p.isVisible('#btn-extract'));
await tap(p.locator('#a0p')); log('M1 correcta →', await txt('#m1-hint'));
await tap(p.locator('#btn-extract')); await p.waitForTimeout(800); log('M2 visible:', await p.isVisible('#m2'));
// M2
const OK=['sueno','ambos','ambos','ambos','sueno','ambos','sueno','ambos'];
const lis=p.locator('#m2 li');
for(let i=0;i<8;i++){ const clicks = i===0 ? 2 : (OK[i]==='sueno'?1:2); for(let k=0;k<clicks;k++) await tap(lis.nth(i)); }
log('M2 con error →', await txt('#m2-hint'));
await tap(lis.nth(0)); await tap(lis.nth(0)); // ambos -> null -> sueno
log('M2 correcta → transmisión visible:', await p.isVisible('#m2-genio'));
await tap(p.locator('#m2-genio button')); await p.waitForTimeout(600); log('M3 visible:', await p.isVisible('#m3'));
// M3
await tap(p.locator('#m3 button',{hasText:'VERIFICAR'})); log('M3 vacío →', await txt('#m3-err'));
for(const [q,a] of [[0,'v'],[1,'v'],[2,'v'],[3,'v']]) await tap(p.locator('#l'+q+a));
await tap(p.locator('#m3 button',{hasText:'VERIFICAR'})); log('M3 con error →', await txt('#m3-err'));
await tap(p.locator('#l1i')); await tap(p.locator('#m3 button',{hasText:'VERIFICAR'})); await p.waitForTimeout(1000); log('M4 visible:', await p.isVisible('#m4'));
// M4
log('M4 inicial →', await txt('#m4-hint'));
for(const l of ['A','B','D']) await tap(p.locator('#c'+l)); log('M4 A+B+D →', await txt('#m4-hint'), '| código visible:', await p.isVisible('#num-block'));
for(const l of ['B','D']) await tap(p.locator('#c'+l)); log('M4 solo A →', await txt('#m4-hint'));
for(const l of ['B','C','E']) await tap(p.locator('#c'+l)); log('M4 A+B+C+E →', await txt('#m4-hint'));
await tap(p.locator('#cB')); await p.waitForTimeout(1500); log('M4 A+C+E →', await txt('#m4-hint'), '| código visible:', await p.isVisible('#num-block'), '| campo final:', await p.isVisible('#cogito-in'));
await p.fill('#cogito-in','sum'); await p.keyboard.press('Enter'); log('palabra incorrecta →', await txt('#fb-cogito'));
await p.fill('#cogito-in','cógito'); await p.keyboard.press('Enter'); await p.waitForTimeout(1800); log('"cógito" → victoria visible:', await p.isVisible('#screen-victory'), '| progreso:', await txt('#prog-txt'));
log('overflow:', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), '| errores:', JSON.stringify(errs));
await b.close();
