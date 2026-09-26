import { chromium } from 'playwright';
const mobile = process.argv[2]==='mobile';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
const ctx=await b.newContext(mobile?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1280,height:900}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.route(/fonts\./,r=>r.abort());
const log=(...a)=>console.log((mobile?'[móvil] ':'[pc] ')+a.join(' '));
const tap=async loc=>{ await loc.scrollIntoViewIfNeeded().catch(()=>{}); if(mobile) await loc.tap(); else await loc.click(); await p.waitForTimeout(100); };
const fb=async id=>((await p.textContent('#'+id).catch(()=>''))||'').trim().slice(0,70);
const ov=async()=>p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
await p.goto('http://localhost:8766/del-mito-al-logos/index.html'); await p.waitForTimeout(500);
await tap(p.locator('.btn-start').first());
// M1
await tap(p.locator('button',{hasText:'Validar Misión'}).first()); log('M1 sin responder →', await fb('fb1'));
const M1=['MITO','LOGOS','MITO','LOGOS','MITO','LOGOS'];
for(let i=0;i<6;i++) await tap(p.locator(i===0?'#c1bL0':(M1[i]==='MITO'?'#c1bM'+i:'#c1bL'+i)));
await tap(p.locator('#screen-m1 .btn-validate')); log('M1 con un error →', await fb('fb1'));
await tap(p.locator('#c1bM0')); await tap(p.locator('#screen-m1 .btn-validate')); await p.waitForTimeout(1800); log('M1 correcta → M2 visible:', await p.isVisible('#screen-m2'), '| desbordamiento:', await ov());
// M2
const PH={'Tales de Mileto':'Agua','Anaxímenes':'Aire','Heráclito':'Fuego','Pitágoras':'Números','Demócrito':'Átomos'};
for(let r=0;r<5;r++){ const name=(await p.textContent(`#ar-${r} .phil-name`)).trim();
  if(r===0){ const wrong=Object.values(PH).find(v=>v!==PH[name]); await p.selectOption('#ar-sel-0',wrong); await tap(p.locator('#ar-0 .btn-confirm')); log('M2 asignación incorrecta →', await fb('fb2')); }
  await p.selectOption(`#ar-sel-${r}`,PH[name]); await tap(p.locator(`#ar-${r} .btn-confirm`)); }
await p.waitForTimeout(1900); log('M2 completa → M3 visible:', await p.isVisible('#screen-m3'), '| desbordamiento:', await ov());
// M3
const M3=['H','H','P','P'];
for(let i=0;i<4;i++) await tap(p.locator('#qb'+(i===3?'H':M3[i])+i));
await tap(p.locator('#screen-m3 .btn-validate')); log('M3 con un error →', await fb('fb3'));
await tap(p.locator('#qbP3')); await tap(p.locator('#screen-m3 .btn-validate')); await p.waitForTimeout(1900); log('M3 correcta → M4 visible:', await p.isVisible('#screen-m4'), '| desbordamiento:', await ov());
// M4
for(const k of ['A','B']) await tap(p.locator('#th-'+k)); await tap(p.locator('#btn-m4-verify')); log('M4 dos tesis →', await fb('fb4'));
for(const k of ['C','D']) await tap(p.locator('#th-'+k)); log('M4 cuarta tesis →', await fb('fb4'));
await tap(p.locator('#btn-m4-verify')); log('M4 A+B+C →', await fb('fb4'));
await tap(p.locator('#th-B')); await tap(p.locator('#th-D')); await tap(p.locator('#btn-m4-verify')); await p.waitForTimeout(300); log('M4 A+C+D → caja del código visible:', await p.isVisible('#m4-code-box'));
await p.fill('#num-code-input','1114614 18'); await tap(p.locator('#m4-code-box .btn-gold')); log('código sin rectificar →', await fb('fb-code'));
await p.fill('#num-code-input','12-15-7-15-19'); await tap(p.locator('#m4-code-box .btn-gold')); await p.waitForTimeout(1300); log('código 12-15-7-15-19 → pregunta final visible:', await p.isVisible('#logos-input'));
await p.fill('#logos-input','mito'); await p.keyboard.press('Enter'); log('palabra incorrecta →', await fb('fb-logos'));
await p.fill('#logos-input','lógos'); await p.keyboard.press('Enter'); await p.waitForTimeout(900); log('"lógos" → victoria visible:', await p.isVisible('#screen-victory'));
log('desbordamiento:', await ov(), '| errores JS:', JSON.stringify(errs));
await b.close();
