## Context

El proyecto ya cuenta con `create-tiles`, que permite diseñar *tiles* manualmente mediante matrices binarias. La arquitectura de `create-tiles` introdujo componentes compartidos (`BinaryInputPanel.vue`, `CodeGenerationSelector.vue`, `TileGallery.vue`) y movió los generadores de código de tiles a `src/shared/composables/tilesCodeGenerators/`.

Para `create-sprites` la estructura de UI es similar pero la sección inferior difiere: en lugar de una galería plana de tiles, se necesita una jerarquía sprite → frames, análoga a la que ya existe en `extract-sprites` (componentes `SpritesSection.vue` y `SpriteItemDefinition.vue`). Sin embargo, esos componentes están acoplados a `extract-sprites` (importan modelos y helpers propios de ese módulo) y no pueden importarse directamente desde `create-sprites` sin romper el desacoplamiento horizontal requerido.

Los generadores de código de sprites también residen actualmente en `src/extract-sprites/composables/codeGenerators/`, por lo que deben moverse a `src/shared/` para ser consumibles desde `create-sprites`.

## Goals / Non-Goals

**Goals:**

- Implementar `create-sprites` reutilizando `BinaryInputPanel.vue` y `CodeGenerationSelector.vue` tal cual.
- Crear un componente compartido `SpritesCreatorSection.vue` (y su sub-componente `SpriteCreatorItem.vue`) en `src/shared/components/` para gestionar la colección de sprites y sus frames de forma desacoplada.
- Mover los generadores de código de sprites a `src/shared/composables/spritesCodeGenerators/` para eliminar el acoplamiento horizontal.
- Definir un modelo `CreateSpriteDefinition` en `src/shared/models/` que represente un sprite en tiempo de ejecución (bitmasks de frames ya extraídos, sin coordenadas de imagen fuente).
- Mantener `extract-sprites` funcionando sin cambios observables (solo mover/re-exportar generadores).

**Non-Goals:**

- Soporte de color o atributos ZX Spectrum.
- Implementar animación de sprites como feature separada desde cero. Si `SpriteCreatorItem.vue` la incluye de forma natural ciclando por los `frame.preview` ya precalculados (sin extracción desde imagen), es aceptable.
- Modificar la lógica de `extract-sprites` más allá del refactor de generadores.
- Importar desde `extract-sprites` dentro de `create-sprites` (desacoplamiento estricto).

## Decisions

### 1. Modelo runtime para sprites creados manualmente

Se crea `CreateSpriteDefinition` en `src/shared/models/createSpriteDefinition.ts`:

```ts
export interface CreateSpriteFrame {
  inkBitmap: boolean[];   // row-major, length = width × height
  preview: string;        // data-URL de la miniatura pixelada
}

export interface CreateSpriteDefinition {
  _id: string;            // UUID para clave estable en v-for
  name: string;
  width: number;          // fijado al insertar el primer frame
  height: number;
  frames: CreateSpriteFrame[];
}
```

**Alternativa descartada:** reutilizar `SpriteDefinition` de `extract-sprites` (incluye coordenadas `x`/`y` que no tienen sentido en el flujo manual).

### 2. Componente `SpritesCreatorSection.vue` en shared

El componente recibe `sprites: CreateSpriteDefinition[]` via props y emite eventos (`add-sprite`, `remove-sprite`, `add-frame`, `remove-frame`). No importa nada de `extract-sprites`. Internamente delega cada sprite a `SpriteCreatorItem.vue` (también en `src/shared/components/`).

**Alternativa descartada:** reutilizar `SpritesSection.vue`/`SpriteItemDefinition.vue` directamente — están acoplados a modelos y helpers de `extract-sprites` y mostrarían campos irrelevantes (coordenadas x/y, imagen fuente).

### 3. Integración de "Añadir frame" con `BinaryInputPanel`

El evento `@add` de `BinaryInputPanel` emite `(inkBitmap, width, height, preview)`. En `useCreateSprites`, si hay un sprite activo (o se crea uno nuevo automáticamente), ese payload se convierte en un `CreateSpriteFrame` y se añade al sprite seleccionado. Se añade estado `activeSprite` (índice) en el composable.

### 4. Mover generadores de sprites a shared

Los archivos de `src/extract-sprites/composables/codeGenerators/` se mueven a `src/shared/composables/spritesCodeGenerators/`. `extract-sprites` actualizará sus importaciones para apuntar a la nueva ubicación. La interfaz pública (`SpritesCodeGeneratorParams`, `createSpritesCodeGenerator`) no cambia.

**Alternativa descartada:** copiar los generadores — genera duplicación de código.

### 5. Generación de código en `create-sprites`

El composable `useCreateSprites` construirá `SpritesCodeGeneratorParams` directamente desde `CreateSpriteDefinition[]` (los `inkBitmap` de cada frame se usan como `spriteBitmasks[i][j]`). No se necesita extraer bitmasks desde imagen PNG.

## Risks / Trade-offs

- **Riesgo:** Al mover los generadores de sprites puede haber rutas de importación que fallen en `extract-sprites`.
  - **Mitigación:** Actualizar todas las importaciones en `extract-sprites` en la misma tarea de refactor y verificar con `tsc --noEmit`.
- **Riesgo:** Las dimensiones del frame (width × height) se fijan al añadir el primer frame de cada sprite. Si el usuario cambia el tamaño en frames posteriores, habrá inconsistencia visual.
  - **Mitigación:** `BinaryInputPanel` ya valida que todas las filas tengan el mismo largo. El composable rechazará (con mensaje de error) frames cuyas dimensiones no coincidan con el primer frame del sprite activo.
- **Riesgo:** La generación de código espera `SpriteDefinition` con coordenadas `x`/`y` en `SpritesCodeGeneratorParams`.
  - **Mitigación:** Adaptar `SpritesCodeGeneratorParams` para que `sprites` acepte también el modelo simplificado, o construir objetos `SpriteDefinition` dummy (x=0, y=0) solo para satisfacer la interfaz del generador existente.
