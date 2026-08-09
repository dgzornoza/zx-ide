// ─── Unit tests for the sprites code-generator strategy helpers ───────────
//
// Covers the four exported helpers in
// `src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy.ts`:
// `buildMapFile`, `generateSpriteAsmBody`, `calculateSpritesDataByteCount`,
// and `buildDataSizeComment`.
//
// The most important behavioural quirk pinned here is the per-sprite top
// padding: with the SP1 padding flag enabled, the 7-row rotation-guard
// block is emitted **for every sprite**, not only for the first sprite in
// the set. See `calculateSpritesDataByteCount` below — a "fix" that lifts
// the top padding outside the per-sprite loop will fail the explicit
// two-sprite test.

import { describe, expect, it } from "vitest";

import {
  buildDataSizeComment,
  buildMapFile,
  calculateSpritesDataByteCount,
  generateSpriteAsmBody,
  SpritesCodeGeneratorParams,
} from "src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy";
import type {
  SpriteDefinition,
  SpriteFrame,
} from "src/shared/models/spriteDefinition";

/** 8-pixel-wide all-ink (`true`) or all-paper (`false`) row-major bitmap. */
function flatBitmap(
  width: number,
  height: number,
  value: boolean,
): boolean[] {
  return new Array(width * height).fill(value);
}

/** Builds a single-frame sprite definition. */
function singleFrameSprite(
  name: string,
  width: number,
  height: number,
): SpriteDefinition {
  return { name, width, height, frames: [{ x: 0, y: 0 }] satisfies SpriteFrame[] };
}

/** Minimal params with one sprite and the supplied flags. */
function makeParams(
  sprite: SpriteDefinition,
  spriteBitmasks: boolean[][],
  overrides: Partial<SpritesCodeGeneratorParams> = {},
): SpritesCodeGeneratorParams {
  return {
    name: "player",
    spriteFlags: 0,
    sprites: [sprite],
    spriteBitmasks: [spriteBitmasks],
    ...overrides,
  };
}

describe("calculateSpritesDataByteCount", () => {
  it("counts only the bitmap bytes when neither padding nor mask is enabled", () => {
    const params = makeParams(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, true)],
    );

    expect(calculateSpritesDataByteCount(params, false, false)).toBe(8);
  });

  it("adds 7 top + 8 bottom padding rows when SP1 padding is on", () => {
    // 7 (top) + 8 (frame) + 8 (bottom) = 23 bytes for a single 8x8 frame.
    const params = makeParams(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, false)],
    );

    expect(calculateSpritesDataByteCount(params, true, false)).toBe(23);
  });

  it("doubles the byte count when the mask plane is also enabled", () => {
    // Each logical byte becomes (mask, data) = 23 × 2 = 46.
    const params = makeParams(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, false)],
    );

    expect(calculateSpritesDataByteCount(params, true, true)).toBe(46);
  });

  it("applies the 7-row top padding PER sprite, not just once globally", () => {
    // Quirk pin: with two sprites and SP1 padding, each sprite must emit
    // its own 7-row top padding block. A naive refactor that lifts the
    // padding outside the per-sprite loop would compute 23 + 16 = 39
    // instead of the correct 23 + 23 = 46.
    const params: SpritesCodeGeneratorParams = {
      name: "player",
      spriteFlags: 1,
      sprites: [
        singleFrameSprite("a", 8, 8),
        singleFrameSprite("b", 8, 8),
      ],
      spriteBitmasks: [
        [flatBitmap(8, 8, false)],
        [flatBitmap(8, 8, false)],
      ],
    };

    expect(calculateSpritesDataByteCount(params, true, false)).toBe(46);
  });

  it("emits two columns × one frame with per-column bottom padding for 16x8", () => {
    // 7 (top) + 2 × (8 frame + 8 bottom) = 7 + 32 = 39 bytes.
    const params = makeParams(
      singleFrameSprite("a", 16, 8),
      [flatBitmap(16, 8, false)],
    );

    expect(calculateSpritesDataByteCount(params, true, false)).toBe(39);
  });

  it("counts each frame's bitmap bytes without padding", () => {
    // 3 frames × 8 bytes = 24.
    const params = makeParams(
      { name: "a", width: 8, height: 8, frames: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }] },
      [
        flatBitmap(8, 8, false),
        flatBitmap(8, 8, false),
        flatBitmap(8, 8, false),
      ],
    );

    expect(calculateSpritesDataByteCount(params, false, false)).toBe(24);
  });

  it("adds one top padding block plus per-frame bottom padding for 3 frames", () => {
    // 7 (top) + 3 × (8 frame + 8 bottom) = 7 + 48 = 55 bytes.
    const params = makeParams(
      { name: "a", width: 8, height: 8, frames: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }] },
      [
        flatBitmap(8, 8, false),
        flatBitmap(8, 8, false),
        flatBitmap(8, 8, false),
      ],
    );

    expect(calculateSpritesDataByteCount(params, true, false)).toBe(55);
  });
});

describe("buildMapFile (sprites)", () => {
  it("emits type 'sprites' and the sprite definitions without _id when no flags are set", () => {
    const sprite: SpriteDefinition = {
      _id: "runtime-1",
      name: "player",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    const params: SpritesCodeGeneratorParams = {
      name: "player",
      spriteFlags: 0,
      sprites: [sprite],
      spriteBitmasks: [[flatBitmap(8, 8, false)]],
    };

    const file = buildMapFile(params);

    expect(file.fileType).toBe("map");
    expect(file.fileName).toBe("player.cfg");

    const parsed = JSON.parse(file.content);
    expect(parsed.type).toBe("sprites");
    expect(parsed.sprites).toHaveLength(1);
    // Runtime-only `_id` must be stripped from the serialised payload.
    expect(parsed.sprites[0]).not.toHaveProperty("_id");
    expect(parsed.sprites[0].name).toBe("player");
    // No flags → key must be absent (the factory uses conditional spread).
    expect(parsed).not.toHaveProperty("spriteFlags");
  });

  it("includes the spriteFlags value when non-zero", () => {
    const params: SpritesCodeGeneratorParams = {
      name: "player",
      spriteFlags: 1,
      sprites: [singleFrameSprite("a", 8, 8)],
      spriteBitmasks: [[flatBitmap(8, 8, false)]],
    };

    const parsed = JSON.parse(buildMapFile(params).content);
    expect(parsed.spriteFlags).toBe(1);
  });
});

describe("generateSpriteAsmBody", () => {
  it("emits the PUBLIC directive, label and a single defb line for an 8x8 sprite", () => {
    const lines = generateSpriteAsmBody(
      singleFrameSprite("player", 8, 8),
      [flatBitmap(8, 8, true)],
      "_player_player",
      "_player_player",
      false,
      false,
    );

    expect(lines).toContain("PUBLIC _player_player");
    expect(lines).toContain("");
    expect(lines).toContain("_player_player:");
    expect(lines).toContain("    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF");
  });

  it("emits one PUBLIC directive per column plus the matching labels for a 16x8 sprite", () => {
    const lines = generateSpriteAsmBody(
      singleFrameSprite("player", 16, 8),
      [flatBitmap(16, 8, true)],
      "_player_player",
      "_player_player",
      false,
      false,
    );

    expect(lines).toContain("PUBLIC _player_player_col_1");
    expect(lines).toContain("PUBLIC _player_player_col_2");
    expect(lines).toContain("_player_player_col_1:");
    expect(lines).toContain("_player_player_col_2:");
  });

  it("uses _f2 and _f3 suffixes for the second and third frames", () => {
    const sprite: SpriteDefinition = {
      name: "player",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
    };

    const lines = generateSpriteAsmBody(
      sprite,
      [flatBitmap(8, 8, false), flatBitmap(8, 8, false), flatBitmap(8, 8, false)],
      "_player",
      null,
      false,
      false,
    );

    expect(lines).toContain("_player:");
    expect(lines).toContain("_player_f2:");
    expect(lines).toContain("_player_f3:");
  });

  it("emits the 7-row top padding BEFORE the frame label and 8-row bottom padding AFTER", () => {
    const lines = generateSpriteAsmBody(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, false)],
      "_a",
      null,
      true,
      false,
    );

    const labelIndex = lines.indexOf("_a:");
    const firstDefb = lines.indexOf("    defb $00,$00,$00,$00,$00,$00,$00");
    expect(firstDefb).toBeGreaterThanOrEqual(0);
    expect(firstDefb).toBeLessThan(labelIndex);

    // After the label there must be two defb lines: the 8 data bytes and
    // the 8-row bottom padding (both all-zero for an all-paper bitmap).
    const dataDefb = lines.indexOf(
      "    defb $00,$00,$00,$00,$00,$00,$00,$00",
      labelIndex,
    );
    expect(dataDefb).toBeGreaterThan(labelIndex);

    const bottomPadding = lines.indexOf(
      "    defb $00,$00,$00,$00,$00,$00,$00,$00",
      dataDefb + 1,
    );
    expect(bottomPadding).toBeGreaterThan(dataDefb);
  });

  it("interleaves mask/data bytes in the padding lines when useMask is on", () => {
    const lines = generateSpriteAsmBody(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, false)],
      "_a",
      null,
      true,
      true,
    );

    // 7 rows × (mask=$FF, data=$00) pairs, all on a single defb line.
    expect(lines).toContain(
      "    defb $FF,$00,$FF,$00,$FF,$00,$FF,$00,$FF,$00,$FF,$00,$FF,$00",
    );
  });

  it("omits the PUBLIC directives when publicLabel is null", () => {
    const lines = generateSpriteAsmBody(
      singleFrameSprite("a", 8, 8),
      [flatBitmap(8, 8, true)],
      "_a",
      null,
      false,
      false,
    );

    // The label still appears…
    expect(lines).toContain("_a:");
    // …but no PUBLIC directive should be emitted.
    expect(lines.some((line) => line.startsWith("PUBLIC "))).toBe(false);
  });
});

describe("buildDataSizeComment", () => {
  it("formats the byte count with the documented prefix", () => {
    expect(buildDataSizeComment(23)).toBe("; Data Size: 23 bytes");
  });
});
