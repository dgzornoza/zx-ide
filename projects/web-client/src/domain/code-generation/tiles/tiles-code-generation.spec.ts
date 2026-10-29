// Unit tests for the tiles code-generator strategy helpers
//
// Covers the small exported helpers in
// `src/domain/code-generation/tiles/tiles-code-generation.ts`:
// `getIncludedTileIndices`, `calculateTilesDataByteCount`, `buildMapFile`,
//.
//
// These are pure functions with no DOM / no Vue, so they're the safest
// place to lock in the per-tile bookkeeping (exclusions, byte accounting,
// the `.cfg` payload shape) before the bigger generator strategies build
// on top of them.

import { describe, expect, it } from 'vitest';

import {
  buildMapFile,
  calculateTilesDataByteCount,
  getIncludedTileIndices,
  TilesCodeGeneratorParameters,
} from 'src/domain/code-generation/tiles/tiles-code-generation';
import { makeTilesModel } from 'src/test-utils/builders';

/** Minimal valid {@link TilesCodeGeneratorParameters} fixture for the tests. */
function makeParameters(
  overrides: Omit<Partial<TilesCodeGeneratorParameters>, 'tiles'> & {
    tiles?: Partial<TilesCodeGeneratorParameters['tiles']>;
  } = {}
): TilesCodeGeneratorParameters {
  const { tiles, ...rest } = overrides;
  return {
    name: 'hud_tiles',
    ...rest,
    tiles: makeTilesModel(tiles ?? {}),
  };
}

describe('getIncludedTileIndices', () => {
  it('returns every index when no excludedSet is provided', () => {
    // The strategy falls back to an empty Set when `excludedSet` is missing,
    // so every index from 0..count-1 must be returned. Cast the post-build
    // assignment to `undefined` so the runtime `??` fallback is the path
    // actually exercised (the builder's default would otherwise ship a
    // non-undefined empty Set and shadow the fallback).
    const parameters = makeParameters({ tiles: { count: 3 } });
    (parameters.tiles as { excludedSet?: Set<number> }).excludedSet = undefined;

    expect(getIncludedTileIndices(parameters)).toEqual([0, 1, 2]);
  });

  it('drops indices present in excludedSet', () => {
    const parameters = makeParameters({
      tiles: { count: 3, excludedSet: new Set([1]) },
    });

    expect(getIncludedTileIndices(parameters)).toEqual([0, 2]);
  });

  it('returns an empty array when every index is excluded', () => {
    const parameters = makeParameters({
      tiles: { count: 3, excludedSet: new Set([0, 1, 2]) },
    });

    expect(getIncludedTileIndices(parameters)).toEqual([]);
  });

  it('returns an empty array when count is zero', () => {
    const parameters = makeParameters({ tiles: { count: 0 } });

    expect(getIncludedTileIndices(parameters)).toEqual([]);
  });
});

describe('calculateTilesDataByteCount', () => {
  it('counts bitmap bytes only for two 8x8 tiles with no attributes', () => {
    // 2 tiles × (ceil(8/8) × 8) = 2 × 8 = 16 bytes. Override the
    // builder's default attribute array so the `hasAttributes` branch
    // is genuinely false.
    const parameters = makeParameters({
      tiles: { attributes: undefined },
    });

    expect(calculateTilesDataByteCount(parameters, [0, 1])).toBe(16);
  });

  it('adds one attribute byte per included tile when attributes are present', () => {
    // 16 bitmap bytes + 2 attribute bytes = 18. The builder default
    // already ships 2 attributes, so no override is needed for this case.
    const parameters = makeParameters();

    expect(calculateTilesDataByteCount(parameters, [0, 1])).toBe(18);
  });

  it('returns zero when no tiles are included', () => {
    const parameters = makeParameters();

    expect(calculateTilesDataByteCount(parameters, [])).toBe(0);
  });

  it('counts two bytes per row for a 16x8 tile', () => {
    // 1 tile × (ceil(16/8) × 8) = 1 × 16 = 16 bytes.
    const parameters = makeParameters({
      tiles: { count: 1, tileWidth: 16, attributes: undefined },
    });

    expect(calculateTilesDataByteCount(parameters, [0])).toBe(16);
  });
});

describe('buildMapFile', () => {
  it("returns a map file with type 'tiles' and the expected JSON payload", () => {
    const parameters = makeParameters();

    const file = buildMapFile(parameters);

    expect(file.fileType).toBe('map');
    expect(file.fileName).toBe('hud_tiles.cfg');

    const parsed = JSON.parse(file.content);
    expect(parsed).toEqual({
      type: 'tiles',
      tileWidth: 8,
      tileHeight: 8,
      excluded: [],
    });
  });
});
