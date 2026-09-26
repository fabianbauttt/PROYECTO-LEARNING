#!/usr/bin/env node
/* Herramienta del Panel docente — PROYECTO LEARNING
 *
 * El material de cada juego se escribe en un archivo HTML sencillo
 * (fuente) y se publica CIFRADO en panel-docente-datos.js. La fuente
 * nunca se sube al repositorio.
 *
 *   node panel-docente.mjs cifrar    fuente.html  ruta/al/juego/panel-docente-datos.js
 *   node panel-docente.mjs descifrar ruta/al/juego/panel-docente-datos.js  fuente.html
 *
 * La contraseña se pide en pantalla (o se toma de la variable de
 * entorno PANEL_CLAVE).
 *
 * Formato de la fuente:
 *   <h1>Título del panel</h1>
 *   <section titulo="Soluciones"> ...HTML... </section>
 *   <section titulo="Ficha para estudiantes" ficha> ...HTML... </section>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { createInterface } from "node:readline";

const ITER = 310000;

async function getPassword(){
  if(process.env.PANEL_CLAVE) return process.env.PANEL_CLAVE;
  const rl = createInterface({ input:process.stdin, output:process.stdout });
  const p = await new Promise(r => rl.question("Contraseña del panel: ", r));
  rl.close();
  return p.trim();
}

async function deriveKey(password, salt, iter){
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name:"PBKDF2", salt, iterations:iter, hash:"SHA-256" },
    base, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]);
}

function parseSource(src){
  const h1 = /<h1>([\s\S]*?)<\/h1>/.exec(src);
  if(!h1) throw new Error("Falta el <h1> con el título del panel.");
  const secciones = [];
  const re = /<section\s+titulo="([^"]+)"(\s+ficha)?\s*>([\s\S]*?)<\/section>/g;
  let m;
  while((m = re.exec(src))){
    const s = { titulo:m[1], html:m[3].trim() };
    if(m[2]) s.ficha = true;
    secciones.push(s);
  }
  if(!secciones.length) throw new Error("No hay ninguna <section titulo=\"...\">.");
  return { titulo:h1[1].trim(), secciones };
}

function toSource(m){
  return "<h1>" + m.titulo + "</h1>\n\n" + m.secciones.map(s =>
    "<section titulo=\"" + s.titulo + "\"" + (s.ficha ? " ficha" : "") + ">\n" + s.html + "\n</section>"
  ).join("\n\n") + "\n";
}

const b64 = u => Buffer.from(u).toString("base64");

async function cifrar(fuente, salida){
  const material = parseSource(readFileSync(fuente, "utf8"));
  const password = await getPassword();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITER);
  const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(material)));
  const out =
    "/* Panel docente: contenido cifrado. No se edita a mano;\n" +
    "   ver herramientas/panel-docente en PROYECTO-LEARNING. */\n" +
    "window.PANEL_DOCENTE = " + JSON.stringify({ v:1, iter:ITER, salt:b64(salt), iv:b64(iv), data:b64(ct) }) + ";\n";
  writeFileSync(salida, out);
  console.log("Listo: " + salida + " (" + material.secciones.length + " secciones)");
}

async function descifrar(datos, salida){
  const txt = readFileSync(datos, "utf8");
  const d = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
  const password = await getPassword();
  const key = await deriveKey(password, Buffer.from(d.salt, "base64"), d.iter);
  let buf;
  try {
    buf = await crypto.subtle.decrypt({ name:"AES-GCM", iv:Buffer.from(d.iv, "base64") }, key, Buffer.from(d.data, "base64"));
  } catch(e) {
    console.error("Contraseña incorrecta.");
    process.exit(1);
  }
  writeFileSync(salida, toSource(JSON.parse(new TextDecoder().decode(buf))));
  console.log("Listo: " + salida);
}

const [cmd, a, b] = process.argv.slice(2);
if(cmd === "cifrar" && a && b) await cifrar(a, b);
else if(cmd === "descifrar" && a && b) await descifrar(a, b);
else {
  console.log("Uso:\n  node panel-docente.mjs cifrar fuente.html panel-docente-datos.js\n  node panel-docente.mjs descifrar panel-docente-datos.js fuente.html");
  process.exit(1);
}
