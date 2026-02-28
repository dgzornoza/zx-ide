/**
 * Code generators for tile-based graphics exports.
 *
 * Provides a strategy interface ({@link CodeGeneratorStrategy}) with two
 * concrete implementations selected via {@link createCodeGenerator}:
 *
 * - `"c"`   → {@link CCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmCodeGeneratorStrategy} (sjasmplus assembly)
 */

import type { CodeGenerationType } from "../../../../shared/extract-graphics/extract-graphics-dtos";
import { generateTileDefbLines } from "../../utils/image-utils";
import { toIdentifier, toMacroGuard } from "../../utils/string-utils";

// ─── Public types ─────────────────────────────────────────────────────────────

/** A single generated output file. */
export interface GeneratedFile {
  /** File extension including the dot (e.g. `".h"`, `".asm"`). */
  extension: string;
  /** UTF-8 content of the file. */
  content: string;
}

/** Parameters shared by all code-generation strategies. */
export interface CodeGeneratorParams {
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

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns the appropriate {@link CodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createCodeGenerator(
  type: CodeGenerationType,
): CodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CCodeGeneratorStrategy();
    case "asm":
      return new AsmCodeGeneratorStrategy();
  }
}

/** Strategy that produces one or more source files from tile data. */
export interface CodeGeneratorStrategy {
  generate(params: CodeGeneratorParams): GeneratedFile[];
}

// ─── C strategy (Z88DK) ──────────────────────────────────────────────────────

/**
 * Generates a C header (`.h`) with `extern` declarations and a Z88DK assembly
 * file (`.asm`) with tile binary data in the `rodata_user` section.
 */
class CCodeGeneratorStrategy implements CodeGeneratorStrategy {
  generate(params: CodeGeneratorParams): GeneratedFile[] {
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

  private generateAsmFile(params: CodeGeneratorParams): string {
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

// ─── ASM strategy (sjasmplus) ─────────────────────────────────────────────────

/**
 * Generates a single sjasmplus assembly file (`.asm`) with plain labels and
 * `defb @XXXXXXXX` binary tile data.
 */
class AsmCodeGeneratorStrategy implements CodeGeneratorStrategy {
  generate(params: CodeGeneratorParams): GeneratedFile[] {
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
