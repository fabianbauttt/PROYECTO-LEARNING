# Pruebas automáticas de los juegos

Scripts que juegan cada juego de principio a fin en un navegador automático (Playwright): responden bien y mal, recargan la página, revisan que no haya errores de JavaScript, archivos faltantes (404) ni contenido que se salga de la pantalla. Casi todos se pueden correr en tamaño computador y en tamaño celular.

Sirven para comprobar que un cambio no rompió nada antes de publicarlo.

## Preparación (una sola vez)

1. Instala [Node.js](https://nodejs.org) 18 o superior.
2. Pon todos los repositorios **en la misma carpeta**, uno al lado del otro. Por ejemplo:

   ```
   Proyectos/
     PROYECTO-LEARNING/
     cazafalacias/
     escape-identidad/
     ubica-y-ubicate/
     …
   ```

3. En esta carpeta (`PROYECTO-LEARNING/herramientas/pruebas`), instala Playwright y su navegador:

   ```sh
   npm install
   npx playwright install chromium
   ```

## Cómo correr una prueba

1. En una terminal, desde la carpeta `Proyectos`, sirve los juegos por http (algunos no funcionan abriendo el archivo con doble clic):

   ```sh
   python3 -m http.server 8766
   ```

   Déjala abierta mientras pruebas.

2. En otra terminal, desde esta carpeta:

   ```sh
   node cazafalacias.mjs          # tamaño computador
   node cazafalacias.mjs mobile   # tamaño celular
   ```

Cada línea que imprime es un paso comprobado. Al final aparecen los errores de JavaScript y los archivos 404; lo normal es `errores: []` y `404: []`. (Un `net::ERR_FAILED` es esperable: las pruebas bloquean las fuentes de Google a propósito para ir más rápido.)

## Scripts

| Script | Juego |
|---|---|
| `escape-identidad.mjs` | A.I.C. — los 5 niveles |
| `conflicto-armado.mjs` | Archivo Central de Memoria — las 5 fases |
| `camara-de-eco.mjs` | Cámara de Eco (usa `ce-levels.json`) |
| `del-mito-al-logos.mjs` | Arkhé |
| `escape-descartes.mjs` | El Genio Maligno |
| `laboratoriobioetico.mjs` | Laboratorio Bioético |
| `escape-guerra-fria.mjs` | Operación Teléfono Rojo |
| `dos-mundos.mjs` | Dos Mundos |
| `habitacion-del-amnesico.mjs` | La Habitación del Amnésico |
| `el-juego-de-la-supervivencia.mjs` | El Juego de la Supervivencia |
| `noche-museo.mjs` | Comité Curatorial |
| `cazafalacias.mjs` | Cazafalacias (lee los casos de `../../../cazafalacias/data.js`) |
| `paises-europa.mjs` | Europa (usa `eu-pool.json`; tarda varios minutos) |
| `paises-america.mjs` | América (tarda varios minutos) |
| `ubica-y-ubicate.mjs` | Ubica y ubícate |
| `ubica-y-ubicate-sin-internet.mjs` | Ubica y ubícate sin conexión (service worker) |
| `laboratorio-creadores-digitales.mjs` | Laboratorio de Creadores Digitales (usa `lab.json`) |
| `tablasdel1al5.mjs` | Tablas con Mascotas (tarda cerca de un minuto por los temporizadores) |
| `ruleta-retos.mjs` | Ruleta: el reto coincide con la porción bajo el puntero |
| `ruleta-rendimiento.mjs` | Ruleta: mide tirones y reproductores de audio durante el giro |
| `panel-docente.mjs` | Panel docente de cualquier juego (ver abajo) |

Si un juego cambia (textos, respuestas, botones), su prueba puede necesitar un ajuste. Los archivos `.json` son copias de los datos de algunos juegos: si cambias esos datos, hay que actualizarlos también.

## Probar el Panel docente

La contraseña **no** se escribe en ningún archivo (este repositorio es público). Se pasa al correr la prueba:

```sh
PANEL_CLAVE=la-contraseña node panel-docente.mjs ruleta-retos '' ''
```

Los argumentos son: carpeta del juego, selector de la pantalla de inicio y selector del botón para empezar a jugar (con `''` se omiten).

## Opcional

Si ya tienes Chrome o Chromium instalado y prefieres usarlo en vez del de Playwright:

```sh
CHROMIUM_PATH=/ruta/a/chromium node cazafalacias.mjs
```
