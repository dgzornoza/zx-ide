## Why

El ZX-IDE ya dispone de `create-tiles` para que el usuario diseñe *tiles* manualmente introduciendo matrices binarias. El siguiente paso natural es `create-sprites`, que extiende esa misma mecánica de entrada binaria para soportar sprites con múltiples *frames*, reutilizando al máximo los componentes y lógica ya compartidos.

## What Changes

- Creación del módulo `create-sprites` bajo `src/create-sprites/`.
- Reutilización del componente `BinaryInputPanel.vue` (ya en `src/shared/components/`) para la entrada y previsualización de la matriz binaria del sprite.
- Reutilización de `CodeGenerationSelector.vue` para elegir salida C o ASM.
- Creación de un nuevo componente compartido `SpritesCreatorSection.vue` en `src/shared/components/` que muestre la colección de sprites con sus frames (cada click en "Añadir" del `BinaryInputPanel` añade un frame al sprite activo, y existe un botón para agregar un nuevo sprite).
- Creación del composable `useCreateSprites.ts` con el estado reactivo de sprites/frames y la lógica de generación de código.
- Extracción del generador de código de sprites a `src/shared/composables/spritesCodeGenerators/` para que esté desacoplado de `extract-sprites`.
- Ajuste de traducciones en `i18n.ts` y alta en la navegación de la aplicación.

## Capabilities

### New Capabilities

- `create-sprites`: Permite al usuario diseñar sprites de forma manual introduciendo matrices binarias de 0 y 1, organizar cada sprite en múltiples frames y exportar el conjunto como código C o ASM para ZX Spectrum.
- `sprites-creator-section`: Componente visual compartido que muestra la colección de sprites con sus frames (miniaturas pixeladas), permite añadir/eliminar sprites y frames, y es agnóstico al origen de los datos (reutilizable desde `create-sprites` y en el futuro desde otros contextos).

### Modified Capabilities

- `shared-code-generators`: La lógica de generación de código de sprites (actualmente solo en `extract-sprites/composables/codeGenerators/`) se moverá a `src/shared/composables/spritesCodeGenerators/` para que `create-sprites` pueda consumirla sin acoplamiento horizontal.

## Impact

- **Código nuevo:** `src/create-sprites/` (App.vue, main.ts, composables/useCreateSprites.ts).
- **Código compartido nuevo:** `src/shared/components/SpritesCreatorSection.vue`, `src/shared/composables/spritesCodeGenerators/`.
- **Código compartido modificado:** `src/shared/models/` — posible adición de modelo `CreateSpriteDefinition` (variante runtime del sprite para el flujo de creación manual).
- **Otros:** nueva entrada en navegación/HTML, traducciones en `i18n.ts`.
