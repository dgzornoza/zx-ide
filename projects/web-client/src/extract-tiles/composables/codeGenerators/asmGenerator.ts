import { GeneratedFile } from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy";
import {
  buildMapFile,
  CodeGeneratorStrategy,
  getIncludedTileIndices,
  TilesCodeGeneratorParams,
} from "src/extract-tiles/composables/codeGenerators/codeGeneratorStrategy";
import {
  generateAttributeDefbLines,
  generateBitmapDefbLines,
} from "src/helpers/code-generator-utils";
import { toCodeIdentifier } from "src/helpers/string-utils";

/**
 * Generates tiles for a sjasmplus assembly language.
 * Produces a `.cfg` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary tile data.
 */
export class AsmTilesCodeGeneratorStrategy implements CodeGeneratorStrategy {
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
