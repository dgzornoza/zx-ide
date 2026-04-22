## 1. Refactor: Mover generadores de código de sprites a shared

- [x] 1.1 Crear el directorio `src/shared/composables/spritesCodeGenerators/` y mover los ficheros `asmGenerator.ts`, `cGenerator.ts`, `codeGeneratorFactory.ts` y `codeGeneratorStrategy.ts` desde `src/extract-sprites/composables/codeGenerators/`.
- [x] 1.2 Actualizar todas las importaciones en `src/extract-sprites/` para que apunten a `src/shared/composables/spritesCodeGenerators/`.
- [x] 1.3 Verificar que `tsc --noEmit` no produce errores tras el movimiento.

## 2. Modelo compartido para sprites creados manualmente

- [x] 2.1 Crear `src/shared/models/createSpriteDefinition.ts` con las interfaces `CreateSpriteFrame` y `CreateSpriteDefinition` según el diseño.

## 3. Componente compartido SpritesCreatorSection

- [x] 3.1 Crear `src/shared/components/SpriteCreatorItem.vue` que muestre nombre, dimensiones, lista de miniaturas de frames y botones para eliminar el sprite y cada frame.
- [x] 3.2 Crear `src/shared/components/SpritesCreatorSection.vue` que reciba `sprites: CreateSpriteDefinition[]` y emita los eventos `add-sprite`, `remove-sprite`, `remove-frame`.
- [x] 3.3 Añadir el botón "Nuevo sprite" dentro de `SpritesCreatorSection.vue` que emita `add-sprite`.
- [x] 3.4 Verificar que ningún fichero del componente importa desde `src/extract-sprites/`.

## 4. Módulo create-sprites

- [x] 4.1 Crear el directorio `src/create-sprites/` con la estructura `App.vue`, `main.ts` y `composables/useCreateSprites.ts`.
- [x] 4.2 Implementar `useCreateSprites.ts` con el estado reactivo de sprites/frames, lógica `addFrame`, `addSprite`, `removeSprite`, `removeFrame` y validación de dimensiones consistentes.
- [x] 4.3 Implementar `App.vue` de `create-sprites` integrando `BinaryInputPanel`, `CodeGenerationSelector` y `SpritesCreatorSection`.
- [x] 4.4 Conectar el evento `@add` de `BinaryInputPanel` con `addFrame` del composable (añade frame al sprite activo o muestra error si dimensiones no coinciden).
- [x] 4.5 Implementar la generación de código en `useCreateSprites` usando `createSpritesCodeGenerator` desde `src/shared/composables/spritesCodeGenerators/`.

## 5. Integración y traducciones

- [x] 5.1 Crear el fichero HTML de entrada `create-sprites.html` en la raíz de `web-client` siguiendo la misma estructura que `create-tiles.html`.
- [x] 5.2 Añadir las claves de traducción de `create-sprites` en `src/i18n.ts` (title, subtitle, outputNameLabel, outputNamePlaceholder, create, errorNoSprites, errorDimensionMismatch y las claves ya usadas de `BinaryInputPanel`).
- [x] 5.3 Añadir la entrada de navegación en la extensión VS Code (o equivalente web-client) para que `create-sprites` sea accesible desde la interfaz.
- [x] 5.4 Añadir `create-sprites` a la configuración de `vite.config.ts` como nuevo entry point.
