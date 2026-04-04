## Context

The *extract-tiles* page in the web-client lets the user load a PNG or ZXP file and export code files (`.h`, `.asm`, `.cfg`) containing tile data. The UI shows a preview of each tile; excluded tiles are rendered with reduced opacity and a red cross (✕). However, the export produces no image file, so the user has no visual reference of the result inside the project.

The goal of this design is to add the generation of a `<name>.png` tile sheet as part of the export, preserving the same grid layout (columns × rows) as the source file and annotating excluded tiles visually.

## Goals / Non-Goals

**Goals:**

- Generate a PNG tile sheet with the same row/column layout as the original source.
- Overlay a red cross on every tile marked as excluded, identical to the one shown in the UI.
- Include the PNG in the downloaded ZIP (standalone mode) and in the `codeFiles` array sent to VS Code.
- Introduce no new external dependencies (use the browser Canvas API only).

**Non-Goals:**

- Exporting individual tiles as separate PNG files.
- Modifying the existing code-generation behaviour (`.h`, `.asm`, `.cfg`).
- Changing the extract-tiles page UI.
- Supporting other image formats (JPEG, BMP, etc.).

## Decisions

### D1 — PNG generation lives in a helper function inside `image-utils.ts`

**Decision**: Add `generateTileSheetPng(tiles, options)` to `src/helpers/image-utils.ts`.

**Rationale**: `image-utils.ts` already contains all Canvas API logic in the project (tile extraction from PNG/ZXP, preview rendering). Keeping the new function there avoids duplicating canvas manipulation and follows the existing pattern.

**Discarded alternative**: Adding the logic directly in `useExtractTiles.ts`. Discarded because it would mix image-rendering logic with composable state management.

### D2 — Each tile is drawn in the PNG from its `previews` data-URL, not recalculated from `inkBitmaps`

**Decision**: Use the data-URLs already stored in `tiles.previews` to render each cell of the tile sheet.

**Rationale**: Previews are already rendered with correct ZX Spectrum colours (including ZXP palette). Recalculating from `inkBitmaps` would require re-applying the colour logic and would duplicate code.

**Discarded alternative**: Redrawing from `inkBitmaps` with a fixed black/white palette. Discarded because ZXP tiles would lose their real colours.

### D3 — The exclusion cross is drawn with red Canvas lines, no SVG or external assets

**Decision**: Overlay two diagonal lines (`strokeStyle = red`, line width 2 px) directly on the tile canvas cell.

**Rationale**: No external resources required. The visual cross is consistent with the ✕ symbol shown in the UI.

### D4 — The tile sheet preserves the same column layout as the source file

For ZXP: `tilesPerRow` exposed by `extractTilesFromZxpFile`. For PNG: `Math.floor(imgWidth / tileWidth)`. Both values must be propagated into the composable state. `TilesModel` is extended with the `columns` field.

### D5 — The new `FileEntry` uses `fileType: "png"`

`"png"` is added to the `fileType` union in `extract-graphics-dtos.ts`. The VS Code extension already receives the `fileName` with a `.png` extension; the `writeFiles` handler can use the `fileName` extension to distinguish the type if needed.

## Risks / Trade-offs

- [Risk] Previews are 40×40 px data-URLs (UI render size), not the original tile size. → **Mitigation**: `generateTileSheetPng` redraws each preview into a cell of the real tile size (`tileWidth × tileHeight`) using scaled `drawImage`. This is straightforward and does not require the original source image.
- [Risk] If the user has not loaded any source, `tiles.previews` may be empty. → **Mitigation**: `extractResources` already guards with `if (!currentImageFile.value)` before calling the generator.
- [Risk] `columns` may not be available when the loaded file is a PNG (not ZXP). → **Mitigation**: For PNG, `columns` is calculated inside `extractTilesFromPng` (already available as local `cols`) and exposed in the return value. `ExtractTilesFromFileResult` is extended with the `columns` field.
