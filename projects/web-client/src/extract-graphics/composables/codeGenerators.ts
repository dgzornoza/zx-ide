/**
 * Code generators for tile-based and sprite-based graphics exports.
 *
 * Provides strategy interfaces for tiles and sprites, each with two
 * concrete implementations selected via the factory functions:
 *
 * Tiles:
 * - `"c"`   → {@link CTilesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmTilesCodeGeneratorStrategy} (sjasmplus assembly)
 *
 * Sprites:
 * - `"c"`   → {@link CSpritesCodeGeneratorStrategy}  (stub)
 * - `"asm"` → {@link AsmSpritesCodeGeneratorStrategy} (stub)
 */

import type { CodeGenerationType } from "../../../../shared/extract-graphics/extract-graphics-dtos";
import { generateTileDefbLines } from "../../utils/image-utils";
import { toIdentifier, toMacroGuard } from "../../utils/string-utils";
import type { SpriteDefinition } from "../models/spriteDefinition";

// ─── Public types ─────────────────────────────────────────────────────────────

/** A single generated output file. */
export interface GeneratedFile {
  /** File extension including the dot (e.g. `".h"`, `".asm"`). */
  extension: string;
  /** UTF-8 content of the file. */
  content: string;
  /**
   * Optional sprite name used to build the output filename.
   * Only set by sprite strategies (one file per sprite).
   */
  spriteName?: string;
}

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  baseName: string;
  /** Ordered list of tile names (e.g. `["tile1", "tile2"]`). */
  tileNames: string[];
  /** Tile width in pixels. */
  tileWidth: number;
  /** Tile height in pixels. */
  tileHeight: number;
  /**
   * Per-tile pixel bitmask.
   * `bitmasks[i]` is a row-major `boolean[]` of length `tileWidth * tileHeight`.
   * `true` = ink pixel.
   */
  bitmasks: boolean[][];
}

/** Parameters for sprite code-generation strategies. */
export interface SpritesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  baseName: string;
  /** Full list of sprite definitions (including frame coordinates). */
  sprites: SpriteDefinition[];
}

/**
 * @deprecated Use {@link TilesCodeGeneratorParams} instead.
 */
export type CodeGeneratorParams = TilesCodeGeneratorParams;

// ─── Strategy interfaces ──────────────────────────────────────────────────────

/** Strategy that produces one or more source files from tile data. */
export interface TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}

/**
 * Strategy that produces one source file per sprite.
 * Each returned {@link GeneratedFile} has `spriteName` set.
 */
export interface SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[];
}

/**
 * @deprecated Use {@link TilesCodeGeneratorStrategy} instead.
 */
export type CodeGeneratorStrategy = TilesCodeGeneratorStrategy;

// ─── Tile factories ────────────────────────────────────────────────────────────

/**
 * Returns the appropriate {@link TilesCodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createTilesCodeGenerator(
  type: CodeGenerationType,
): TilesCodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CTilesCodeGeneratorStrategy();
    case "asm":
      return new AsmTilesCodeGeneratorStrategy();
  }
}

/**
 * Returns the appropriate {@link SpritesCodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createSpritesCodeGenerator(
  type: CodeGenerationType,
): SpritesCodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CSpritesCodeGeneratorStrategy();
    case "asm":
      return new AsmSpritesCodeGeneratorStrategy();
  }
}

/**
 * @deprecated Use {@link createTilesCodeGenerator} instead.
 */
export function createCodeGenerator(
  type: CodeGenerationType,
): TilesCodeGeneratorStrategy {
  return createTilesCodeGenerator(type);
}

// ─── C strategy (Z88DK) ──────────────────────────────────────────────────────

// ─── C tiles strategy (Z88DK) ───────────────────────────────────────────────

/**
 * Generates a C header (`.h`) with `extern` declarations and a Z88DK assembly
 * file (`.asm`) with tile binary data in the `rodata_user` section.
 */
class CTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const headerContent = this.generateHeaderFile(
      params.baseName,
      params.tileNames,
    );
    const asmContent = this.generateAsmFile(params);

    return [
      { extension: ".h", content: headerContent },
      { extension: ".asm", content: asmContent },
    ];
  }

  private generateHeaderFile(baseName: string, tileNames: string[]): string {
    const id = toIdentifier(baseName);
    const guard = toMacroGuard(baseName);

    const lines: string[] = [
      `#ifndef __${guard}_H__`,
      `#define __${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `extern const uint8_t ${id}_tiles[];`,
      ...tileNames.map((name) => `extern const uint8_t ${id}_${name}[];`),
      "",
      `#endif // __${guard}_H__`,
      "",
    ];

    return lines.join("\n");
  }

  private generateAsmFile(params: TilesCodeGeneratorParams): string {
    const { baseName, tileNames, tileWidth, tileHeight, bitmasks } = params;
    const id = toIdentifier(baseName);

    const lines: string[] = [
      "// Read-Only Data Section for User Module",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}_tiles`,
      `_${id}_tiles:`,
    ];

    tileNames.forEach((name, tileIndex) => {
      const tileName = `_${id}_${name}`;
      const bitmask = bitmasks[tileIndex] ?? [];

      lines.push(
        "",
        `PUBLIC ${tileName}`,
        `${tileName}:`,
        ...generateTileDefbLines(bitmask, tileWidth, tileHeight),
      );
    });

    lines.push("");
    return lines.join("\n");
  }
}

// ─── ASM tiles strategy (sjasmplus) ────────────────────────────────────────

/**
 * Generates a single sjasmplus assembly file (`.asm`) with plain labels and
 * `defb @XXXXXXXX` binary tile data.
 */
class AsmTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const { baseName, tileNames, tileWidth, tileHeight, bitmasks } = params;
    const id = toIdentifier(baseName);

    const lines: string[] = [`${id}_tiles:`];

    tileNames.forEach((name, tileIndex) => {
      const bitmask = bitmasks[tileIndex] ?? [];

      lines.push(
        "",
        `${id}_${name}:`,
        ...generateTileDefbLines(bitmask, tileWidth, tileHeight),
      );
    });

    lines.push("");
    return [{ extension: ".asm", content: lines.join("\n") }];
  }
}

// ─── C sprites strategy (Z88DK) ──────────────────────────────────────────────

/**
 * Generates a C source file per sprite for Z88DK.
 * @todo Implementation pending.
 */
class CSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(_params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [];
  }
}

// ─── ASM sprites strategy (sjasmplus) ────────────────────────────────────────

/**
 * Generates a sjasmplus assembly file per sprite.
 * @todo Implementation pending.
 */
class AsmSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(_params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [];
  }
}
