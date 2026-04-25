## Context

Actualmente el ecosistema ZX-IDE tiene herramientas para convertir imágenes preexistentes a código de ensamblador Z80 / C. Sin embargo, no permite que el usuario redacte matrices crudas de bits para generar sprites de forma directa. Se requiere un módulo llamado `create-tiles` para proveer esta funcionalidad con una vista previa de lo que se escribe y la capacidad de acumular varios *tiles* antes de exportar el código resultante.

La sección superior (entrar código e inspeccionarlo) debe ser lo suficientemente genérica para que en el futuro `create-sprites` la reaproveche.

## Goals / Non-Goals

**Goals:**

- Implementar una interfaz parecida a `App.vue` (de `extract-tiles`), pero con un panel superior `TileInputPanel.vue` o `BinaryInputPanel.vue` en lugar del `SourceSection.vue`.
- Validar las entradas de caracteres: si el texto tiene espacios u otros datos que no sean `0`, `1` o saltos de línea (`\n`), mostrar un mensaje en rojo y rechazar la inserción.
- Renderizar en un canvas (o como imagen pixelada) el bit-array ingresado.
- Permitir coleccionar cada gráfico bajo una sección `TilesSection.vue` re-usada (o emulada si es necesario un control distinto).
- Generar código fuente C y/o Ensamblador Z80 para todo el set coleccionado.

**Non-Goals:**

- Soportar color en los sprites o tiles. Siempre será monocromo (bit = píxel).
- Implementar `create-sprites` con su sistema de frames en esta iteración. Solo sentar las bases conceptuales.
- Copiar al portapapeles del SO (el usuario copiará la salida renderizada del cuadro de texto final si la necesita).

## Decisions

1. **Reutilización o Creación de TilesSection**: Dado que `extract-tiles` cuenta con un `TilesSection.vue` que permite manejar una colección (dibujar *previews*, exclusiones, borrar con `+`/`-`), la estrategia será reinterpretar o directamente incluir dicho control si su lógica está suficientemente desacoplada. Se usará el mismo estilo de CSS `image-rendering: pixelated` para que los rectángulos de 40x40px luzcan correctos.
2. **Validación del texto**: Se añadirá un objeto *Computed* asado en la variable del *textarea*. Este computed revisará que `/[^01\n\r]/.test(variable)` sea falso. Si es verdadero, activará el estado de error. Opcionalmente, se puede imponer reglas de forma rectangular (todas las filas del mismo largo).
3. **Generación C/ASM**: La generación puede invocar las mismas librerías compartidas (como `generateTilesOutput`) pasándole nuestro arreglo extraído de la entrada de texto binaria (convertida a `Uint8Array`).

## Risks / Trade-offs

- **Riesgo:** Que distintos tamaños de tiles por cada string ingresado rompan la visualización en la colección.
  - **Mitigación:** Asegurar que si en la colección se añaden tiles, se advierta o limite a que el primer insertado delimite el Ancho x Alto de todo el banco, o simplemente se calcule el largo por fila y cantidad de filas.
- **Riesgo:** Que el texto binario introducido por el usuario tenga diferentes anchos de fila.
  - **Mitigación:** Proveer retroalimentación visual si las líneas (separadas por salto) no tienen el mismo tamaño de columnas.
