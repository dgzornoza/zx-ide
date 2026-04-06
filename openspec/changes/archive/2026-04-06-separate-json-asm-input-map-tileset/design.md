## Context

extract-map-tileset previously consumed map JSON and a PNG tileset image to render preview and drive extraction. With excluded tiles removed in extract-tiles output, the PNG dependency can create index alignment issues and unnecessary coupling to image assets. The new design uses JSON for map layout and ASM for tile bitmap/attribute payload.

## Goals / Non-Goals

**Goals:**

- Define an explicit two-input contract: JSON map + ASM tile data.
- Parse extract-tiles compatible ASM into tile bitmap and attribute arrays.
- Render preview from decoded tile data and optional attributes.
- Block extraction when map tile references exceed ASM tile count.

**Non-Goals:**

- Reintroducing PNG fallback in extract-map-tileset.
- Supporting broad assembler syntax variations outside current generator conventions.
- Altering bridge message contracts for generated output files.

## Decisions

1. ASM parsing is implemented as a dedicated composable helper.

- Rationale: Keeps parsing concerns isolated and testable, while composable remains orchestration layer.
- Alternative: Inline parser in `useExtractMapTileset`. Rejected due to readability and maintainability cost.

1. Preview rendering uses decoded bitmaps plus optional ZX attribute bytes.

- Rationale: Removes PNG dependency and aligns preview with compacted tile data actually used by extraction.
- Alternative: Keep PNG rendering and only validate against ASM. Rejected because preview could diverge from exported data.

1. Readiness requires both JSON and ASM to be valid.

- Rationale: Prevents partial or misleading preview/extraction state.
- Alternative: Allow JSON-only mode with degraded preview. Rejected to avoid ambiguous behavior.

1. Maximum map index vs ASM tile count is a hard validation gate.

- Rationale: This catches misaligned asset pairs early and avoids generating invalid map references.
- Alternative: Warning-only mode. Rejected due to high risk of silent runtime corruption.

## Risks / Trade-offs

- [Risk] ASM files with unsupported token styles fail parsing.
  - Mitigation: explicit format error messaging and constrained parser contract.
- [Risk] Attribute section may be absent.
  - Mitigation: monochrome fallback colors for preview.
- [Trade-off] Removing PNG fallback reduces flexibility.
  - Mitigation: workflow documentation states required JSON+ASM input pair.

## Migration Plan

1. Add ASM parser utility and decode `defb` bytes into tile bitmaps.
2. Add tile-data-based map preview renderer helper.
3. Refactor extract-map-tileset composable state to JSON+ASM inputs.
4. Update UI to separate JSON source input and ASM data input.
5. Add i18n strings for ASM source hints and validation errors.
6. Verify diagnostics are clean and extraction flow remains compatible.

## Open Questions

- Should future iterations parse attribute labels more strictly to detect malformed sections sooner?
- Should we expose parsed ASM tile count in UI results for faster user troubleshooting?
