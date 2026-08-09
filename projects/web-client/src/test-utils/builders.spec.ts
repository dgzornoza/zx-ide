// ─── Shared test fixture builders ──────────────────────────────────────────
//
// These tests pin the defaults of the test fixture builders. The defaults
// are tuned to match the most common inline literals used across the
// existing generator specs — any silent change here would ripple into
// every refactored spec. Keep the assertions tight and per-field so a
// future "harmless" tweak to a default is caught here, not by an obscure
// 4-levels-deep snapshot failure.

import { describe, expect, it } from "vitest";

import {
  makeMapModel,
  makeSpriteModel,
  makeTilesModel,
} from "src/test-utils/builders";

describe("makeTilesModel", () => {
  it("matches the canonical 2-tile 8x8 fixture when no overrides are passed", () => {
    const tiles = makeTilesModel();

    expect(tiles).toEqual({
      type: "tiles",
      tileWidth: 8,
      tileHeight: 8,
      count: 2,
      columns: 2,
      excluded: [],
      excludedSet: new Set<number>(),
      previews: ["", ""],
      inkBitmaps: [
        new Array(64).fill(true),
        Array.from({ length: 64 }, (_, i): boolean => i % 2 === 1),
      ],
      attributes: [
        { flash: false, bright: false, paper: 0, ink: 7 },
        { flash: false, bright: true, paper: 1, ink: 6 },
      ],
    });
  });

  it("merges overrides on top of the defaults", () => {
    const tiles = makeTilesModel({ count: 4, columns: 4, excluded: [1] });

    expect(tiles.count).toBe(4);
    expect(tiles.columns).toBe(4);
    expect(tiles.excluded).toEqual([1]);
    // Untouched fields keep the default.
    expect(tiles.tileWidth).toBe(8);
    expect(tiles.inkBitmaps).toHaveLength(2);
  });

  it("replaces (does not deep-merge) array-valued fields", () => {
    // Important: array overrides must replace the default array entirely;
    // they must not be concatenated. This guards the "excluded: [0]"
    // override pattern used in the fixtures spec.
    const tiles = makeTilesModel({ excluded: [0], previews: ["only-one"] });

    expect(tiles.excluded).toEqual([0]);
    expect(tiles.previews).toEqual(["only-one"]);
  });
});

describe("makeSpriteModel", () => {
  it("matches the canonical 8x8 single-frame sprite fixture by default", () => {
    const sprite = makeSpriteModel();

    expect(sprite).toEqual({
      _id: "1",
      name: "player",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    });
  });

  it("merges overrides on top of the defaults", () => {
    const sprite = makeSpriteModel({
      name: "hero",
      width: 16,
      frames: [{ x: 0, y: 0 }, { x: 16, y: 0 }],
    });

    expect(sprite.name).toBe("hero");
    expect(sprite.width).toBe(16);
    expect(sprite.height).toBe(8);
    expect(sprite.frames).toHaveLength(2);
    // _id is rarely overridden; keep the default for stable v-for keys.
    expect(sprite._id).toBe("1");
  });
});

describe("makeMapModel", () => {
  it("matches the canonical 4x2 hud-map fixture by default", () => {
    const metadata = makeMapModel();

    expect(metadata).toEqual({
      mapWidth: 4,
      mapHeight: 2,
      tileWidth: 8,
      tileHeight: 8,
      tilesetName: "hud-tiles",
      tileCount: 64,
      columns: 16,
      sourceImage: "hud-tiles.png",
    });
  });

  it("merges overrides on top of the defaults", () => {
    const metadata = makeMapModel({ mapWidth: 8, mapHeight: 8, tileCount: 128 });

    expect(metadata.mapWidth).toBe(8);
    expect(metadata.mapHeight).toBe(8);
    expect(metadata.tileCount).toBe(128);
    // Untouched fields keep the default.
    expect(metadata.tileWidth).toBe(8);
    expect(metadata.tilesetName).toBe("hud-tiles");
  });
});
