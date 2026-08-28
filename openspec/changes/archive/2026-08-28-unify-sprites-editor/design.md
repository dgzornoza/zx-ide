## Context

The web-client today ships two parallel "Sprites" editors:

- `src/shared/components/SpritesCreatorSection.vue` (used by `create-sprites`).
- `src/extract-sprites/components/SpritesSection.vue` (used by `extract-sprites`).

Both render the same 5-column grid layout (`1.4fr 0.2fr 0.2fr auto 10rem`) with name/width/height/animation panel and frame thumbnails. Both delegate animation playback to `useSpriteAnimation` + `SpriteAnimationPanel` and thumbnails to `SpriteFrameThumbnail`. The differences are confined to three areas: sprite flags UI (SP1 padding, Use mask), per-frame X/Y inputs, and the "Add frame" button placement.

Both flows reach the same `createSpritesCodeGenerator` with the same `SpritesCodeGeneratorParams` shape (`{ name, sprites: SpriteDefinition[], spriteFlags, spriteBitmasks }`). `useCreateSprites` already fabricates dummy `SpriteDefinition` entries with `x:0, y:0` at generation time and feeds the real bitmaps through the parallel `spriteBitmasks` array. That means the code-generation contract already accepts both flavours.

The aim of this change is to collapse the UI divergence into a single shared component, and to collapse the runtime model into a single `SpriteDefinition` shape so both pages can share the same component without ad-hoc wrappers.

## Goals / Non-Goals

**Goals**

- One `SpritesEditorSection.vue` + `SpriteEditorItem.vue` pair in `src/shared/components/`, used by both pages.
- Single runtime model: `SpriteDefinition` + `SpriteFrame`, with an optional `bitmap` field for binary-input frames.
- Same SP1 padding / Use mask / X / Y / Add frame UX in both pages.
- `create-sprites` gains per-sprite Add frame as a UX accelerator (sets active sprite + focuses `BinaryInputPanel`) without changing what the binary input does today.

**Non-Goals**

- No changes to the code-generator output, the DTO contract, or the `BinaryInputPanel` API.
- No changes to `extract-sprites`' source-image pipeline.
- No introduction of placeholder frames: every frame has either a real bitmap (create-sprites) or real X/Y coordinates (extract-sprites).

## Decisions

### 1. Adopt `SpriteDefinition` as the single runtime model

`SpriteDefinition` and `SpriteFrame` already live in `src/extract-sprites/models/spriteDefinition.ts`. We extend `SpriteFrame` with an optional `bitmap` field:

```ts
export interface SpriteFrameBitmap {
  /** Row-major ink bitmap, length = width × height. true = ink pixel. */
  inkBitmap: boolean[];
  /** Data-URL of the pixelated preview (PNG). */
  preview: string;
}

export interface SpriteFrame {
  x: number;
  y: number;
  /** Optional bitmap payload for sprites built from binary input. */
  bitmap?: SpriteFrameBitmap;
}
```

`CreateSpriteDefinition` and `CreateSpriteFrame` are deleted. `useCreateSprites` builds `SpriteDefinition` instances with `frames: [{ x: 0, y: 0, bitmap: {...} }]` when the user adds a frame via `BinaryInputPanel`. The parallel `spriteBitmasks` array passed to the generator is derived from these `bitmap` fields.

**Rejected alternative:** Keep `CreateSpriteDefinition` as a sibling model and pass a discriminated union to the shared component. Rejected because it forces the component to handle two shapes and weakens type safety downstream.

**Rejected alternative:** Store bitmaps in a parallel `Map<frameId, bitmap>` outside the sprite model. Rejected because bitmaps are intrinsic to a frame — keeping them attached to the frame simplifies lifecycle (splice / remove / serialize) and keeps the model the generator already understands.

### 2. `SpritesEditorSection.vue` API

```ts
defineProps<{
  sprites: SpriteDefinition[];
  sourceImage: File | null;          // null in create-sprites
  showFrameCoords?: boolean;         // default true; false in create-sprites
  /** Custom creation defaults when the user presses "Add sprite". */
  newSpriteDefaults?: { width?: number; height?: number };
}>();

const spriteFlags = defineModel<number>("spriteFlags", { required: true });

defineEmits<{
  "add-sprite": [];
  "remove-sprite": [index: number];
  "add-frame": [spriteIndex: number];
  "remove-frame": [spriteIndex: number, frameIndex: number];
}>();
```

- `showFrameCoords=false` hides the X/Y inputs and replaces them with empty placeholder cells so the grid stays aligned. `create-sprites` passes `false` because the bitmap entered from `BinaryInputPanel` carries no source-image coordinates.
- `sourceImage=null` disables preview extraction; the component falls back to `frame.bitmap?.preview` for thumbnails.
- The shared component imports nothing from `src/extract-sprites/`; the type import comes from `src/shared/models/spriteDefinition` (moved from `src/extract-sprites/models/`).

### 3. Where the model lives

`SpriteDefinition` and `SpriteFlags` move from `src/extract-sprites/models/spriteDefinition.ts` to `src/shared/models/spriteDefinition.ts`. All import sites in `src/extract-sprites/` and `src/shared/composables/spritesCodeGenerators/` update their paths. This is consistent with the existing pattern (the prior change moved the sprite code generators to `src/shared/` for the same reason).

### 4. "Add frame" UX in create-sprites (Option B)

Per-sprite "Add frame" in `create-sprites`:

1. Emits `add-frame(spriteIndex)`.
2. `useCreateSprites` updates `activeSpriteIndex.value = spriteIndex`.
3. `useCreateSprites` exposes an `activeSpriteIndex` ref so the section can render a visual indicator on the active sprite card (border highlight + "Active" badge).
4. The page-level template adds a small ref / focus call to scroll the `BinaryInputPanel` into view (and focus its textarea) when `add-frame` fires from `create-sprites`.

This way the per-sprite button never produces an empty frame: the user is always guided to the binary input, which remains the only path that creates a real frame. The "active sprite" concept that already existed in `useCreateSprites` becomes visible to the user instead of being implicit.

`extract-sprites` keeps its current behaviour: per-sprite Add frame appends `{x:0, y:0}` directly.

### 5. Width/Height auto-fill on first frame (create-sprites)

Today, `useCreateSprites` locks the sprite's `width`/`height` to the first frame's dimensions and rejects subsequent frames that don't match (with `errorDimensionMismatch`). With the new component, width/height are editable inputs. We preserve the existing guard: the composable still validates the bitmap dimensions against `sprite.width` / `sprite.height` and refuses mismatches. The visible width/height inputs become editable, but the validation message tells the user to align the binary input dimensions with the existing sprite before clicking Add.

### 6. Component deletion order

To avoid leaving dangling references, the order of operations is:

1. Create new `SpritesEditorSection.vue` and `SpriteEditorItem.vue` in `src/shared/components/`.
2. Update `useExtractSprites` and `extract-sprites/App.vue` to import the shared component; delete `extract-sprites/components/SpritesSection.vue` and `SpriteItemDefinition.vue`.
3. Update `useCreateSprites` and `create-sprites/App.vue` to import the shared component; delete `SpritesCreatorSection.vue` and `SpriteCreatorItem.vue`.
4. Move `SpriteDefinition` to `src/shared/models/`, update all imports.
5. Extend `SpriteFrame` with `bitmap?`, update `CreateSpriteDefinition` callers, delete `CreateSpriteDefinition`.

Each step is independently verifiable with `npm run typecheck` from `projects/web-client/`.

## Risks / Trade-offs

- **Risk:** Moving `SpriteDefinition` to `src/shared/models/` may break import paths in tests or in the extension side. **Mitigation:** `grep` for any `extract-sprites/models/spriteDefinition` import before deleting the old file. The DTO module in `projects/shared/extract-graphics/` is unrelated (separate namespace).
- **Risk:** A user adding a frame via per-sprite Add in `create-sprites` may not realise they still need to type in the binary input panel. **Mitigation:** the focus + scroll behaviour + visible active-sprite highlight make the next action obvious. The `spritesHint` copy is updated to explain the two-step flow.
- **Risk:** With editable width/height, a user could break a sprite's bitmaps by changing width after frames are added. **Mitigation:** composable validation refuses mismatched bitmaps (`errorDimensionMismatch`), and the hint explains that width/height must match the first frame.
- **Risk:** OpenSpec archive flow expects capability IDs to remain stable. We do not delete the `sprites-creator-section` capability from `openspec/specs/`; we add `sprites-editor-section` as a new capability and leave the old one as historical context. `create-sprites` is the only capability with MODIFIED requirements.