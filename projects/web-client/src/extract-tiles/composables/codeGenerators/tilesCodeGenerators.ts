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
import type { ZxpColorAttribute } from "src/utils/image-utils";
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
    excluded: tiles.excluded ? [...tiles.excluded] : [],
  };
}

/** Returns tile indices excluding those in `tiles.excludedSet`. */
function getIncludedTileIndices(params: TilesCodeGeneratorParams): number[] {
  const { tiles } = params;
  const excludedSet = tiles.excludedSet ?? new Set<number>();
  return Array.from({ length: tiles.count }, (_, i) => i).filter(
    (i) => !excludedSet.has(i),
  );
}

/**
 * Converts a {@link ZxpColorAttribute} to its ZX Spectrum raw attribute byte.
 *
 * Bit layout:
 * - Bit 7: Flash
 * - Bit 6: Bright
 * - Bits 5–3: Paper colour index
 * - Bits 2–0: Ink colour index
 */
function attributeToByte(attribute: ZxpColorAttribute): number {
  return (
    (attribute.flash ? 0x80 : 0) |
    (attribute.bright ? 0x40 : 0) |
    ((attribute.paper & 0x07) << 3) |
    (attribute.ink & 0x07)
  );
}

/** Formats a single byte as a `$XX` hex string for use in `defb` directives. */
function toAttributeHexByte(value: number): string {
  return `$${value.toString(16).padStart(2, "0").toUpperCase()}`;
}

/**
 * Generates `defb` lines for the tile attributes array,
 * including only the tiles at `includedIndices`, 8 bytes per line.
 */
function generateAttributeDefbLines(
  attributes: ZxpColorAttribute[],
  includedIndices: number[],
): string[] {
  const hexBytes = includedIndices.map((tileIndex) => {
    const attribute = attributes[tileIndex] ?? {
      flash: false,
      bright: false,
      paper: 7,
      ink: 0,
    };
    return toAttributeHexByte(attributeToByte(attribute));
  });

  const lines: string[] = [];
  for (let offset = 0; offset < hexBytes.length; offset += 8) {
    lines.push(`    defb ${hexBytes.slice(offset, offset + 8).join(",")}`);
  }
  return lines;
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
    const includedIndices = getIncludedTileIndices(params);
    const hasAttributes = (params.tiles.attributes?.length ?? 0) > 0;
    const headerContent = this.generateHeaderFile(params.name, hasAttributes);
    const asmContent = this.generateAsmFile(params, includedIndices);

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

  private generateHeaderFile(baseName: string, hasAttributes: boolean): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);

    const lines: string[] = [
      `#ifndef __${guard}_H__`,
      `#define __${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `extern const uint8_t ${id}_tiles[];`,
    ];

    if (hasAttributes) {
      lines.push(`extern const uint8_t ${id}_tiles_attributes[];`);
    }

    lines.push("", `#endif // __${guard}_H__`, "");

    return lines.join("\n");
  }

  private generateAsmFile(
    params: TilesCodeGeneratorParams,
    includedIndices: number[],
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

    includedIndices.forEach((tileIndex) => {
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];
      lines.push(
        "",
        ...generateBitmapDefbLines(bitmask, tiles.tileWidth, tiles.tileHeight),
      );
    });

    if (tiles.attributes && tiles.attributes.length > 0) {
      lines.push(
        "",
        `PUBLIC _${id}_tiles_attributes`,
        `_${id}_tiles_attributes:`,
        ...generateAttributeDefbLines(tiles.attributes, includedIndices),
      );
    }

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
    const includedIndices = getIncludedTileIndices(params);

    const lines: string[] = [`${id}_tiles:`];

    includedIndices.forEach((tileIndex) => {
      const bitmask = tiles.inkBitmaps[tileIndex] ?? [];

      lines.push(
        "",
        ...generateBitmapDefbLines(bitmask, tiles.tileWidth, tiles.tileHeight),
      );
    });

    if (tiles.attributes && tiles.attributes.length > 0) {
      lines.push(
        "",
        `${id}_tiles_attributes:`,
        ...generateAttributeDefbLines(tiles.attributes, includedIndices),
      );
    }

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
