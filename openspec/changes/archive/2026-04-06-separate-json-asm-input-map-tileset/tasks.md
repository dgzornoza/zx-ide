## 1. Source Contract Migration

- [x] 1.1 Introduce explicit JSON map input and ASM tile-data input in extract-map-tileset UI
- [x] 1.2 Remove PNG dependency from extract-map-tileset source flow
- [x] 1.3 Ensure readiness state requires both valid JSON and valid ASM sources

## 2. ASM Parsing and Validation

- [x] 2.1 Add ASM parser utility for extract-tiles compatible `defb` byte lines
- [x] 2.2 Decode tile bytes into per-tile bitmaps using JSON tile dimensions
- [x] 2.3 Parse optional `_tiles_attributes` bytes and expose them to preview rendering
- [x] 2.4 Add hard validation for max map tile index vs parsed ASM tile count

## 3. Preview Rendering

- [x] 3.1 Add helper to render map preview from decoded tile bitmaps
- [x] 3.2 Apply ZX attribute palette where available, with safe fallback when absent
- [x] 3.3 Update map preview component to remove PNG state dependency

## 4. UX and Localization

- [x] 4.1 Update source labels/hints to describe JSON and ASM inputs clearly
- [x] 4.2 Add ASM-specific validation error keys/messages in English and Spanish
- [x] 4.3 Preserve existing extraction action behavior for generated map outputs

## 5. Validation and Quality

- [x] 5.1 Resolve static diagnostics introduced by parser and preview changes
- [x] 5.2 Verify modified files have no outstanding compile/lint diagnostics
- [x] 5.3 Run functional smoke test with real JSON+ASM pair in webview
