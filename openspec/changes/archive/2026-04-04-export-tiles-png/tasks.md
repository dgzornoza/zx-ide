## 1. Models and types

- [x] 1.1 Add `columns` field to `ExtractTilesFromFileResult` in `src/helpers/image-utils.ts`
- [x] 1.2 Add `columns` field to `TilesModel` in `src/extract-tiles/models/tilesDefinition.ts`
- [x] 1.3 Add `"png"` to the `fileType` union in `projects/shared/extract-graphics/extract-graphics-dtos.ts`

## 2. Tile extraction — expose columns

- [x] 2.1 In `extractTilesFromPng` (`image-utils.ts`): include `columns: cols` in the return object
- [x] 2.2 In `extractTilesFromZxpFile` (`image-utils.ts`): include `columns: tilesPerRow` in the return object

## 3. Update composable

- [x] 3.1 In `useExtractTiles.ts`, ZXP branch of `extractTiles()`: assign `state.tiles.columns` from the `extractTilesFromZxpFile` result
- [x] 3.2 In `useExtractTiles.ts`, PNG branch of `extractTiles()`: assign `state.tiles.columns` from the `extractTilesFromPng` result

## 4. Tile sheet PNG generator

- [x] 4.1 Create function `generateTileSheetPng(previews, columns, tileWidth, tileHeight, excludedSet)` in `src/helpers/image-utils.ts` that:
  - Creates a canvas of `columns * tileWidth` × `rows * tileHeight` px
  - Draws each preview into its corresponding cell (scaled to the real tile size)
  - Overlays two red diagonal lines (`strokeStyle red`, `lineWidth 2`) over excluded cells
  - Returns the canvas as a PNG `Blob` (`canvas.toBlob`)

## 5. Integrate into extractResources

- [x] 5.1 In `useExtractTiles.ts`, `extractResources()` function: call `generateTileSheetPng` after building `codeFiles`
- [x] 5.2 Append the PNG `FileEntry` to the `codeFiles` array with `fileType: "png"` and `fileName: "<name>.png"`
- [x] 5.3 Verify the PNG is included in the ZIP (standalone mode) — no additional changes needed since the loop already iterates `codeFiles`
- [x] 5.4 Verify the PNG is sent in the `writeFiles` message to VS Code (extension mode) — same reason

## 6. Manual verification

- [x] 6.1 Load a test PNG, exclude a tile and export: verify the ZIP contains `<name>.png` with a cross over excluded tiles
- [x] 6.2 Load a test ZXP, exclude a tile and export: verify the PNG columns match those of the original ZXP file
- [x] 6.3 Verify that existing code files (`.h`, `.asm`, `.cfg`) are not affected
