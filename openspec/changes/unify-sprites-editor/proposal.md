## Why

`create-sprites` and `extract-sprites` today render two visually similar but technically independent "Sprites" sections (`SpritesCreatorSection.vue` + `SpriteCreatorItem.vue` versus `SpritesSection.vue` + `SpriteItemDefinition.vue`). They live in different folders, depend on different models (`CreateSpriteDefinition` versus `SpriteDefinition`), and diverge on three concrete capabilities that `create-sprites` is missing:

1. SP1 padding and Use-mask sprite flags (exposed as checkboxes in `extract-sprites`, hardcoded to `0` in `create-sprites`).
2. A per-sprite "Add frame" button (present in `extract-sprites`, absent in `create-sprites`).
3. Editable width/height and X/Y coordinates per frame (editable in `extract-sprites`, locked / hidden in `create-sprites`).

Both flows end up calling the same `createSpritesCodeGenerator` with the same `SpritesCodeGeneratorParams` shape, so the divergence is purely UI-level and easily collapsible.

## What Changes

- Add a new shared component `SpritesEditorSection.vue` (and its sub-component `SpriteEditorItem.vue`) in `src/shared/components/`, built from the existing `extract-sprites` versions. The shared section exposes SP1 padding and Use-mask checkboxes driven by a `spriteFlags` v-model, and emits the same `add-sprite` / `remove-sprite` / `add-frame` / `remove-frame` events already used by `extract-sprites`.
- Unify the runtime data model on `SpriteDefinition` (already in `src/extract-sprites/models/spriteDefinition.ts`) plus an optional `bitmap` field on `SpriteFrame` for sprites created from the binary input panel. `CreateSpriteDefinition` / `CreateSpriteFrame` are removed; their consumers migrate to `SpriteDefinition`.
- Move `SpritesSection.vue` and `SpriteItemDefinition.vue` out of `src/extract-sprites/components/` (deleted) into the shared location. Both pages import the new shared component.
- Update `useCreateSprites` to expose `spriteFlags` state, plumb it into `SpritesCodeGeneratorParams`, and react to the new `add-frame` event by switching the active sprite index and focusing the `BinaryInputPanel`.
- Delete `src/shared/components/SpritesCreatorSection.vue`, `src/shared/components/SpriteCreatorItem.vue` and `src/shared/models/createSpriteDefinition.ts`.
- Update `src/i18n.ts` so `create-sprites` exposes the same labels `extract-sprites` already has for the new controls (`spriteSp1PaddingLabel`, `spriteUseMaskLabel`, `xLabel`, `yLabel`, `addFrame`, plus the relevant tooltips). Adjust `spritesHint` for the new per-sprite button.

## Capabilities

### New Capabilities

- `sprites-editor-section`: Shared section + item components in `src/shared/components/` that render the sprite collection, sprite flags (SP1 padding, Use mask), per-sprite add/remove buttons and per-frame add/remove/X/Y controls, agnostic to where the sprite bitmaps come from.

### Modified Capabilities

- `create-sprites`: The `create-sprites` page reuses `sprites-editor-section`, exposes SP1 padding / Use mask, exposes per-sprite Add frame (sets active sprite + focuses `BinaryInputPanel`), passes `spriteFlags` through `SpritesCodeGeneratorParams`, and migrates its internal model from `CreateSpriteDefinition` to `SpriteDefinition` with optional per-frame bitmap data.

## Impact

- **Components added:** `src/shared/components/SpritesEditorSection.vue`, `src/shared/components/SpriteEditorItem.vue`.
- **Components removed:** `src/shared/components/SpritesCreatorSection.vue`, `src/shared/components/SpriteCreatorItem.vue`, `src/extract-sprites/components/SpritesSection.vue`, `src/extract-sprites/components/SpriteItemDefinition.vue`.
- **Models changed:** `src/extract-sprites/models/spriteDefinition.ts` gains an optional `bitmap` field on `SpriteFrame`. `src/shared/models/createSpriteDefinition.ts` is deleted.
- **Composables changed:** `src/create-sprites/composables/useCreateSprites.ts` gains `spriteFlags`, handles `add-frame`, refactors bitmap storage.
- **App.vue changed:** `src/create-sprites/App.vue` imports the new section and exposes `spriteFlags` via v-model.
- **i18n changed:** `src/i18n.ts` adds SP1 padding / Use mask / X / Y / Add frame keys under `create-sprites` namespace and updates `spritesHint`.

## Non-Goals

- No changes to the `spritesCodeGenerators` strategy or output format. The generator already accepts `SpriteDefinition[]` and a parallel `spriteBitmasks` array; we keep that contract.
- No changes to `BinaryInputPanel.vue` behaviour — it still emits the same `(inkBitmap, width, height, preview)` payload when the user clicks its global Add button.
- No new tests in this change (the project does not currently carry unit tests for these components); visual regression is verified manually by running both pages side-by-side.
- No changes to extract-sprites' source-image pipeline (`extractSpriteFramePreview`, `extractSpritesFromFile`).