import {
  buildDataSizeComment,
  buildMapFile,
  calculateTilesDataByteCount,
  CodeGeneratorStrategy,
  GeneratedFile,
  getIncludedTileIndices,
  TilesCodeGeneratorParams,
} from "src/extract-tiles/composables/codeGenerators/codeGeneratorStrategy";
import {
  generateAttributeDefbLines,
  generateBitmapDefbLines,
} from "src/helpers/code-generator-utils";
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";

/**
 * Generates tiles for a z88dk C language.
 * Produces a `.cfg` file, a C header (`.h`) with `extern` declarations,
 * and a Z88DK assembly file (`.asm`) with tile binary data in the
 * `rodata_user` section.
 */
export class CTilesCodeGeneratorStrategy implements CodeGeneratorStrategy {
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
      `extern const uint8_t ${id}[];`,
    ];

    if (hasAttributes) {
      lines.push(`extern const uint8_t ${id}_attributes[];`);
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
    const dataByteCount = calculateTilesDataByteCount(params, includedIndices);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const lines: string[] = [
      dataSizeComment,
      "; Read-Only Data Section for User Module",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}`,
      `_${id}:`,
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
        `PUBLIC _${id}_attributes`,
        `_${id}_attributes:`,
        ...generateAttributeDefbLines(tiles.attributes, includedIndices),
      );
    }

    lines.push("");
    return lines.join("\n");
  }
}
