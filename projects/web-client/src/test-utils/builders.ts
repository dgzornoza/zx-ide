// ─── Shared test fixture builders ──────────────────────────────────────────
//
// These factories produce model instances that match the inline literals
// the existing generator specs use, so refactoring those specs to the
// builders is a *pure* no-op for test behaviour. The defaults are
// intentionally not the minimal legal models — they are the most common
// realistic shape seen across the architectural-invariant and fixture
// tests (a 2-tile 8x8 set with full ink bitmaps + ZX attributes, a
// single 8x8 player sprite, a 4x2 map against a 64-tile tileset).
//
// Per-test variations go through `Partial<Model>` overrides. Do not bloat
// the defaults with rare fields — keep them in the call sites instead.

import type { TilesModel } from "src/shared/models/tilesDefinition";
import type { SpriteDefinition } from "src/shared/models/spriteDefinition";
import type { MapTilesetMetadata } from "src/extract-map-tileset/models/mapTilesetDefinition";

const ALL_INK_8x8: boolean[] = new Array(64).fill(true);
const ALTERNATING_8x8: boolean[] = Array.from(
  { length: 64 },
  (_, i): boolean => i % 2 === 1,
);

/** Builds a {@link TilesModel} matching the most common 2-tile 8x8 fixture. */
export function makeTilesModel(overrides: Partial<TilesModel> = {}): TilesModel {
  return {
    type: "tiles",
    tileWidth: 8,
    tileHeight: 8,
    count: 2,
    columns: 2,
    excluded: [],
    excludedSet: new Set<number>(),
    previews: ["", ""],
    inkBitmaps: [ALL_INK_8x8, ALTERNATING_8x8],
    attributes: [
      { flash: false, bright: false, paper: 0, ink: 7 },
      { flash: false, bright: true, paper: 1, ink: 6 },
    ],
    ...overrides,
  };
}

/** Builds a {@link SpriteDefinition} matching the most common 8x8 sprite fixture. */
export function makeSpriteModel(
  overrides: Partial<SpriteDefinition> = {},
): SpriteDefinition {
  return {
    _id: "1",
    name: "player",
    width: 8,
    height: 8,
    frames: [{ x: 0, y: 0 }],
    ...overrides,
  };
}

/** Builds a {@link MapTilesetMetadata} matching the most common 4x2 map fixture. */
export function makeMapModel(
  overrides: Partial<MapTilesetMetadata> = {},
): MapTilesetMetadata {
  return {
    mapWidth: 4,
    mapHeight: 2,
    tileWidth: 8,
    tileHeight: 8,
    tilesetName: "hud-tiles",
    tileCount: 64,
    columns: 16,
    sourceImage: "hud-tiles.png",
    ...overrides,
  };
}
