## ADDED Requirements

### Requirement: Generadores de código de sprites residen en shared

Los generadores de código de sprites (`createSpritesCodeGenerator`, `AsmSpritesCodeGeneratorStrategy`, `CSpritesCodeGeneratorStrategy`) SHALL residir en `src/shared/composables/spritesCodeGenerators/` para que cualquier módulo del web-client pueda consumirlos sin acoplamiento horizontal.

#### Scenario: Importación desde shared en create-sprites

- **WHEN** `useCreateSprites.ts` necesita generar código de sprites
- **THEN** SHALL importar `createSpritesCodeGenerator` desde `src/shared/composables/spritesCodeGenerators/codeGeneratorFactory`

#### Scenario: extract-sprites usa la versión migrada

- **WHEN** `useExtractSprites.ts` necesita generar código de sprites
- **THEN** SHALL importar `createSpritesCodeGenerator` desde `src/shared/composables/spritesCodeGenerators/codeGeneratorFactory` (misma fuente que create-sprites)

### Requirement: La interfaz pública de los generadores no cambia

Al mover los generadores a shared, la API pública (`SpritesCodeGeneratorParams`, `SpritesCodeGeneratorStrategy`, `createSpritesCodeGenerator`) SHALL mantenerse idéntica para no romper los consumidores existentes.

#### Scenario: Compilación sin errores tras el movimiento

- **WHEN** se ejecuta `tsc --noEmit` sobre el proyecto web-client
- **THEN** no SHALL haber errores de tipo relacionados con los generadores de código de sprites
