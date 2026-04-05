## Why

When exporting tile resources, the user only receives code files (.h, .asm, .cfg) but no visual representation of the tiles as they were configured. Adding an exported PNG image lets the user visually review the result and use it as a reference inside the project without having to reopen the tool.

## What Changes

- When running the export on the *extract-tiles* page, in addition to the code files, a `.png` file will be generated containing all tiles arranged in the same grid (rows × columns) as the source `.zxp` or original PNG.
- Tiles marked as excluded will appear in the PNG with a red cross overlay, identical to the one shown in the web preview.
- The PNG file will be included in the downloaded ZIP (standalone mode) and in the `writeFiles` message sent to VS Code (extension mode).

## Capabilities

### New Capabilities

- `tiles-png-export`: Generation of a PNG tile sheet image that includes the full grid with visual exclusion markers (red cross) over deleted tiles.

### Modified Capabilities

<!-- none -->

## Impact

- `projects/web-client/src/extract-tiles/composables/useExtractTiles.ts` — `extractResources()` must include the generated PNG in the output files.
- `projects/web-client/src/extract-tiles/composables/codeGenerators/codeGeneratorStrategy.ts` — possible addition of a shared utility to build the image.
- `projects/web-client/src/helpers/image-utils.ts` — new public function to render the tile sheet PNG with exclusion markers.
- `projects/shared/infrastructure.ts` / `extract-graphics-dtos.ts` — `FileEntry.fileType` may need a new value (`"png"`) if it does not already exist.
- No changes to the VS Code message API (only one extra `FileEntry` is appended to the `codeFiles` array).
