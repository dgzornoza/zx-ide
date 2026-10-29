import { buildAttributeBytes, buildTilesBinary } from 'src/helpers/binary-builder-utils';
import { formatAttributeBytesAsDefb, formatBytesAsDefb } from 'src/domain/code-generation/code-formatting';
import { toCodeIdentifier } from 'src/helpers/string-utils';
import { buildDataSizeComment } from 'src/domain/code-generation/code-formatting';
import { CodeGeneratorStrategy, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import {
  buildMapFile,
  calculateTilesDataByteCount,
  getIncludedTileIndices,
  TilesCodeGeneratorParameters,
} from 'src/domain/code-generation/tiles/tiles-code-generation';

/**
 * Generates tiles for a sjasmplus assembly language.
 *
 * Computes tile bytes once via {@link buildTilesBinary} (shared with the
 * compressed-mode generator) and emits them as `defb` directives for the
 * pure-ASM sjasmplus target. Produces a `.cfg` file and a single
 * sjasmplus assembly file (`.asm`).
 */
export class AsmTilesCodeGeneratorStrategy implements CodeGeneratorStrategy<TilesCodeGeneratorParameters> {
  generate(parameters: TilesCodeGeneratorParameters): GeneratedFile[] {
    const { name: baseName, tiles } = parameters;
    const id = toCodeIdentifier(baseName);
    const hasAttributes = (tiles.attributes?.length ?? 0) > 0;
    const includedIndices = getIncludedTileIndices(parameters);

    const dataByteCount = calculateTilesDataByteCount(parameters, includedIndices);
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
      lines.push('', ...formatBytesAsDefb(tileBytes));
    });

    if (hasAttributes) {
      const attributeBytes = buildAttributeBytes(tiles.attributes!, includedIndices);
      lines.push('', `${id}_attributes:`, ...formatAttributeBytesAsDefb(attributeBytes));
    }

    lines.push('');
    return [
      buildMapFile(parameters),
      {
        fileType: 'asm',
        fileName: `${baseName}.asm`,
        content: lines.join('\n'),
      },
    ];
  }
}
