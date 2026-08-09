// ─── Fixture tests for the refactored generators ──────────────────────────
//
// These tests pin the exact output text of the C/ASM generators (plain mode)
// to a known-good fixture. They guard against regressions in the
// bytes-first refactor that consolidated bit-packing into
// `binary-builder-utils.ts` and left `code-generator-utils.ts` as a pure
// text formatter.
//
// Trailing newline handling is preserved as-is from the existing
// generators — some end with `\n` (tiles C, map, etc.) and others don't
// (sprite C/ASM asm). The fixtures match the actual output byte-for-byte.

import { describe, expect, it } from "vitest";

import { CTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/cGenerator";
import { AsmTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/asmGenerator";
import { CSpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/cGenerator";
import { AsmSpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/asmGenerator";
import { CMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/cGenerator";
import { AsmMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/asmGenerator";

/** Joins an array of {@link FileEntry} into a { fileName → content } map. */
function filesByName(
  entries: Array<{ fileName: string; content: string }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of entries) map[e.fileName] = e.content;
  return map;
}

// ─── Tiles (C, plain) ──────────────────────────────────────────────────────

describe("CTilesCodeGeneratorStrategy (plain mode)", () => {
  it("emits .cfg / .h / .asm for a 2-tile 8x8 set", () => {
    const tiles = {
      type: "tiles" as const,
      tileWidth: 8,
      tileHeight: 8,
      count: 2,
      columns: 2,
      excluded: [],
      excludedSet: new Set<number>(),
      previews: ["", ""],
      inkBitmaps: [
        new Array(64).fill(true),
        Array.from({ length: 64 }, (_, i) => i % 2),
      ],
      attributes: [
        { flash: false, bright: false, paper: 0, ink: 7 },
        { flash: false, bright: true, paper: 1, ink: 6 },
      ],
    };

    const files = filesByName(
      new CTilesCodeGeneratorStrategy().generate({ name: "hud_tiles", tiles }),
    );

    expect(files["hud_tiles.cfg"]).toBe(
      [
        "{",
        '  "type": "tiles",',
        '  "tileWidth": 8,',
        '  "tileHeight": 8,',
        '  "excluded": []',
        "}",
      ].join("\n"),
    );

    expect(files["hud_tiles.h"]).toBe(
      [
        "#ifndef __DATA_HUD_TILES_H__",
        "#define __DATA_HUD_TILES_H__",
        "",
        "#include <stdint.h>",
        "",
        "extern const uint8_t hud_tiles[];",
        "extern const uint8_t hud_tiles_attributes[];",
        "",
        "#endif // __DATA_HUD_TILES_H__",
        "",
      ].join("\n"),
    );

    expect(files["hud_tiles.asm"]).toBe(
      [
        "; Data Size: 18 bytes",
        "; Read-Only Data Section for User Module",
        "SECTION rodata_user",
        "",
        "PUBLIC _hud_tiles",
        "_hud_tiles:",
        "",
        "    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
        "",
        "    defb $55,$55,$55,$55,$55,$55,$55,$55",
        "",
        "PUBLIC _hud_tiles_attributes",
        "_hud_tiles_attributes:",
        "    defb $07,$4E",
        "",
      ].join("\n"),
    );
  });
});

// ─── Tiles (ASM) ───────────────────────────────────────────────────────────

describe("AsmTilesCodeGeneratorStrategy", () => {
  it("emits the expected sjasmplus output for a 2-tile 8x8 set", () => {
    const tiles = {
      type: "tiles" as const,
      tileWidth: 8,
      tileHeight: 8,
      count: 2,
      columns: 2,
      excluded: [],
      excludedSet: new Set<number>(),
      previews: ["", ""],
      inkBitmaps: [
        new Array(64).fill(true),
        Array.from({ length: 64 }, (_, i) => i % 2),
      ],
      attributes: [
        { flash: false, bright: false, paper: 0, ink: 7 },
        { flash: false, bright: true, paper: 1, ink: 6 },
      ],
    };

    const files = filesByName(
      new AsmTilesCodeGeneratorStrategy().generate({ name: "hud_tiles", tiles }),
    );

    expect(files["hud_tiles.asm"]).toBe(
      [
        "; Data Size: 18 bytes",
        "hud_tiles:",
        "",
        "    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
        "",
        "    defb $55,$55,$55,$55,$55,$55,$55,$55",
        "",
        "hud_tiles_attributes:",
        "    defb $07,$4E",
        "",
      ].join("\n"),
    );
  });
});

// ─── Sprites (C, plain) ────────────────────────────────────────────────────

describe("CSpritesCodeGeneratorStrategy (plain mode)", () => {
  it("emits .h / .asm for a single 8x8 sprite (all ink)", () => {
    const sprite = {
      _id: "1",
      name: "player",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    // spriteBitmasks is boolean[][][] — sprite → frame → booleans.
    const spriteBitmasks = [[new Array(64).fill(true)]];

    const files = filesByName(
      new CSpritesCodeGeneratorStrategy().generate({
        name: "player",
        sprites: [sprite],
        spriteFlags: 0,
        spriteBitmasks,
      }),
    );

    expect(files["player.h"]).toBe(
      [
        "#ifndef __DATA_PLAYER_H__",
        "#define __DATA_PLAYER_H__",
        "",
        "#include <stdint.h>",
        "",
        "extern const uint8_t player_player[];",
        "",
        "#endif // __DATA_PLAYER_H__",
        "",
      ].join("\n"),
    );

    // NOTE: sprite ASM body is spread via `...generateSpriteAsmBody(...)`
    // without a trailing empty string, so this file does NOT end with `\n`.
    expect(files["player.asm"]).toBe(
      [
        "; Data Size: 8 bytes",
        "; Read-Only Data Section for User Module",
        "SECTION rodata_user",
        "",
        "PUBLIC _player_player",
        "",
        "_player_player:",
        "    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
      ].join("\n"),
    );
  });

  it("emits mask-interleaved bytes when UseMask flag is set", () => {
    const sprite = {
      _id: "1",
      name: "hero",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    const spriteBitmasks = [[new Array(64).fill(true)]];

    const files = filesByName(
      new CSpritesCodeGeneratorStrategy().generate({
        name: "hero",
        sprites: [sprite],
        spriteFlags: 2, // UseMask
        spriteBitmasks,
      }),
    );

    // For an all-ink bitmap, each row pair is (mask=$00, data=$FF).
    expect(files["hero.asm"]).toContain("    defb $00,$FF,$00,$FF");
  });

  it("emits SP1 top/bottom padding when Sp1Padding flag is set", () => {
    const sprite = {
      _id: "1",
      name: "npc",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    const spriteBitmasks = [[new Array(64).fill(false)]];

    const files = filesByName(
      new CSpritesCodeGeneratorStrategy().generate({
        name: "npc",
        sprites: [sprite],
        spriteFlags: 1, // Sp1Padding
        spriteBitmasks,
      }),
    );

    // For an all-paper 8x8 sprite with SP1 padding: 7 top padding rows
    // + 8 frame rows + 8 bottom padding rows = 23 zero bytes total.
    const zeroByteCount = (files["npc.asm"].match(/\$00/g) ?? []).length;
    expect(zeroByteCount).toBe(7 + 8 + 8);
  });
});

// ─── Sprites (ASM) ─────────────────────────────────────────────────────────

describe("AsmSpritesCodeGeneratorStrategy", () => {
  it("emits the expected sjasmplus output for a single 8x8 sprite", () => {
    const sprite = {
      _id: "1",
      name: "player",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    const spriteBitmasks = [[new Array(64).fill(true)]];

    const files = filesByName(
      new AsmSpritesCodeGeneratorStrategy().generate({
        name: "player",
        sprites: [sprite],
        spriteFlags: 0,
        spriteBitmasks,
      }),
    );

    // ASM generator also returns the lines array directly — no trailing `\n`.
    expect(files["player.asm"]).toBe(
      [
        "; Data Size: 8 bytes",
        "player_player:",
        "    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
      ].join("\n"),
    );
  });
});

// ─── Map tileset (C, plain) ───────────────────────────────────────────────

describe("CMapCodeGenerator (plain mode)", () => {
  it("emits .h / .asm for a 4x2 map", () => {
    const files = filesByName(
      new CMapCodeGenerator().generate({
        name: "hud_map",
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
        tileIndices: [1, 2, 3, 4, 5, 6, 7, 8],
      }),
    );

    expect(files["hud_map.h"]).toBe(
      [
        "#ifndef __DATA_HUD_MAP_H__",
        "#define __DATA_HUD_MAP_H__",
        "",
        "#include <stdint.h>",
        "",
        "// Map: hud_map  (4 x 2 tiles)",
        "#define HUD_MAP_WIDTH  4",
        "#define HUD_MAP_HEIGHT 2",
        "#define HUD_MAP_SIZE   8",
        "#define HUD_MAP_TILES_COUNT 64",
        "extern uint8_t hud_map[2][4];",
        "",
        "#endif // __DATA_HUD_MAP_H__",
        "",
      ].join("\n"),
    );

    expect(files["hud_map.asm"]).toBe(
      [
        "; HUD_MAP_WIDTH: 4",
        "; HUD_MAP_HEIGHT: 2",
        "; HUD_MAP_SIZE: 8",
        "; HUD_MAP_TILES_COUNT: 64",
        "; Data Size: 8 bytes",
        "SECTION rodata_user",
        "PUBLIC _hud_map",
        "",
        "; Map: hud_map  (4 x 2 tiles)",
        "_hud_map:",
        "    defb 1,2,3,4",
        "    defb 5,6,7,8",
        "",
      ].join("\n"),
    );
  });
});

// ─── Map tileset (ASM) ─────────────────────────────────────────────────────

describe("AsmMapCodeGenerator", () => {
  it("emits the expected sjasmplus output for a 4x2 map", () => {
    const files = filesByName(
      new AsmMapCodeGenerator().generate({
        name: "hud_map",
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
        tileIndices: [1, 2, 3, 4, 5, 6, 7, 8],
      }),
    );

    expect(files["hud_map.asm"]).toBe(
      [
        "; HUD_MAP_WIDTH: 4",
        "; HUD_MAP_HEIGHT: 2",
        "; HUD_MAP_SIZE: 8",
        "; HUD_MAP_TILES_COUNT: 64",
        "; Data Size: 8 bytes",
        "; Map: hud_map  (4 x 2 tiles)",
        "hud_map:",
        "    defb 1,2,3,4",
        "    defb 5,6,7,8",
        "",
      ].join("\n"),
    );
  });
});

// ─── Multi-frame sprite (ASM) ──────────────────────────────────────────────

describe("AsmSpritesCodeGeneratorStrategy", () => {
  it("emits one label and defb block per frame for a 2-frame 8x8 sprite", () => {
    const sprite = {
      _id: "1",
      name: "player",
      width: 8,
      height: 8,
      frames: [
        { x: 0, y: 0 },
        { x: 8, y: 0 },
      ],
    };
    const spriteBitmasks = [[new Array(64).fill(true), new Array(64).fill(true)]];

    const files = filesByName(
      new AsmSpritesCodeGeneratorStrategy().generate({
        name: "player",
        sprites: [sprite],
        spriteFlags: 0,
        spriteBitmasks,
      }),
    );

    expect(files["player.asm"]).toContain("player_player:");
    expect(files["player.asm"]).toContain("player_player_f2:");
    expect(files["player.asm"]).toContain(
      "    defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
    );
  });
});

// ─── Multi-column sprite (C, plain) ────────────────────────────────────────

describe("CSpritesCodeGeneratorStrategy (plain mode)", () => {
  it("emits one extern and one asm label per column for a 16x8 sprite", () => {
    const sprite = {
      _id: "1",
      name: "hero",
      width: 16,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    };
    const spriteBitmasks = [[new Array(16 * 8).fill(true)]];

    const files = filesByName(
      new CSpritesCodeGeneratorStrategy().generate({
        name: "hero",
        sprites: [sprite],
        spriteFlags: 0,
        spriteBitmasks,
      }),
    );

    expect(files["hero.h"]).toContain("extern const uint8_t hero_hero_col_1[];");
    expect(files["hero.h"]).toContain("extern const uint8_t hero_hero_col_2[];");
    expect(files["hero.asm"]).toContain("_hero_hero_col_1:");
    expect(files["hero.asm"]).toContain("_hero_hero_col_2:");
  });
});

// ─── Excluded tiles (C, plain) ─────────────────────────────────────────────

describe("CTilesCodeGeneratorStrategy (plain mode)", () => {
  it("skips excluded tiles in the .asm and records them in the .cfg", () => {
    const tiles = {
      type: "tiles" as const,
      tileWidth: 8,
      tileHeight: 8,
      count: 2,
      columns: 2,
      excluded: [0],
      excludedSet: new Set<number>([0]),
      previews: ["", ""],
      inkBitmaps: [
        new Array(64).fill(true),
        Array.from({ length: 64 }, (_, i) => i % 2),
      ],
    };

    const files = filesByName(
      new CTilesCodeGeneratorStrategy().generate({ name: "hud_tiles", tiles }),
    );

    expect(JSON.parse(files["hud_tiles.cfg"])).toEqual({
      type: "tiles",
      tileWidth: 8,
      tileHeight: 8,
      excluded: [0],
    });
    expect(files["hud_tiles.asm"]).not.toContain(
      "defb $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF",
    );
    expect(files["hud_tiles.asm"]).toContain(
      "    defb $55,$55,$55,$55,$55,$55,$55,$55",
    );
  });
});
