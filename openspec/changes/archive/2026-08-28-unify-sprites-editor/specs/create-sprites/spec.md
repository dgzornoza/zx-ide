## MODIFIED Requirements

### Requirement: Usuario puede diseñar sprites manualmente con matrices binarias

El sistema SHALL permitir al usuario introducir matrices de `0` y `1` (separadas por saltos de línea) en un panel de entrada (`BinaryInputPanel`) para definir cada frame de un sprite, y SHALL mostrar una previsualización pixelada en tiempo real. El bitmap introducido se almacena en el campo opcional `frame.bitmap` del modelo `SpriteDefinition` unificado.

#### Scenario: Entrada binaria válida genera previsualización

- **WHEN** el usuario introduce únicamente caracteres `0`, `1` y saltos de línea en el textarea
- **THEN** el sistema SHALL renderizar en tiempo real una previsualización pixelada del patrón binario

#### Scenario: Entrada con caracteres inválidos muestra error

- **WHEN** el usuario introduce cualquier carácter distinto de `0`, `1` o salto de línea
- **THEN** el sistema SHALL mostrar un mensaje de error en rojo y el botón "Añadir" SHALL estar deshabilitado

#### Scenario: Filas de longitud desigual muestran error

- **WHEN** el usuario introduce filas de diferente longitud
- **THEN** el sistema SHALL mostrar un mensaje de error en rojo y el botón "Añadir" SHALL estar deshabilitado

### Requirement: Cada pulsación de "Añadir" crea un frame en el sprite activo

El sistema SHALL añadir el bitmap binario actual como un nuevo frame al sprite activo cuando el usuario pulse el botón "Añadir" del panel de entrada. El frame añadido SHALL tener `x = 0`, `y = 0` y SHALL contener el bitmap en `frame.bitmap`.

#### Scenario: Añadir frame a sprite activo

- **WHEN** la entrada binaria es válida y el usuario pulsa "Añadir"
- **THEN** el sistema SHALL crear un nuevo frame en el sprite activo con el bitmap introducido (almacenado en `frame.bitmap`) y SHALL limpiar el textarea

#### Scenario: Añadir frame con dimensiones distintas al sprite activo

- **WHEN** el bitmap ingresado tiene dimensiones (width × height) diferentes a `sprite.width` × `sprite.height` del sprite activo
- **THEN** el sistema SHALL mostrar un mensaje de error y SHALL rechazar la inserción sin modificar el estado

### Requirement: Usuario puede gestionar múltiples sprites

El sistema SHALL permitir al usuario crear nuevos sprites y eliminarlos de la colección.

#### Scenario: Crear nuevo sprite

- **WHEN** el usuario pulsa el botón "Add sprite"
- **THEN** el sistema SHALL añadir un nuevo sprite vacío a la colección y SHALL establecerlo como sprite activo

#### Scenario: Eliminar sprite existente

- **WHEN** el usuario pulsa el botón de eliminar de un sprite
- **THEN** el sistema SHALL remover ese sprite y todos sus frames de la colección

#### Scenario: Eliminar frame de un sprite

- **WHEN** el usuario pulsa el botón de eliminar de un frame
- **THEN** el sistema SHALL remover ese frame del sprite correspondiente

### Requirement: Usuario puede seleccionar sprite activo desde la sección de sprites

El sistema SHALL permitir al usuario designar un sprite como activo pulsando el botón "Add frame" dentro de la card de ese sprite. El sprite activo SHALL recibir el próximo frame añadido desde el `BinaryInputPanel` y SHALL mostrar un indicador visual ("Active" badge / border highlight).

#### Scenario: Marcar sprite como activo

- **WHEN** el usuario pulsa "Add frame" en la card de un sprite
- **THEN** el sistema SHALL establecer ese sprite como activo y SHALL enfocar el `BinaryInputPanel` para que el siguiente "Add" del panel binario caiga en ese sprite

#### Scenario: Indicador visual del sprite activo

- **WHEN** hay un sprite activo
- **THEN** la card del sprite activo SHALL mostrar un badge "Active" o un highlight de borde claramente distinguible del resto

### Requirement: Usuario puede configurar flags de sprite (SP1 padding y Use mask)

El sistema SHALL exponer dos checkboxes "Add SP1 padding" y "Use mask" en la sección de sprites. El estado combinado SHALL almacenarse en `spriteFlags` y SHALL pasarse a `SpritesCodeGeneratorParams.spriteFlags` al generar código.

#### Scenario: Activar SP1 padding antes de generar

- **WHEN** el usuario marca el checkbox "Add SP1 padding" y pulsa "Crear Código"
- **THEN** el código generado SHALL incluir padding SP1 (7 bytes cero antes y 8 después de cada columna)

#### Scenario: Activar Use mask antes de generar

- **WHEN** el usuario marca el checkbox "Use mask" y pulsa "Crear Código"
- **THEN** el código generado SHALL incluir el plano de máscara intercalado con los píxeles

#### Scenario: Estado inicial sin flags

- **WHEN** no hay configuración cargada desde `.cfg` y el usuario no ha tocado los checkboxes
- **THEN** ambos checkboxes SHALL estar desmarcados y `spriteFlags` SHALL ser `0`

### Requirement: Inputs de ancho y alto editables en cada sprite

El sistema SHALL permitir al usuario editar inline el ancho y alto de un sprite desde su card. La validación de dimensiones del frame añadido SHALL seguir comprobando que el bitmap coincida con el `sprite.width` × `sprite.height` actual.

#### Scenario: Cambiar ancho o alto manualmente

- **WHEN** el usuario edita el input de width o height de un sprite
- **THEN** la propiedad correspondiente del sprite SHALL actualizarse con el valor numérico introducido

#### Scenario: Añadir frame con dimensiones inconsistentes tras editar width/height

- **WHEN** el usuario cambió el width/height del sprite activo y luego intenta añadir un bitmap con dimensiones distintas
- **THEN** el sistema SHALL rechazar el frame con el mismo mensaje `errorDimensionMismatch` y SHALL no modificar el estado

### Requirement: Usuario puede generar código C o ASM

El sistema SHALL permitir al usuario seleccionar el tipo de salida (C o ASM) y SHALL generar el código fuente correspondiente para todos los sprites activos de la colección al pulsar "Crear Código". El parámetro `spriteFlags` SHALL viajar al generador junto con los sprites.

#### Scenario: Generación de código con sprites en la colección

- **WHEN** la colección tiene al menos un sprite con al menos un frame y el usuario pulsa "Crear Código"
- **THEN** el sistema SHALL generar el archivo de código (C o ASM) y el archivo `.cfg` de la colección y SHALL ofrecerlos para descarga, propagando `spriteFlags` al generador

#### Scenario: Botón "Crear Código" deshabilitado sin sprites

- **WHEN** la colección de sprites está vacía
- **THEN** el botón "Crear Código" SHALL estar deshabilitado

## REMOVED Requirements

### Requirement: El composable de create-sprites usa el modelo CreateSpriteDefinition

> Replaced by the unified `SpriteDefinition` model declared in `src/shared/models/spriteDefinition.ts`. `CreateSpriteDefinition` and `CreateSpriteFrame` are deleted; bitmaps are stored as `frame.bitmap` on `SpriteFrame`.

### Requirement: La sección de sprites de create-sprites usa SpritesCreatorSection

> Replaced by the unified `SpritesEditorSection` shared component declared in `openspec/specs/sprites-editor-section/`. `SpritesCreatorSection.vue` and `SpriteCreatorItem.vue` are deleted.