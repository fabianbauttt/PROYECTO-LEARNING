# Revisión automática

Cada vez que se sube un cambio a un juego (o se abre un PR), GitHub revisa solo sus páginas en un navegador automático, en tamaño computador y celular:

- errores de JavaScript;
- archivos propios que no cargan (404);
- enlaces y recursos internos que apuntan a archivos inexistentes, también los que están escritos dentro del código (audios, imágenes de niveles posteriores);
- contenido que se sale de la pantalla a lo ancho;
- que el Panel docente cargue, si el juego lo tiene.

Si encuentra algo, la revisión queda en **rojo** (❌) en GitHub y el correo de aviso dice qué página y qué problema. Si todo está bien, queda en **verde** (✅).

## Cómo está armada

- `revisar.mjs`: el script que hace la revisión.
- `../../.github/workflows/revisar-juego.yml`: el flujo común de GitHub Actions que descarga el juego y esta herramienta y corre el script.
- En cada juego, un archivo pequeño `.github/workflows/revision.yml` que llama al flujo común cuando hay un cambio en `main`, un PR, o cuando se lanza a mano (pestaña **Actions** → **Revisión** → **Run workflow**).

Como todo el código de la revisión vive aquí, basta con mejorarlo una vez para que todos los juegos lo usen.

## Correrla en tu computador

Con Node.js instalado, desde esta carpeta:

```sh
npm install
npx playwright install chromium
node revisar.mjs ../../../cazafalacias
```

(La ruta es la carpeta del juego que quieres revisar.)
