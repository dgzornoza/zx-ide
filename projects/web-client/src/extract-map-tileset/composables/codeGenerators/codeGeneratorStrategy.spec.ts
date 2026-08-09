// ─── Unit tests for the map tileset code-generator strategy helpers ───────
//
// Covers the three exported helpers in
// `src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy.ts`:
// `buildHeader`, `calculateMapDataByteCount`, and `buildDataSizeComment`.
//
// These are tiny pure helpers, but pinning their output keeps the file-
// header text and the byte-counting formula stable across future
// refactors of the C/ASM map generators that build on top of them.

import { describe, expect, it } from "vitest";

import {
  buildDataSizeComment,
  buildHeader,
  calculateMapDataByteCount,
  MapCodeGeneratorParams,
} from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy";

function makeParams(
  overrides: Partial<MapCodeGeneratorParams> = {},
): MapCodeGeneratorParams {
  return {
    name: "hud_map",
    tileIndices: [1, 2, 3, 4, 5, 6, 7, 8],
    metadata: {
      mapWidth: 4,
      mapHeight: 2,
      tileWidth: 8,
      tileHeight: 8,
      tilesetName: "hud-tiles",
      tileCount: 64,
      columns: 16,
      sourceImage: "hud-tiles.png",
    },
    ...overrides,
  };
}

describe("buildHeader", () => {
  it("emits the documented 'Map: name (W x H tiles)' prefix", () => {
    // Exact string match — the C generator splits off the leading `; ` to
    // reuse it as a `//` comment, so any silent change to the separator
    // breaks both the .h and the .asm output simultaneously.
    expect(buildHeader("hud_map", 4, 2)).toBe("; Map: hud_map  (4 x 2 tiles)");
  });
});

describe("calculateMapDataByteCount", () => {
  it("returns width × height from the metadata", () => {
    expect(calculateMapDataByteCount(makeParams())).toBe(8);
  });
});

describe("buildDataSizeComment", () => {
  it("formats the byte count with the documented prefix", () => {
    expect(buildDataSizeComment(8)).toBe("; Data Size: 8 bytes");
  });
});
