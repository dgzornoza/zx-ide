/**
 * Code generators for tile-based graphics exports.
 *
 * Provides strategy interfaces for tiles, each with two
 * concrete implementations selected via the factory functions:
 *
 * Tiles:
 * - `"c"`   → {@link CTilesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmTilesCodeGeneratorStrategy} (sjasmplus assembly)
 */

import {
  GeneratedFile,
  TilesCodeGeneratorParams,
  TilesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/codeGenerators/codeGeneratorStrategy";
import { generateBitmapDefbLines } from "src/extract-graphics/composables/codeGenerators/codeGeneratorUtils";
import { TilesMapModel } from "src/extract-graphics/models/tilesDefinition";
import { toCodeIdentifier, toMacroGuard } from "src/utils/string-utils";

// ─── Helpers ───────────────────────────────────────────────

/** Builds the serialisable `.map` model from tiles params. */
function buildTilesMap(params: TilesCodeGeneratorParams): TilesMapModel {
  const { tiles } = params;
  return {
    type: "tiles",
    tileWidth: tiles.tileWidth,
    tileHeight: tiles.tileHeight,
    names: [...tiles.names],
  };
}

/** Creates the `.map` {@link GeneratedFile} entry. */
function buildMapFile(params: TilesCodeGeneratorParams): GeneratedFile {
  return {
    fileType: "map",
    fileName: `${params.name}.map`,
    content: JSON.stringify(buildTilesMap(params), null, 2),
  };
}

// ─── C Tiles ───────────────────────────────────────────────

/**
 * Generates tiles for a z88dk C language.
 * Produces a `.map` file, a C header (`.h`) with `extern` declarations,
 * and a Z88DK assembly file (`.asm`) with tile binary data in the
 * `rodata_user` section.
 */
export class CTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const tileNames = params.tiles.names.slice(0, params.tiles.count);
    const headerContent = this.generateHeaderFile(params.name, tileNames);
    const asmContent = this.generateAsmFile(params, tileNames);

    return [
      buildMapFile(params),
      {
        fileType: "c-header",
        fileName: `${params.name}.h`,
        content: headerContent,
      },
      {
        fileType: "asm",
        fileName: `${params.name}.asm`,
        content: asmContent,
      },
    ];
  }

  private generateHeaderFile(baseName: string, tileNames: string[]): string {
    const id = toCodeIdentifier(baseName);
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

  private generateAsmFile(
    params: TilesCodeGeneratorParams,
    tileNames: string[],
  ): string {
    const { name, tiles } = params;
    const id = toCodeIdentifier(name);

    const lines: string[] = [
      "// Read-Only Data Section for User Module",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}_tiles`,
      `_${id}_tiles:`,
    ];

    tileNames.forEach((name, tileIndex) => {
      const tileName = `_${id}_${name}`;
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];

      lines.push(
        "",
        `PUBLIC ${tileName}`,
        `${tileName}:`,
        ...generateBitmapDefbLines(bitmask, tiles.tileWidth, tiles.tileHeight),
      );
    });

    lines.push("");
    return lines.join("\n");
  }
}

// ─── ASM Tiles ───────────────────────────────────────────────

/**
 * Generates tiles for a sjasmplus assembly language.
 * Produces a `.map` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary tile data.
 */
export class AsmTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const { name: baseName, tiles } = params;
    const tileNames = tiles.names.slice(0, tiles.count);
    const id = toCodeIdentifier(baseName);

    const lines: string[] = [`${id}_tiles:`];

    tileNames.forEach((name, tileIndex) => {
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];

      lines.push(
        "",
        `${id}_${name}:`,
        ...generateBitmapDefbLines(bitmask, tiles.tileWidth, tiles.tileHeight),
      );
    });

    lines.push("");
    return [
      buildMapFile(params),
      {
        fileType: "asm",
        fileName: `${baseName}.asm`,
        content: lines.join("\n"),
      },
    ];
  }
}
