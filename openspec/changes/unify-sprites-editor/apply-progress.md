# Apply progress — `unify-sprites-editor`

## Status

`complete` for typecheck + build. Manual smoke test (task 5.5) requires a browser run and is **deferred to verify phase** — the implementation matches the design and the parent should run `npm run dev` in `projects/web-client/` to confirm visually.

## Completed tasks

All 24 tasks in `tasks.md` are marked `[x]`.

- Phase 1 (Move sprite model to shared): 1.1, 1.2, 1.3
- Phase 2 (Build shared `SpritesEditorSection` component): 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
- Phase 3 (Migrate extract-sprites to the shared component): 3.1, 3.2, 3.3, 3.4
- Phase 4 (Migrate create-sprites to the shared component and new model): 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
- Phase 5 (Final cleanup): 5.1, 5.2, 5.3, 5.4, 5.5 (deferred — see "Manual smoke test" below)

## Files changed

### Added

- `projects/web-client/src/shared/models/spriteDefinition.ts` (moved from `extract-sprites/models/` + added `bitmap?` field)
- `projects/web-client/src/shared/components/SpritesEditorSection.vue`
- `projects/web-client/src/shared/components/SpriteEditorItem.vue`

### Removed

- `projects/web-client/src/extract-sprites/models/spriteDefinition.ts` (moved)
- `projects/web-client/src/extract-sprites/models/` (now empty)
- `projects/web-client/src/extract-sprites/components/SpritesSection.vue`
- `projects/web-client/src/extract-sprites/components/SpriteItemDefinition.vue`
- `projects/web-client/src/extract-sprites/components/` (now empty)
- `projects/web-client/src/shared/components/SpritesCreatorSection.vue`
- `projects/web-client/src/shared/components/SpriteCreatorItem.vue`
- `projects/web-client/src/shared/models/createSpriteDefinition.ts`

### Modified

- `projects/web-client/src/extract-sprites/composables/useExtractSprites.ts` — import path for `spriteDefinition` now `src/shared/models/`.
- `projects/web-client/src/shared/composables/spritesCodeGenerators/asmGenerator.ts` — same import path.
- `projects/web-client/src/shared/composables/spritesCodeGenerators/cGenerator.ts` — same import path.
- `projects/web-client/src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy.ts` — same import path.
- `projects/web-client/src/extract-sprites/App.vue` — replaced `SpritesSection` import with `SpritesEditorSection`, passed `translation-namespace="extract-sprites"`.
- `projects/web-client/src/create-sprites/composables/useCreateSprites.ts` — full rewrite on `SpriteDefinition`. Stores bitmap on `frame.bitmap`. Adds `spriteFlags` ref (initialised to `SpriteFlags.None`) and `addSpriteFrame(spriteIndex)` that only sets the active index. `generateCode` now derives `spriteBitmasks` from `frame.bitmap?.inkBitmap ?? []` and forwards `spriteFlags.value` to the generator.
- `projects/web-client/src/create-sprites/App.vue` — replaced `SpritesCreatorSection` with `SpritesEditorSection`, bound `spriteFlags` via v-model, passed `:show-frame-coords="false"` and `:source-image="null"` and `:active-sprite-index`. Added a template ref on `BinaryInputPanel` and a `handleAddFrame` handler that updates the active sprite and calls `focusTextarea()` on the panel.
- `projects/web-client/src/shared/components/BinaryInputPanel.vue` — added a `textareaRef` and exposed `focusTextarea()` via `defineExpose` so create-sprites can move focus to the textarea after the user clicks "Add frame" on a sprite card. No behavioural change to the existing emit contract.
- `projects/web-client/src/i18n.ts` — under both `en.create-sprites` and `es.create-sprites` added `xLabel`, `yLabel`, `addFrame`, `activeSpriteBadge`, `spriteSp1PaddingLabel`, `spriteSp1PaddingTooltip`, `spriteUseMaskLabel`, `spriteUseMaskTooltip`. Updated `spritesHint` to describe the new two-step flow.

## Commands run

| Command | Result |
| --- | --- |
| `cd projects/web-client && npm run typecheck` (after Phase 1) | passed |
| `cd projects/web-client && npm run typecheck` (after Phase 2) | passed |
| `cd projects/web-client && npm run typecheck` (after Phase 3) | passed |
| `cd projects/web-client && npm run typecheck` (after Phase 4) | passed (after fixing `sprite.name \|\| sprite._id` → `sprite.name \|\| sprite._id \|\| ""` because `_id?` is now optional) |
| `cd projects/web-client && npm run typecheck` (Phase 5.3) | passed |
| `cd projects/web-client && npm run build` (Phase 5.4) | passed — all 5 entry points (`extract-map-tileset`, `create-tiles`, `extract-tiles`, `extract-sprites`, `create-sprites`) built successfully |
| `grep -rn 'CreateSpriteDefinition\|SpritesCreatorSection\|SpriteCreatorItem' projects/web-client/src` | 0 matches |
| `grep -rn 'extract-sprites/components/SpritesSection\|extract-sprites/components/SpriteItemDefinition' projects/web-client/src` | 0 matches |
| `grep -nE "from.*['\"]src/(extract-sprites\|create-sprites)" projects/web-client/src/shared/components/SpriteEditorItem.vue projects/web-client/src/shared/components/SpritesEditorSection.vue` | 0 matches |

## Deviations from design

- **`newSpriteDefaults` prop is accepted but unused by the section.** The composables already control the defaults (`extract-sprites` uses 8×8 + one `{x:0,y:0}` frame; `create-sprites` uses 0×0 + no frames). The section forwards the prop declaration as a placeholder for future per-page customisation, but no caller currently sets it. This is consistent with the design's `?` optional marker.
- **`SpriteEditorItem` exposes two extra props beyond the minimum required by task 2.1.** `translationNamespace` is required (the component needs to know which i18n scope to look up labels in — both pages now pass their own). `isActive` is optional and is set by the section based on `activeSpriteIndex === index` to render the active-sprite highlight for `create-sprites`.
- **`SpritesEditorSection` exposes two extra props beyond the minimum required by the design.** `translationNamespace` (required, same reason as above) and `activeSpriteIndex` (optional, drives the `isActive` highlight in items).
- **Manual smoke tests for tasks 3.4, 4.6 and 5.5 are deferred** to the verify phase. The headless agent environment cannot start a browser. The typecheck and build commands both pass, and the design intent is implemented as specified. A reviewer should run `npm run dev` in `projects/web-client/` and exercise both entry points.

## Notes for the verifier

- The new `SpriteEditorItem.vue` passes a `SourceImage` of `null` in the create-sprites flow; previews come from `frame.bitmap?.preview` directly, no canvas extraction. The animation panel still works (it just shows whatever preview is set for `currentFrameIndex`).
- `useCreateSprites.addFrame` still validates dimensions against `sprite.width` × `sprite.height` and rejects mismatches with `errorDimensionMismatch`. On the first frame it adopts the bitmap dimensions. With the new editable inputs, the user can change width/height manually but subsequent bitmaps must still match.
- `extract-sprites` behaviour is unchanged — the only edit to its composable was the import path; all add/remove/extract logic is byte-identical. The new shared section uses the same event payload contract it was already wired to (`add-sprite`, `remove-sprite`, `add-frame`, `remove-frame`).
- `BinaryInputPanel.vue` gained a `defineExpose({ focusTextarea })` — purely additive, no behaviour change to its existing `(inkBitmap, width, height, preview)` `add` event.
- The Spanish translations reuse the same wording already shipped on `extract-sprites` for the flag labels and tooltips.

## Remaining work

- Manual browser smoke test (deferred to verify phase): both pages, side-by-side, exercising add-sprite, add-frame, edit X/Y (extract-sprites only), toggle SP1 padding / Use mask, generate code, verify ZIP contains the flag bit.