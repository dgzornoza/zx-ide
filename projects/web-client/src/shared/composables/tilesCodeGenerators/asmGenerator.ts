import {
  buildAttributeBytes,
  buildTilesBinary,
} from "src/helpers/binary-builder-utils";
import {
  formatAttributeBytesAsDefb,
  formatBytesAsDefb,
} from "src/helpers/code-generator-utils";
import { toCodeIdentifier } from "src/helpers/string-utils";
import {
  buildDataSizeComment,
  buildMapFile,
  calculateTilesDataByteCount,
  CodeGeneratorStrategy,
  GeneratedFile,
  getIncludedTileIndices,
  TilesCodeGeneratorParams,
} from "src/shared/composables/tilesCodeGenerators/codeGeneratorStrategy";

/**
 * Generates tiles for a sjasmplus assembly language.
 *
 * Computes tile bytes once via {@link buildTilesBinary} (shared with the
 * compressed-mode generator) and emits them as `defb` directives for the
 * pure-ASM sjasmplus target. Produces a `.cfg` file and a single
 * sjasmplus assembly file (`.asm`).
 */
export class AsmTilesCodeGeneratorStrategy implements CodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const { name: baseName, tiles } = params;
    const id = toCodeIdentifier(baseName);
    const hasAttributes = (tiles.attributes?.length ?? 0) > 0;
    const includedIndices = getIncludedTileIndices(params);

    const dataByteCount = calculateTilesDataByteCount(params, includedIndices);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const rawBytes = buildTilesBinary({
      inkBitmaps: tiles.inkBitmaps,
      tileWidth: tiles.tileWidth,
      tileHeight: tiles.tileHeight,
      attributes: tiles.attributes,
      includedIndices,
    });
    const bytesPerTile = Math.ceil(tiles.tileWidth / 8) * tiles.tileHeight;
    // Contiguous layout: each tile's bitmap occupies exactly `bytesPerTile` bytes.
    const tileStride = bytesPerTile;

    const lines: string[] = [dataSizeComment, `${id}:`];

    includedIndices.forEach((_, includedPosition) => {
      const start = includedPosition * tileStride;
      const tileBytes = rawBytes.subarray(start, start + bytesPerTile);
      lines.push("", ...formatBytesAsDefb(tileBytes));
    });

    if (hasAttributes) {
      const attrBytes = buildAttributeBytes(tiles.attributes!, includedIndices);
      lines.push("", `${id}_attributes:`, ...formatAttributeBytesAsDefb(attrBytes));
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
