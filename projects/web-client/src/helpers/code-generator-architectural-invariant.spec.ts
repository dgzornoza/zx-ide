// ─── Architectural invariant: plain .asm defb bytes ≡ compressed .bin payload ─
//
// The C code generators (tiles / sprites / map) were refactored to a
// "bytes-first" architecture: a single canonical builder
// (`buildTilesBinary` / `buildSpritesBinary` / `buildMapIndicesBinary`) is
// the source of truth for the byte sequence. Plain-mode `.asm` files are
// produced by formatting those bytes as `defb` text, and compressed-mode
// `.bin` files are produced by ZX0-compressing those same bytes.
//
// These tests prove that invariant for every C generator. For each one:
//   - parseDefbLines(plain.asm)       → the bytes the assembler embeds
//   - decompress(base64ToBytes(bin))  → the bytes the runtime loads
//   - buildXxxBinary(...)             → the canonical raw bytes
// All three must be byte-identical.

import { describe, expect, it } from "vitest";

import { CTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/cGenerator";
import { CSpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/cGenerator";
import { CMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/cGenerator";
import {
  buildMapIndicesBinary,
  buildSpritesBinary,
  buildTilesBinary,
} from "src/helpers/binary-builder-utils";
import { base64ToBytes } from "src/helpers/binary-utils";
import { decompress } from "src/helpers/zx0-compress";
import {
  makeMapModel,
  makeSpriteModel,
  makeTilesModel,
} from "src/test-utils/builders";

/** Parses all `defb` numbers from an asm text blob into a Uint8Array. */
function parseDefbLines(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/defb\s+(.+)$/);
    if (!m) continue;
    for (const token of m[1].split(",")) {
      const t = token.trim();
      if (t.startsWith("$")) bytes.push(parseInt(t.slice(1), 16));
      else bytes.push(parseInt(t, 10));
    }
  }
  return new Uint8Array(bytes);
}

/** Joins generated files into a { fileName → content } map. */
function filesByName(
  entries: Array<{ fileName: string; content: string }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of entries) map[e.fileName] = e.content;
  return map;
}

// ─── Tiles ──────────────────────────────────────────────────────────────────
//
// The invariant holds with attributes too: `buildTilesBinary` now emits
// bitmaps contiguously followed by all attribute bytes, matching the plain
// `.asm` byte order. See `binary-builder-utils.ts:buildTilesBinary`.

describe("CTilesCodeGeneratorStrategy: plain defb ≡ ZX0-decompressed bin", () => {
  it("produces byte-identical payloads across plain .asm, compressed .bin and buildTilesBinary", () => {
    const tiles = makeTilesModel();

    const plainFiles = filesByName(
      new CTilesCodeGeneratorStrategy().generate({ name: "hud_tiles", tiles }),
    );
    const compressedFiles = filesByName(
      new CTilesCodeGeneratorStrategy().generate({
        name: "hud_tiles",
        tiles,
        compressed: true,
      }),
    );

    const rawBytes = buildTilesBinary({
      inkBitmaps: tiles.inkBitmaps,
      tileWidth: tiles.tileWidth,
      tileHeight: tiles.tileHeight,
      attributes: tiles.attributes,
      includedIndices: [0, 1],
    });

    const asmBytes = parseDefbLines(plainFiles["hud_tiles.asm"]);
    const binBytes = decompress(
      base64ToBytes(compressedFiles["hud_tiles.bin"]),
    );

    expect(asmBytes).toEqual(rawBytes);
    expect(binBytes).toEqual(rawBytes);
    expect(asmBytes).toEqual(binBytes);
  });
});

// ─── Sprites ────────────────────────────────────────────────────────────────

describe("CSpritesCodeGeneratorStrategy: plain defb ≡ ZX0-decompressed bin", () => {
  it("produces byte-identical payloads across plain .asm, compressed .bin and buildSpritesBinary", () => {
    const sprite = makeSpriteModel();
    const spriteBitmasks = [[new Array(64).fill(true)]];

    const params = {
      name: "player",
      sprites: [sprite],
      spriteFlags: 0,
      spriteBitmasks,
    };

    const plainFiles = filesByName(
      new CSpritesCodeGeneratorStrategy().generate(params),
    );
    const compressedFiles = filesByName(
      new CSpritesCodeGeneratorStrategy().generate({ ...params, compressed: true }),
    );

    const rawBytes = buildSpritesBinary({
      sprites: [
        { width: 8, height: 8, frames: [{ x: 0, y: 0 }] },
      ],
      spriteBitmasks,
      hasPadding: false,
      useMask: false,
    });

    const asmBytes = parseDefbLines(plainFiles["player.asm"]);
    const binBytes = decompress(base64ToBytes(compressedFiles["player.bin"]));

    expect(asmBytes).toEqual(rawBytes);
    expect(binBytes).toEqual(rawBytes);
    expect(asmBytes).toEqual(binBytes);
  });
});

// ─── Map ────────────────────────────────────────────────────────────────────

describe("CMapCodeGenerator: plain defb ≡ ZX0-decompressed bin", () => {
  it("produces byte-identical payloads across plain .asm, compressed .bin and buildMapIndicesBinary", () => {
    const params = {
      name: "hud_map",
      metadata: makeMapModel(),
      tileIndices: [1, 2, 3, 4, 5, 6, 7, 8],
    };

    const plainFiles = filesByName(new CMapCodeGenerator().generate(params));
    const compressedFiles = filesByName(
      new CMapCodeGenerator().generate({ ...params, compressed: true }),
    );

    const rawBytes = buildMapIndicesBinary(params.tileIndices);

    const asmBytes = parseDefbLines(plainFiles["hud_map.asm"]);
    const binBytes = decompress(base64ToBytes(compressedFiles["hud_map.bin"]));

    expect(asmBytes).toEqual(rawBytes);
    expect(binBytes).toEqual(rawBytes);
    expect(asmBytes).toEqual(binBytes);
  });
});