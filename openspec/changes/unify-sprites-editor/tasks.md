## 1. Move sprite model to shared

- [x] 1.1 Move `src/extract-sprites/models/spriteDefinition.ts` to `src/shared/models/spriteDefinition.ts`. Update all import paths in `src/extract-sprites/`, `src/shared/composables/spritesCodeGenerators/`, and any other consumer.
- [x] 1.2 Add an optional `bitmap?: SpriteFrameBitmap` field to `SpriteFrame` with an inline JSDoc explaining it is set only by `create-sprites`.
- [x] 1.3 Run `npm run typecheck` from `projects/web-client/` and confirm zero errors.

## 2. Build shared `SpritesEditorSection` component

- [x] 2.1 Create `src/shared/components/SpriteEditorItem.vue` from the current `src/extract-sprites/components/SpriteItemDefinition.vue`. Accept `sprite: SpriteDefinition`, `spriteIndex: number`, `sourceImage: File | null`, `showFrameCoords: boolean`. Emit `remove`, `add-frame`, `remove-frame`.
- [x] 2.2 When `showFrameCoords=false`, render the frame rows with the X/Y inputs replaced by empty placeholder cells (so the grid stays aligned) and show the thumbnail from `frame.bitmap?.preview` if present.
- [x] 2.3 When `sourceImage=null`, derive the thumbnail from `frame.bitmap?.preview` instead of calling `extractSpriteFramePreview`.
- [x] 2.4 Hide the per-sprite "Add frame" button when `showFrameCoords=false` only if the page wants to opt out. By default keep the button; the parent decides whether it produces an empty frame or just signals an intent.
- [x] 2.5 Create `src/shared/components/SpritesEditorSection.vue` from the current `src/extract-sprites/components/SpritesSection.vue`. Accept `sprites`, `sourceImage`, `showFrameCoords`, `newSpriteDefaults`. Expose `spriteFlags` via `defineModel`. Render SP1 padding + Use-mask checkboxes via `TypeEnumHelpers`.
- [x] 2.6 Verify neither shared component imports anything from `src/extract-sprites/`.

## 3. Migrate extract-sprites to the shared component

- [x] 3.1 Update `src/extract-sprites/App.vue` to import `SpritesEditorSection` from `src/shared/components/`.
- [x] 3.2 Update `src/extract-sprites/composables/useExtractSprites.ts` import paths for the moved model.
- [x] 3.3 Delete `src/extract-sprites/components/SpritesSection.vue` and `src/extract-sprites/components/SpriteItemDefinition.vue`.
- [x] 3.4 Run `npm run typecheck` and a manual smoke test in dev: add a sprite, add frames, toggle both flags, generate code.

## 4. Migrate create-sprites to the shared component and new model

- [x] 4.1 Delete `src/shared/components/SpritesCreatorSection.vue` and `src/shared/components/SpriteCreatorItem.vue`.
- [x] 4.2 Delete `src/shared/models/createSpriteDefinition.ts`.
- [x] 4.3 Rewrite `src/create-sprites/composables/useCreateSprites.ts`:
  - Replace `CreateSpriteDefinition` references with `SpriteDefinition`.
  - Store the binary bitmap on `sprite.frames[i].bitmap` instead of a parallel field.
  - Expose `spriteFlags` (number ref) and pass it to `SpritesCodeGeneratorParams`.
  - Add `addSpriteFrame(spriteIndex)` that sets `activeSpriteIndex.value = spriteIndex` (no empty frame is appended).
  - Derive `spriteBitmasks` for the generator from `sprite.frames[i].bitmap?.inkBitmap`.
- [x] 4.4 Update `src/create-sprites/App.vue` to import `SpritesEditorSection` and bind `spriteFlags` via v-model. Pass `:show-frame-coords="false"` and `:source-image="null"`. Add a template ref to the `BinaryInputPanel` and focus its textarea on `add-frame`.
- [x] 4.5 Update `src/i18n.ts`:
  - Add `create-sprites.spriteSp1PaddingLabel`, `spriteSp1PaddingTooltip`, `spriteUseMaskLabel`, `spriteUseMaskTooltip`, `xLabel`, `yLabel`, `addFrame`, `activeSpriteBadge` (for the active highlight).
  - Update `create-sprites.spritesHint` to explain the two-step flow ("Click Add frame on a sprite, then enter binary and click Add").
  - Add the matching Spanish translations.
- [x] 4.6 Run `npm run typecheck` and a manual smoke test: add two sprites, mark one active, type a binary matrix, click Add, toggle SP1 padding, generate code, verify the resulting code/zip contains the flag.

## 5. Final cleanup

- [x] 5.1 `grep -r "CreateSpriteDefinition\|SpritesCreatorSection\|SpriteCreatorItem" projects/web-client/src` returns no matches.
- [x] 5.2 `grep -r "extract-sprites/components/SpritesSection\|extract-sprites/components/SpriteItemDefinition" projects/web-client/src` returns no matches.
- [x] 5.3 Run `npm run typecheck` from `projects/web-client/` and confirm zero errors.
- [x] 5.4 Run `npm run build` from `projects/web-client/` and confirm the bundles for both entry points still build.
- [x] 5.5 Visually compare `create-sprites` and `extract-sprites` side-by-side: section header, flag checkboxes, per-sprite card layout, animation panel, X/Y inputs visibility, Add frame button behaviour.