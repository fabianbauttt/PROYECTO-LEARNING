import { chromium } from 'playwright';
const url=process.argv[2]||'http://localhost:8766/ruleta-retos/index.html';
const b=await chromium.launch({executablePath: process.env.CHROMIUM_PATH, args:['--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage(); await p.route(/fonts\.g/,r=>r.abort());
await p.addInitScript(()=>{
  window.__audio=0; const oc=HTMLMediaElement.prototype.cloneNode; 
  const OA=window.Audio; window.Audio=function(...a){window.__audio++; return new OA(...a)}; window.Audio.prototype=OA.prototype;
  const cn=Node.prototype.cloneNode; Node.prototype.cloneNode=function(d){ if(this instanceof HTMLMediaElement) window.__audio++; return cn.call(this,d); };
  window.__src=0; const AC=window.AudioContext; if(AC){ const cb=AC.prototype.createBufferSource; AC.prototype.createBufferSource=function(){window.__src++; return cb.call(this)}; } window.__anims=0; const ea=Element.prototype.animate; Element.prototype.animate=function(...a){window.__anims++; return ea.apply(this,a)};
  window.__lt=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push(Math.round(e.duration)))).observe({type:'longtask',buffered:true});
});
const cdp=await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
await p.goto(url); await p.waitForTimeout(1500);
const res=[];
const N=+(process.argv[3]||3); for(let i=0;i<N;i++){
  await p.evaluate(()=>{window.__audio=0;window.__src=0;window.__anims=0;window.__lt=[];window.__frames=[];let last=performance.now();const f=t=>{window.__frames.push(t-last);last=t;if(!window.__stop)requestAnimationFrame(f)};window.__stop=false;requestAnimationFrame(f);});
  const t0=Date.now(); await p.click('#spinBtn'); await p.waitForSelector('#modalOverlay.open',{timeout:30000}); const dt=Date.now()-t0;
  const r=await p.evaluate(()=>{window.__stop=true; const fr=window.__frames.slice(2); const worst=Math.max(...fr); const slow=fr.filter(x=>x>50).length; return {audios:window.__audio, webaudio:window.__src, anims:window.__anims, longtasks:window.__lt.length, maxLong:Math.max(0,...window.__lt), frames:fr.length, slowFrames:slow, worstFrame:Math.round(worst)};});
  res.push({giro_ms:dt,...r});
  await p.click('#modalOk'); await p.waitForTimeout(500);
}
console.log(JSON.stringify(res,null,0));
await b.close();
