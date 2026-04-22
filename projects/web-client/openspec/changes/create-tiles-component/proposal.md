## Why

El ZX-IDE actualmente permite extraer *tiles* a partir de imágenes PNG, pero carece de una herramienta visual para que el usuario pueda crear y diseñar *tiles* o *sprites* manualmente introduciendo matrices binarias (0 y 1). Esto es útil cuando se quiere diseñar o ajustar un gráfico de forma rápida operando directamente sobre su representación binaria. Ahora mismo nos enfocamos en el componente `create-tiles` para sentar las bases que luego reutilizará `create-sprites`.

## What Changes

- Creación de un nuevo componente visual `CreateTiles.vue`.
- Incorporación de un panel superior (`TileInputPanel.vue`) que servirá para introducir matrices binarias de texto (0s y 1s) y visualizar la representación gráfica resultante (pixelada) en tiempo real.
- Incorporación de un mecanismo en UI para validar que la entrada binaria no contenga caracteres inválidos o espacios en blanco.
- Implementación de un botón interactivo "Añadir" en el panel superior, para acumular las creaciones en la lista de tiles.
- Reutilización o reimplementación de la sección inferior para mostrar todos los *tiles* creados en forma de galería tipo *grid* (40x40 píxeles por tile), permitiendo excluir/eliminar cada elemento.
- Funcionalidad en el *footer* de "Crear Código", unida a la selección (C o ASM) existente (estilo `SourceSection.vue`), para renderizar en pantalla la declaración de arreglos/arrays con los datos de todos los tiles activos de la colección mostrada.

## Capabilities

### New Capabilities

- `create-tiles`: Permite al usuario insertar matrices personalizadas de bits (0 y 1) vía cuadro de texto, renderizando una previsualización y dotando al sistema de la capacidad para coleccionarlos y exportarlos en código fuente (C o ASM).
- `binary-input-panel`: Componente reutilizable para lectura de texto binario y renderizado visual en lienzo (*canvas* o *img pixel-art*). (Podría ir junto en `create-tiles`, pero conceptualmente cubre la entrada base). **Nota:** Lo agruparemos bajo `create-tiles` por simplicidad de spec inicial en este caso.

### Modified Capabilities

- Ninguna.

## Impact

- **Código:** Se agregará un nuevo módulo bajo `src/create-tiles` y un posible componente en `src/shared/components/BinaryInputPanel.vue`.
- **Rutas:** Se deberá añadir una nueva entrada (opcional por ahora) o vista en la aplicación de *web-client* para que el usuario pueda usar esta herramienta.
- **Sistemas Involucrados:** El sistema de generación de código existente (importado desde DTOs / lógica base si permite crear el string C/ASM desde un array de píxeles/bits).
