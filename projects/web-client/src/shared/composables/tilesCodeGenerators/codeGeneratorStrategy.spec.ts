// ─── Unit tests for the tiles code-generator strategy helpers ─────────────
//
// Covers the small exported helpers in
// `src/shared/composables/tilesCodeGenerators/codeGeneratorStrategy.ts`:
// `getIncludedTileIndices`, `calculateTilesDataByteCount`, `buildMapFile`,
// and `buildDataSizeComment`.
//
// These are pure functions with no DOM / no Vue, so they're the safest
// place to lock in the per-tile bookkeeping (exclusions, byte accounting,
// the `.cfg` payload shape) before the bigger generator strategies build
// on top of them.

import { describe, expect, it } from "vitest";

import {
  buildDataSizeComment,
  buildMapFile,
  calculateTilesDataByteCount,
  getIncludedTileIndices,
  TilesCodeGeneratorParams,
} from "src/shared/composables/tilesCodeGenerators/codeGeneratorStrategy";

/** Minimal valid {@link TilesCodeGeneratorParams} fixture for the tests. */
function makeParams(
  overrides: Partial<TilesCodeGeneratorParams> & {
    tiles: Partial<TilesCodeGeneratorParams["tiles"]> & {
      count: number;
      tileWidth: number;
      tileHeight: number;
    };
  },
): TilesCodeGeneratorParams {
  const { tiles, ...rest } = overrides;
  return {
    name: rest.name ?? "hud_tiles",
    ...rest,
    tiles: {
      type: "tiles",
      columns: 0,
      previews: [],
      inkBitmaps: [],
      excludedSet: new Set<number>(),
      ...tiles,
    } as TilesCodeGeneratorParams["tiles"],
  };
}

describe("getIncludedTileIndices", () => {
  it("returns every index when no excludedSet is provided", () => {
    // The strategy falls back to an empty Set when `excludedSet` is missing,
    // so every index from 0..count-1 must be returned.
    const params = makeParams({
      tiles: { count: 3, tileWidth: 8, tileHeight: 8 },
    });
    // Cast strips the required `excludedSet` to exercise the runtime fallback.
    (params.tiles as { excludedSet?: Set<number> }).excludedSet = undefined;

    expect(getIncludedTileIndices(params)).toEqual([0, 1, 2]);
  });

  it("drops indices present in excludedSet", () => {
    const params = makeParams({
      tiles: {
        count: 3,
        tileWidth: 8,
        tileHeight: 8,
        excludedSet: new Set([1]),
      },
    });

    expect(getIncludedTileIndices(params)).toEqual([0, 2]);
  });

  it("returns an empty array when every index is excluded", () => {
    const params = makeParams({
      tiles: {
        count: 3,
        tileWidth: 8,
        tileHeight: 8,
        excludedSet: new Set([0, 1, 2]),
      },
    });

    expect(getIncludedTileIndices(params)).toEqual([]);
  });

  it("returns an empty array when count is zero", () => {
    const params = makeParams({
      tiles: { count: 0, tileWidth: 8, tileHeight: 8 },
    });

    expect(getIncludedTileIndices(params)).toEqual([]);
  });
});

describe("calculateTilesDataByteCount", () => {
  it("counts bitmap bytes only for two 8x8 tiles with no attributes", () => {
    // 2 tiles × (ceil(8/8) × 8) = 2 × 8 = 16 bytes.
    const params = makeParams({
      tiles: { count: 2, tileWidth: 8, tileHeight: 8 },
    });

    expect(calculateTilesDataByteCount(params, [0, 1])).toBe(16);
  });

  it("adds one attribute byte per included tile when attributes are present", () => {
    // 16 bitmap bytes + 2 attribute bytes = 18.
    const params = makeParams({
      tiles: {
        count: 2,
        tileWidth: 8,
        tileHeight: 8,
        attributes: [
          { flash: false, bright: false, paper: 0, ink: 7 },
          { flash: false, bright: false, paper: 0, ink: 7 },
        ],
      },
    });

    expect(calculateTilesDataByteCount(params, [0, 1])).toBe(18);
  });

  it("returns zero when no tiles are included", () => {
    const params = makeParams({
      tiles: { count: 2, tileWidth: 8, tileHeight: 8 },
    });

    expect(calculateTilesDataByteCount(params, [])).toBe(0);
  });

  it("counts two bytes per row for a 16x8 tile", () => {
    // 1 tile × (ceil(16/8) × 8) = 1 × 16 = 16 bytes.
    const params = makeParams({
      tiles: { count: 1, tileWidth: 16, tileHeight: 8 },
    });

    expect(calculateTilesDataByteCount(params, [0])).toBe(16);
  });
});

describe("buildMapFile", () => {
  it("returns a map file with type 'tiles' and the expected JSON payload", () => {
    const params = makeParams({
      tiles: { count: 2, tileWidth: 8, tileHeight: 8 },
    });

    const file = buildMapFile(params);

    expect(file.fileType).toBe("map");
    expect(file.fileName).toBe("hud_tiles.cfg");

    const parsed = JSON.parse(file.content);
    expect(parsed).toEqual({
      type: "tiles",
      tileWidth: 8,
      tileHeight: 8,
      excluded: [],
    });
  });
});

describe("buildDataSizeComment", () => {
  it("formats the byte count with the documented prefix", () => {
    expect(buildDataSizeComment(18)).toBe("; Data Size: 18 bytes");
  });
});
