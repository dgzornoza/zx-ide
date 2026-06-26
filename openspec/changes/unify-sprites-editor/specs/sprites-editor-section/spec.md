## ADDED Requirements

### Requirement: Componente muestra colección de sprites con sus frames

El componente `SpritesEditorSection.vue` SHALL renderizar una sección que liste todos los sprites de la colección, mostrando para cada uno su nombre, dimensiones y la lista de frames como miniaturas pixeladas de 40×40 píxeles con `image-rendering: pixelated`.

#### Scenario: Sección vacía sin sprites

- **WHEN** la colección `sprites` está vacía
- **THEN** el componente SHALL mostrar el encabezado de la sección y el botón "Add sprite", y SHALL no renderizar ninguna card de sprite.

#### Scenario: Visualización de frames como miniaturas

- **WHEN** un sprite tiene uno o más frames
- **THEN** el componente SHALL mostrar cada frame como una miniatura pixelada.

### Requirement: Componente expone flags SP1 padding y Use mask

El componente SHALL exponer dos checkboxes ("Add SP1 padding" y "Use mask") controlados por el modelo `spriteFlags`. Activar un checkbox SHALL activar el bit correspondiente de `SpriteFlags` en el modelo; desactivarlo SHALL quitarlo.

#### Scenario: Toggle del flag SP1 padding

- **WHEN** el usuario marca el checkbox "Add SP1 padding"
- **THEN** el modelo `spriteFlags` SHALL contener el bit `SpriteFlags.Sp1Padding`.

#### Scenario: Toggle del flag Use mask

- **WHEN** el usuario marca el checkbox "Use mask"
- **THEN** el modelo `spriteFlags` SHALL contener el bit `SpriteFlags.UseMask`.

#### Scenario: Estado inicial sin flags

- **WHEN** el componente se monta con `spriteFlags = SpriteFlags.None`
- **THEN** ambos checkboxes SHALL estar desmarcados.

### Requirement: Componente permite añadir, eliminar sprites y gestionar frames por sprite

El componente SHALL emitir los eventos `add-sprite`, `remove-sprite`, `add-frame` y `remove-frame` para todas las operaciones de mutación, y SHALL delegar al padre cualquier efecto sobre el estado.

#### Scenario: Emisión de add-sprite

- **WHEN** el usuario pulsa el botón "Add sprite"
- **THEN** el componente SHALL emitir `add-sprite` sin payload.

#### Scenario: Emisión de remove-sprite

- **WHEN** el usuario pulsa el botón de eliminar de una card de sprite
- **THEN** el componente SHALL emitir `remove-sprite` con el índice del sprite como payload.

#### Scenario: Emisión de add-frame

- **WHEN** el usuario pulsa el botón "Add frame" dentro de una card de sprite
- **THEN** el componente SHALL emitir `add-frame` con el índice del sprite como payload.

#### Scenario: Emisión de remove-frame

- **WHEN** el usuario pulsa el botón de eliminar de un frame
- **THEN** el componente SHALL emitir `remove-frame` con los índices `[spriteIndex, frameIndex]` como payload.

### Requirement: Sprite item permite editar nombre, ancho y alto

El componente `SpriteEditorItem.vue` SHALL permitir editar inline el nombre, ancho y alto del sprite. El panel de animación SHALL mostrar la miniatura del frame activo.

#### Scenario: Edición del nombre

- **WHEN** el usuario escribe en el input de nombre
- **THEN** la propiedad `sprite.name` SHALL actualizarse en tiempo real.

#### Scenario: Edición del ancho y alto

- **WHEN** el usuario escribe en los inputs de width o height
- **THEN** las propiedades `sprite.width` y `sprite.height` SHALL actualizarse con el valor numérico.

#### Scenario: Miniatura del frame activo en el panel de animación

- **WHEN** un sprite tiene al menos un frame
- **THEN** el panel de animación SHALL mostrar la miniatura del frame actualmente seleccionado (calculada desde `sourceImage` si se provee, o desde `frame.bitmap?.preview` en caso contrario).

### Requirement: Frame item editable con coordenadas X/Y opcionales

El componente SHALL mostrar, para cada frame, los inputs X/Y cuando la prop `showFrameCoords` es `true`, y SHALL ocultarlos (manteniendo la alineación del grid con celdas vacías) cuando es `false`.

#### Scenario: Mostrar inputs X/Y por defecto

- **WHEN** `showFrameCoords` no se especifica o es `true`
- **THEN** cada frame SHALL mostrar inputs editables de X y Y enlazados a `frame.x` y `frame.y`.

#### Scenario: Ocultar inputs X/Y

- **WHEN** `showFrameCoords` es `false`
- **THEN** los inputs de X e Y SHALL no renderizarse; SHALL renderizarse celdas vacías en su lugar para preservar la alineación del grid.

### Requirement: Componente está desacoplado de páginas consumidoras

El componente SHALL no importar nada de `src/extract-sprites/` ni de `src/create-sprites/`. SHALL depender únicamente de `src/shared/`, helpers globales y librerías externas.

#### Scenario: Importación sin dependencias horizontales

- **WHEN** se analiza estáticamente el grafo de importaciones de `SpritesEditorSection.vue` y `SpriteEditorItem.vue`
- **THEN** no SHALL existir ninguna importación cuya ruta comience por `src/extract-sprites` o `src/create-sprites`.

### Requirement: Tipo de modelo `SpriteDefinition` extendido opcionalmente con bitmap

El modelo `SpriteDefinition` SHALL poder representar frames con o sin bitmap asociado. La propiedad `bitmap` SHALL ser opcional y SHALL contener `inkBitmap: boolean[]` y `preview: string` cuando está presente.

#### Scenario: Frame con bitmap (flujo create-sprites)

- **WHEN** un `SpriteFrame` proviene del flujo de entrada binaria
- **THEN** SHALL existir `frame.bitmap` con `inkBitmap` y `preview`.

#### Scenario: Frame sin bitmap (flujo extract-sprites)

- **WHEN** un `SpriteFrame` proviene del flujo de extracción desde imagen
- **THEN** SHALL existir `frame.x` y `frame.y` con coordenadas de píxel, y `frame.bitmap` SHALL estar ausente o indefinido.