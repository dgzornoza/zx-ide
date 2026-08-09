// ─── Binary builder primitives ────────────────────────────────────────────
//
// Unit tests for the pure bit-packing helpers in `binary-builder-utils.ts`.
// These functions convert in-memory model data (ink bitmaps, attributes,
// tile indices) into raw `Uint8Array` payloads and are the foundation that
// every code-generator strategy shares. They run with no DOM and no Vue,
// so they're the safest place to lock in byte-level behaviour before
// touching the strategies.

import { describe, expect, it } from "vitest";

import type { ZxpColorAttribute } from "src/helpers/image-utils";

import {
  attributeToByte,
  bitmapRowToBytes,
  bitmapToBytes,
  buildAttributeBytes,
  buildColumnBytes,
  buildMapIndicesBinary,
  buildPaddingBytes,
  buildSpritesBinary,
  buildTilesBinary,
  columnBitmapToByte,
  tileToBytes,
} from "./binary-builder-utils";

/** Builds a flat boolean array of `width * height` set to the same value. */
function flatBitmap(width: number, height: number, value: boolean): boolean[] {
  return new Array(width * height).fill(value);
}

describe("bitmapRowToBytes", () => {
  it("returns a single 0xFF byte for an all-true 8-pixel row", () => {
    const row = new Array(8).fill(true);
    expect(bitmapRowToBytes(row, 0, 8)).toEqual(new Uint8Array([0xff]));
  });

  it("returns a single 0x00 byte for an all-false 8-pixel row", () => {
    const row = new Array(8).fill(false);
    expect(bitmapRowToBytes(row, 0, 8)).toEqual(new Uint8Array([0x00]));
  });

  it("packs alternating MSB-first pixels into 0xCC", () => {
    const row = [true, true, false, false, true, true, false, false];
    expect(bitmapRowToBytes(row, 0, 8)).toEqual(new Uint8Array([0xcc]));
  });

  it("partitions a 12-pixel row into two bytes with the trailing nibble in bits 7..4 of byte 1", () => {
    // bytesPerRow = ceil(12 / 8) = 2
    // byte 0 = pixels 0..7  → 0b11001100 = 0xCC
    // byte 1 = pixels 8..11 → 0b11000000 = 0xC0
    const row = [
      true, true, false, false, true, true, false, false,
      true, true, false, false,
    ];
    expect(bitmapRowToBytes(row, 0, 12)).toEqual(
      new Uint8Array([0xcc, 0xc0]),
    );
  });

  it("returns an empty Uint8Array when width is 0", () => {
    expect(bitmapRowToBytes([], 0, 0)).toEqual(new Uint8Array(0));
  });
});

describe("bitmapToBytes", () => {
  it("emits eight 0xFF bytes for an all-true 8x8 bitmap", () => {
    const bitmap = flatBitmap(8, 8, true);
    expect(bitmapToBytes(bitmap, 8, 8)).toEqual(new Uint8Array(8).fill(0xff));
  });

  it("emits eight 0x00 bytes for an all-false 8x8 bitmap", () => {
    const bitmap = flatBitmap(8, 8, false);
    expect(bitmapToBytes(bitmap, 8, 8)).toEqual(new Uint8Array(8).fill(0x00));
  });

  it("emits sixteen bytes for a 16x8 bitmap (two bytes per row)", () => {
    // 16 pixels wide → ceil(16 / 8) = 2 bytes per row × 8 rows = 16 bytes.
    const bitmap = flatBitmap(16, 8, true);
    const out = bitmapToBytes(bitmap, 16, 8);
    expect(out.length).toBe(16);
    expect(out).toEqual(new Uint8Array(16).fill(0xff));
  });
});

describe("columnBitmapToByte", () => {
  it("returns 0xFF for column 0 of an all-true 8x8 bitmap", () => {
    const bitmap = flatBitmap(8, 8, true);
    expect(columnBitmapToByte(bitmap, 8, 0, 0)).toBe(0xff);
  });

  it("returns 0 when the column index is beyond the row's byte width", () => {
    // bytesPerRow = ceil(8 / 8) = 1 → colIndex 1 hits the `?? 0` fallback.
    const bitmap = flatBitmap(8, 8, true);
    expect(columnBitmapToByte(bitmap, 8, 0, 1)).toBe(0);
  });
});

describe("tileToBytes", () => {
  it("emits only the bitmap bytes when no attribute is provided", () => {
    const bitmap = flatBitmap(8, 8, true);
    expect(tileToBytes(bitmap, 8, 8)).toEqual(new Uint8Array(8).fill(0xff));
  });

  it("appends a 0xFF attribute byte when all attribute bits are set", () => {
    // flash=1 | bright=1 | paper=7<<3 | ink=7 = 0xFF.
    const bitmap = flatBitmap(8, 8, true);
    const attr: ZxpColorAttribute = {
      flash: true,
      bright: true,
      paper: 7,
      ink: 7,
    };
    const out = tileToBytes(bitmap, 8, 8, attr);
    expect(out.length).toBe(9);
    expect(out[8]).toBe(0xff);
  });

  it("appends a 0x00 attribute byte for the minimum attribute", () => {
    const bitmap = flatBitmap(8, 8, false);
    const attr: ZxpColorAttribute = {
      flash: false,
      bright: false,
      paper: 0,
      ink: 0,
    };
    const out = tileToBytes(bitmap, 8, 8, attr);
    expect(out.length).toBe(9);
    expect(out[8]).toBe(0x00);
  });
});

describe("attributeToByte", () => {
  it.each([
    { label: "the flash bit alone", attr: { flash: true, bright: false, paper: 0, ink: 0 }, expected: 0x80 },
    { label: "the bright bit alone", attr: { flash: false, bright: true, paper: 0, ink: 0 }, expected: 0x40 },
    { label: "the paper bits alone (paper=7)", attr: { flash: false, bright: false, paper: 7, ink: 0 }, expected: 0x38 },
    { label: "the ink bits alone (ink=7)", attr: { flash: false, bright: false, paper: 0, ink: 7 }, expected: 0x07 },
    { label: "every bit set", attr: { flash: true, bright: true, paper: 7, ink: 7 }, expected: 0xff },
    { label: "no bits set", attr: { flash: false, bright: false, paper: 0, ink: 0 }, expected: 0x00 },
    { label: "paper > 7 is masked to 0", attr: { flash: false, bright: false, paper: 8, ink: 0 }, expected: 0x00 },
    { label: "ink > 7 is masked to 0", attr: { flash: false, bright: false, paper: 0, ink: 8 }, expected: 0x00 },
  ])("returns $expected when $label", ({ attr, expected }) => {
    expect(attributeToByte(attr)).toBe(expected);
  });
});

describe("buildTilesBinary", () => {
  it("emits the bitmap bytes only when no attributes are supplied", () => {
    // 2 tiles × 8 bytes each = 16 bytes.
    const inkBitmaps = [flatBitmap(8, 8, true), flatBitmap(8, 8, false)];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 8,
      tileHeight: 8,
      includedIndices: [0, 1],
    });
    expect(out.length).toBe(16);
    expect(out).toEqual(
      new Uint8Array([...new Array(8).fill(0xff), ...new Array(8).fill(0x00)]),
    );
  });

  it("appends one attribute byte per included tile when attributes are supplied", () => {
    // 2 tiles × (8 bitmap bytes + 1 attribute byte) = 18 bytes.
    const inkBitmaps = [flatBitmap(8, 8, true), flatBitmap(8, 8, true)];
    const attributes: ZxpColorAttribute[] = [
      { flash: false, bright: false, paper: 0, ink: 7 },
      { flash: false, bright: false, paper: 7, ink: 0 },
    ];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 8,
      tileHeight: 8,
      attributes,
      includedIndices: [0, 1],
    });
    expect(out.length).toBe(18);
    expect(out[8]).toBe(0x07);
    expect(out[17]).toBe(0x38);
  });

  it("skips tiles whose index is not in `includedIndices`", () => {
    // tile 1 is excluded → output is only tile 0 + tile 2 (8 + 8 bytes).
    const inkBitmaps = [
      flatBitmap(8, 8, true),
      flatBitmap(8, 8, false),
      flatBitmap(8, 8, true),
    ];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 8,
      tileHeight: 8,
      includedIndices: [0, 2],
    });
    expect(out.length).toBe(16);
    expect(out).toEqual(new Uint8Array([...new Array(8).fill(0xff), ...new Array(8).fill(0xff)]));
  });

  it("returns an empty Uint8Array when `includedIndices` is empty", () => {
    const inkBitmaps = [flatBitmap(8, 8, true)];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 8,
      tileHeight: 8,
      includedIndices: [],
    });
    expect(out).toEqual(new Uint8Array(0));
  });

  it("emits two bytes per row for a 16-pixel-wide tile", () => {
    // ceil(16 / 8) × 8 = 16 bytes per tile; one included tile → 16 bytes.
    const inkBitmaps = [flatBitmap(16, 8, true)];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 16,
      tileHeight: 8,
      includedIndices: [0],
    });
    expect(out.length).toBe(16);
    expect(out).toEqual(new Uint8Array(16).fill(0xff));
  });

  it("falls back to an empty bitmap when `inkBitmaps[tileIndex]` is undefined (output keeps the allocated slot, zero-padded)", () => {
    // The middle tile is missing from `inkBitmaps`; the fallback `[]` contributes
    // zero bytes. The function pre-allocates `tileSize * includedIndices.length`
    // bytes (24 here), and the slot reserved for the missing tile is left as
    // zero — it is NOT trimmed from the returned buffer.
    const inkBitmaps: boolean[][] = [
      flatBitmap(8, 8, true),
      undefined as unknown as boolean[],
      flatBitmap(8, 8, true),
    ];
    const out = buildTilesBinary({
      inkBitmaps,
      tileWidth: 8,
      tileHeight: 8,
      includedIndices: [0, 1, 2],
    });
    expect(out.length).toBe(24);
    expect(out).toEqual(
      new Uint8Array([...new Array(8).fill(0xff), ...new Array(8).fill(0x00), ...new Array(8).fill(0xff)]),
    );
  });
});

describe("buildSpritesBinary", () => {
  const sprite = { width: 8, height: 8, frames: [{ x: 0, y: 0 }] };

  it("emits eight data bytes for one 8x8 frame with no mask and no padding", () => {
    const spriteBitmasks = [[flatBitmap(8, 8, true)]];
    const out = buildSpritesBinary({
      sprites: [sprite],
      spriteBitmasks,
      hasPadding: false,
      useMask: false,
    });
    expect(out).toEqual(new Uint8Array(8).fill(0xff));
  });

  it("emits sixteen (mask, data) bytes when `useMask` is true", () => {
    // For all-ink pixels: mask = ~0xFF & 0xFF = 0x00, data = 0xFF → 8 pairs.
    const spriteBitmasks = [[flatBitmap(8, 8, true)]];
    const out = buildSpritesBinary({
      sprites: [sprite],
      spriteBitmasks,
      hasPadding: false,
      useMask: true,
    });
    expect(out.length).toBe(16);
    expect(out).toEqual(
      new Uint8Array([0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff]),
    );
  });

  it("emits 23 bytes for one 8x8 frame with SP1 padding (7 top + 8 + 8 bottom)", () => {
    const spriteBitmasks = [[flatBitmap(8, 8, false)]];
    const out = buildSpritesBinary({
      sprites: [sprite],
      spriteBitmasks,
      hasPadding: true,
      useMask: false,
    });
    expect(out.length).toBe(7 + 8 + 8);
  });

  it("emits 39 bytes for one sprite with two 8x8 frames and SP1 padding", () => {
    // 7 top + (8 + 8) per frame (data rows + bottom padding per column).
    const spriteBitmasks = [[flatBitmap(8, 8, false), flatBitmap(8, 8, false)]];
    const twoFrameSprite = { width: 8, height: 8, frames: [{ x: 0, y: 0 }, { x: 0, y: 0 }] };
    const out = buildSpritesBinary({
      sprites: [twoFrameSprite],
      spriteBitmasks,
      hasPadding: true,
      useMask: false,
    });
    expect(out.length).toBe(7 + 8 + 8 + 8 + 8);
  });

  it("applies the 7-row top padding before the first frame of every sprite (not only the first sprite)", () => {
    // The padding block sits inside `sprites.forEach(...)`, so it fires once per
    // sprite: sprite 1 → 7 + (8 + 8) = 23; sprite 2 → 7 + (8 + 8) = 23.
    // Total = 46. (See the JSDoc above `buildSpritesBinary` — the prose reads
    // ambiguously; the implementation matches the SP1 convention of padding
    // every sprite independently.)
    const spriteBitmasks = [
      [flatBitmap(8, 8, false)],
      [flatBitmap(8, 8, false)],
    ];
    const out = buildSpritesBinary({
      sprites: [sprite, sprite],
      spriteBitmasks,
      hasPadding: true,
      useMask: false,
    });
    expect(out.length).toBe(7 + 8 + 8 + 7 + 8 + 8);
  });
});

describe("buildPaddingBytes", () => {
  it("emits `count` zero bytes when `useMask` is false", () => {
    expect(buildPaddingBytes(7, 8, false)).toEqual(new Uint8Array(7));
  });

  it("emits `count` (0xFF, 0x00) pairs when `useMask` is true", () => {
    expect(buildPaddingBytes(8, 8, true)).toEqual(
      new Uint8Array([0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00]),
    );
  });

  it("returns an empty Uint8Array when `count` is 0", () => {
    expect(buildPaddingBytes(0, 8, false)).toEqual(new Uint8Array(0));
    expect(buildPaddingBytes(0, 8, true)).toEqual(new Uint8Array(0));
  });
});

describe("buildColumnBytes", () => {
  it("emits eight 0xFF data bytes for column 0 of an all-true 8x8 bitmap (no mask)", () => {
    const bitmap = flatBitmap(8, 8, true);
    expect(buildColumnBytes(bitmap, 8, 8, 0, false)).toEqual(
      new Uint8Array(8).fill(0xff),
    );
  });

  it("emits eight (mask, data) pairs for column 0 when `useMask` is true", () => {
    // mask = ~0xFF & 0xFF = 0x00, data = 0xFF.
    const bitmap = flatBitmap(8, 8, true);
    expect(buildColumnBytes(bitmap, 8, 8, 0, true)).toEqual(
      new Uint8Array([0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff, 0x00, 0xff]),
    );
  });

  it("emits eight 0xFF data bytes for column 1 of an all-true 16x8 bitmap (no mask)", () => {
    const bitmap = flatBitmap(16, 8, true);
    expect(buildColumnBytes(bitmap, 16, 8, 1, false)).toEqual(
      new Uint8Array(8).fill(0xff),
    );
  });
});

describe("buildAttributeBytes", () => {
  it("emits one attribute byte per entry in `includedIndices`, in order", () => {
    const attributes: ZxpColorAttribute[] = [
      { flash: false, bright: false, paper: 0, ink: 7 },
      { flash: false, bright: false, paper: 0, ink: 0 },
      { flash: true, bright: false, paper: 0, ink: 0 },
    ];
    const out = buildAttributeBytes(attributes, [0, 2]);
    expect(out).toEqual(new Uint8Array([0x07, 0x80]));
  });

  it("falls back to ZX Spectrum defaults (paper=7, ink=0) when the attribute is missing", () => {
    // paper=7<<3 | ink=0 = 0x38.
    const attributes: ZxpColorAttribute[] = [
      { flash: false, bright: false, paper: 0, ink: 0 },
      undefined as unknown as ZxpColorAttribute,
    ];
    const out = buildAttributeBytes(attributes, [0, 1]);
    expect(out).toEqual(new Uint8Array([0x00, 0x38]));
  });

  it("returns an empty Uint8Array when `includedIndices` is empty", () => {
    const attributes: ZxpColorAttribute[] = [
      { flash: false, bright: false, paper: 0, ink: 0 },
    ];
    expect(buildAttributeBytes(attributes, [])).toEqual(new Uint8Array(0));
  });
});

describe("buildMapIndicesBinary", () => {
  it("passes through values that already fit in a byte unchanged", () => {
    expect(buildMapIndicesBinary([1, 2, 3, 4])).toEqual(
      new Uint8Array([1, 2, 3, 4]),
    );
  });

  it("truncates values above 0xFF to their low byte", () => {
    // 256 & 0xff === 0, so the high tile index wraps to 0.
    expect(buildMapIndicesBinary([256, 0])).toEqual(new Uint8Array([0, 0]));
  });

  it("interprets negative values via two's complement (e.g. -1 → 0xFF)", () => {
    // (-1) & 0xff === 255 → 0xFF.
    expect(buildMapIndicesBinary([-1, 5])).toEqual(new Uint8Array([0xff, 5]));
  });

  it("returns an empty Uint8Array when the input array is empty", () => {
    expect(buildMapIndicesBinary([])).toEqual(new Uint8Array(0));
  });
});
