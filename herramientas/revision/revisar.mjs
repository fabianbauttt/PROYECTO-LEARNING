// Revisión automática de un juego de PROYECTO LEARNING.
//
// Abre cada página .html del repositorio en un navegador automático,
// en tamaño computador y celular, y revisa:
//   - errores de JavaScript,
//   - archivos propios que no cargan (404),
//   - enlaces y recursos internos que apuntan a archivos inexistentes,
//   - contenido que se sale de la pantalla a lo ancho,
//   - que el Panel docente cargue, si el juego lo tiene.
//
// Uso:  node revisar.mjs <carpeta-del-juego>
// Termina con código 1 si encuentra problemas (así GitHub marca la
// revisión en rojo).
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const IGNORAR = new Set(['node_modules', '.git', '.github', 'herramientas', '_revision']);
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.gif':'image/gif',
  '.mp3':'audio/mpeg', '.wav':'audio/wav', '.ogg':'audio/ogg', '.mp4':'video/mp4', '.pdf':'application/pdf',
  '.webmanifest':'application/manifest+json', '.ico':'image/x-icon', '.woff2':'font/woff2', '.woff':'font/woff' };

// Páginas: todos los .html del repositorio.
function listar(dir){
  let out = [];
  for(const e of fs.readdirSync(dir, { withFileTypes:true })){
    if(IGNORAR.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out = out.concat(listar(p));
    else if(e.name.endsWith('.html')) out.push(path.relative(root, p).split(path.sep).join('/'));
  }
  return out;
}
const paginas = listar(root).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));

// Servidor local mínimo (algunos juegos no funcionan desde file://).
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if(rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if(!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const problemas = [];
const avisar = (pagina, vista, texto) => problemas.push(`${pagina} [${vista}] ${texto}`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const VISTAS = { computador:{ viewport:{ width:1280, height:900 } }, celular:{ viewport:{ width:390, height:844 }, hasTouch:true, isMobile:true } };

for(const pagina of paginas){
  for(const [vista, opts] of Object.entries(VISTAS)){
    const ctx = await browser.newContext({ ...opts, serviceWorkers:'block' });
    const page = await ctx.newPage();
    const errores = [], faltan = new Set();
    page.on('pageerror', e => errores.push(e.message));
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page.on('response', r => { if(r.status() >= 400 && r.url().startsWith(base)) faltan.add(r.url().slice(base.length)); });
    try{
      await page.goto(base + pagina, { waitUntil:'load', timeout:30000 });
    }catch(e){ avisar(pagina, vista, 'no terminó de cargar: ' + e.message.split('\n')[0]); await ctx.close(); continue; }
    await page.waitForTimeout(1500);

    for(const e of errores) avisar(pagina, vista, 'error de JavaScript: ' + e.split('\n')[0]);
    for(const f of faltan) avisar(pagina, vista, 'archivo que no carga (404): ' + f);

    const ancho = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if(ancho > 2) avisar(pagina, vista, `el contenido se sale ${ancho}px a lo ancho`);

    if(vista === 'computador'){
      // Enlaces y recursos internos escritos en el HTML (aunque no se
      // hayan cargado todavía, como el audio de un nivel posterior).
      const refs = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('a[href], [src], link[href]').forEach(el => {
          const v = el.getAttribute('href') || el.getAttribute('src');
          if(v) out.push(v);
        });
        return out;
      });
      for(const ref of new Set(refs)){
        if(/^(https?:|mailto:|tel:|data:|blob:|javascript:|#)/i.test(ref) || ref.includes('${')) continue;
        const limpio = ref.split('#')[0].split('?')[0];
        if(!limpio) continue;
        let destino = path.join(root, path.dirname(pagina), decodeURIComponent(limpio));
        if(limpio.endsWith('/')) destino = path.join(destino, 'index.html');
        if(!fs.existsSync(destino)) avisar(pagina, vista, 'enlace o recurso interno inexistente: ' + ref);
      }
      // Panel docente: si la página lo incluye, que haya cargado.
      const usaPanel = await page.evaluate(() => !!document.querySelector('script[src$="panel-docente.js"]'));
      if(usaPanel){
        const ok = await page.evaluate(() => !!window.PANEL_DOCENTE && !!document.getElementById('panel-docente'));
        if(!ok) avisar(pagina, vista, 'el Panel docente no cargó');
      }
    }
    await ctx.close();
  }
  console.log('revisada: ' + pagina);
}
await browser.close();
server.close();

// Rutas de archivos escritas en el código (por ejemplo, audios o
// imágenes de un nivel que se cargan más tarde desde JavaScript).
function listarCodigo(dir){
  let out = [];
  for(const e of fs.readdirSync(dir, { withFileTypes:true })){
    if(IGNORAR.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out = out.concat(listarCodigo(p));
    else if(/\.(html|js|mjs|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const RUTA = /["'`(]((?:\.{1,2}\/)?[\w\-./]+\.(?:mp3|wav|ogg|mp4|webm|png|jpe?g|webp|gif|svg|pdf))["'`)]/gi;
const vistas = new Set();
for(const archivo of listarCodigo(root)){
  // Sin comentarios: ahí suele haber rutas de ejemplo.
  const texto = fs.readFileSync(archivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  for(const m of texto.matchAll(RUTA)){
    const ref = m[1];
    if(/^(https?:|data:)/i.test(ref) || ref.startsWith('/')) continue;
    // En JavaScript las rutas se resuelven desde la página (normalmente
    // la raíz del juego); en HTML y CSS, desde la carpeta del archivo.
    const candidatos = [path.join(path.dirname(archivo), ref)];
    if(/\.m?js$/.test(archivo)) candidatos.push(path.join(root, ref));
    const clave = path.relative(root, archivo) + ' → ' + ref;
    if(vistas.has(clave)) continue;
    vistas.add(clave);
    if(!candidatos.some(c => fs.existsSync(c))) problemas.push(`${path.relative(root, archivo)} [código] archivo inexistente: ${ref}`);
  }
}

if(problemas.length){
  console.log('\n❌ Se encontraron ' + problemas.length + ' problema(s):');
  for(const p of problemas) console.log('  - ' + p);
  process.exit(1);
}
console.log('\n✅ Todo en orden: ' + paginas.length + ' página(s) revisadas en computador y celular.');
