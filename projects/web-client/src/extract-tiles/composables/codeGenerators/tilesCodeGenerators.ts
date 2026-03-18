/**
 * Code generators for tile-based graphics exports.
 *
 * Provides two concrete implementations selected by {@link createTilesCodeGenerator}:
 *
 * - `"c"`   → {@link CTilesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmTilesCodeGeneratorStrategy} (sjasmplus assembly)
 */

import {
  GeneratedFile,
  TilesCodeGeneratorParams,
  TilesCodeGeneratorStrategy,
} from "src/extract-tiles/composables/codeGenerators/codeGeneratorStrategy";
import { TilesMapModel } from "src/extract-tiles/models/tilesDefinition";
import { generateBitmapDefbLines } from "src/shared/composables/codeGenerators/codeGeneratorUtils";
import { toCodeIdentifier, toMacroGuard } from "src/utils/string-utils";
import type { CodeGenerationType } from "../../../../../shared/extract-graphics/extract-graphics-dtos";

// ─── Helpers ───────────────────────────────────────────────

/** Builds the serialisable `.tiles.map` model from tiles params. */
function buildTilesMap(params: TilesCodeGeneratorParams): TilesMapModel {
  const { tiles } = params;
  return {
    type: "tiles",
    tileWidth: tiles.tileWidth,
    tileHeight: tiles.tileHeight,
    names: [...tiles.names],
    excluded: tiles.excluded ? [...tiles.excluded] : [],
  };
}

/** Returns tile names with their original indices, excluding those in `tiles.excludedSet`. */
function getIncludedTileEntries(
  params: TilesCodeGeneratorParams,
): { tileIndex: number; tileName: string }[] {
  const { tiles } = params;
  const excludedSet = tiles.excludedSet ?? new Set<number>();
  return tiles.names
    .slice(0, tiles.count)
    .map((tileName, tileIndex) => ({ tileIndex, tileName }))
    .filter(({ tileIndex }) => !excludedSet.has(tileIndex));
}

/** Creates the `.tiles.map` {@link GeneratedFile} entry. */
function buildMapFile(params: TilesCodeGeneratorParams): GeneratedFile {
  return {
    fileType: "map",
    fileName: `${params.name}.tiles.map`,
    content: JSON.stringify(buildTilesMap(params), null, 2),
  };
}

// ─── C Tiles ───────────────────────────────────────────────

/**
 * Generates tiles for a z88dk C language.
 * Produces a `.tiles.map` file, a C header (`.h`) with `extern` declarations,
 * and a Z88DK assembly file (`.asm`) with tile binary data in the
 * `rodata_user` section.
 */
export class CTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const includedEntries = getIncludedTileEntries(params);
    const tileNames = includedEntries.map(({ tileName }) => tileName);
    const headerContent = this.generateHeaderFile(params.name, tileNames);
    const asmContent = this.generateAsmFile(params, includedEntries);

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
    includedEntries: { tileIndex: number; tileName: string }[],
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

    includedEntries.forEach(({ tileIndex, tileName }) => {
      const label = `_${id}_${tileName}`;
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];

      lines.push(
        "",
        `PUBLIC ${label}`,
        `${label}:`,
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
 * Produces a `.tiles.map` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary tile data.
 */
export class AsmTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const { name: baseName, tiles } = params;
    const id = toCodeIdentifier(baseName);
    const includedEntries = getIncludedTileEntries(params);

    const lines: string[] = [`${id}_tiles:`];

    includedEntries.forEach(({ tileIndex, tileName }) => {
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];

      lines.push(
        "",
        `${id}_${tileName}:`,
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

// ─── Factory ───────────────────────────────────────────────

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
