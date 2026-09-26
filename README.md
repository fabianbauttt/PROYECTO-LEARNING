# PROYECTO LEARNING // Game Hub

Hub de simuladores educativos y retos interactivos creado por el Prof. Fabián Bautista G.
Reúne en una sola página los juegos de **Filosofía**, **Ciencias Sociales**, **Escape Rooms** y **Otros**.
Cada juego se muestra como un "expediente" que se puede filtrar por categoría y abrir para ver sus detalles.

## Cómo usarlo

El proyecto es un único archivo estático, `index.html`, sin dependencias ni paso de compilación.

- **En local:** abre `index.html` directamente en el navegador.
- **En la web:** publícalo con GitHub Pages (Settings → Pages → rama `main`, carpeta raíz).

## Cómo añadir un juego nuevo

Agrega un objeto al arreglo `GAMES` dentro del `<script>` de `index.html`:

```js
{
  id: 'FIL-007',                 // prefijo según la categoría: FIL, CS, ESC u OTR
  title: 'Nombre del juego',
  description: 'Descripción breve que aparece en la tarjeta.',
  category: 'filosofia',         // filosofia | sociales | escape | otros
  icon: '🧠',
  url: 'https://fabianbauttt.github.io/nombre-del-repo/',
  estimatedTime: '30 min',
  difficulty: 'Intermedia',
  warning: 'Advertencia que se muestra en el expediente.',
  addedAt: '2026-10-15',         // opcional: fecha en que lo agregas (AAAA-MM-DD)
  isCompleted: false
},
```

La tarjeta, su miniatura y el contador de expedientes se generan automáticamente, y el juego aparece en el buscador.

### Etiqueta «Nuevo»

Si el juego tiene `addedAt`, su tarjeta y su expediente muestran la etiqueta **Nuevo** durante 30 días desde esa fecha; después desaparece sola. Para cambiar la duración, edita `NEW_BADGE_DAYS` en `index.html`.

### Buscador

Busca en el título, la descripción, la categoría y el código de cada juego. No distingue mayúsculas ni tildes, se combina con el filtro de categoría activo y, si escribes varias palabras, muestra solo los juegos que las contienen todas.
