# Panel docente

Panel protegido con contraseña que se agrega a la pantalla de inicio de cada juego. Muestra el material para el docente: resumen, soluciones, guía de uso en clase, preguntas de discusión, rúbrica y una ficha imprimible para estudiantes.

## Cómo funciona

- **`panel-docente.js`** es el módulo común. Es el mismo archivo en todos los juegos y agrega el botón **Panel docente** y su ventana. Esta carpeta guarda la copia maestra.
- **`panel-docente-datos.js`** está en cada juego y contiene su material **cifrado** (AES-GCM, con una clave derivada de la contraseña mediante PBKDF2). Sin la contraseña, quien abra el código fuente solo ve texto ilegible.
- **El material en texto legible (la «fuente») nunca se sube a GitHub.** Si hace falta editarlo, se recupera descifrando el archivo del juego.

En la pantalla de inicio de cada juego, antes de `</body>`:

```html
<script src="panel-docente-datos.js"></script>
<script src="panel-docente.js"></script>
```

Si el juego tiene todas sus pantallas en una sola página, se agrega `data-solo-en` con un selector de la pantalla de inicio, para que el botón solo se vea ahí:

```html
<script src="panel-docente.js" data-solo-en="#screen-intro"></script>
```

Algunos juegos retoman la partida guardada y no vuelven a mostrar la pantalla de inicio. En ese caso, agregando `#docente` al final de la dirección (por ejemplo, `https://fabianbauttt.github.io/dos-mundos/#docente`) el botón aparece en cualquier pantalla. Igual pide la contraseña.

Si el juego ya tiene un lugar para el docente en su pantalla de inicio, el botón puede ir dentro de la página, justo después de ese elemento, en vez de flotar en una esquina:

```html
<script src="panel-docente.js" data-junto-a="#h-teacher"></script>
```

## Editar el material de un juego

Se necesita [Node.js](https://nodejs.org) 18 o superior.

```sh
# 1. Recuperar la fuente (pide la contraseña)
node panel-docente.mjs descifrar ../../../escape-identidad/panel-docente-datos.js fuente.html

# 2. Editar fuente.html con cualquier editor

# 3. Volver a cifrarla en el juego
node panel-docente.mjs cifrar fuente.html ../../../escape-identidad/panel-docente-datos.js

# 4. Borrar fuente.html: no se sube al repositorio
```

## Formato de la fuente

```html
<h1>Título del juego</h1>

<section titulo="Resumen"> ...HTML... </section>
<section titulo="Soluciones"> ...HTML... </section>
<section titulo="Ficha para estudiantes" ficha> ...HTML... </section>
```

Cada `<section>` es una pestaña del panel. La que lleva `ficha` se muestra con el botón **Imprimir ficha** y se imprime en hoja blanca. En la ficha se pueden usar estas clases:

- `caja`: recuadro para escribir;
- `linea`: renglón;
- `datos`: fila con nombres, curso y fecha.

En las demás pestañas se pueden usar `pd-note` (recuadro destacado) y `mono` (texto de código).

## Importante

La contraseña protege el contenido del panel. En los juegos que revisan las respuestas en la propia página, esas respuestas siguen en el código del juego, porque las necesita para funcionar.
