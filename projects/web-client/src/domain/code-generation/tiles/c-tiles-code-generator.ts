import { buildAttributeBytes, buildTilesBinary } from 'src/helpers/binary-builder-utils';
import { bytesToBase64 } from 'src/helpers/binary-utils';
import { formatAttributeBytesAsDefb, formatBytesAsDefb } from 'src/domain/code-generation/code-formatting';
import { toCodeIdentifier, toMacroGuard } from 'src/helpers/string-utils';
import { compress as compressZx0 } from 'src/helpers/zx0-compress';
import { buildDataSizeComment } from 'src/domain/code-generation/code-formatting';
import { CodeGeneratorStrategy, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import {
  buildMapFile,
  calculateTilesDataByteCount,
  getIncludedTileIndices,
  TilesCodeGeneratorParameters,
} from 'src/domain/code-generation/tiles/tiles-code-generation';

/**
 * Generates tiles for a z88dk C language.
 *
 * Two output modes:
 *   - **Plain** (default): `.cfg`, `.h` with per-tile labels, `.asm` with
 *     tile bitmaps as `defb` directives in the `rodata_user` section.
 *   - **Compressed** (`compressed: true`): `.cfg`, `.h` with a single
 *     `<name>_compressed[]` extern + uncompressed-size `#define`s, `.asm`
 *     with one `incbin "<name>.bin"`, and `.bin` with raw uncompressed
 *     bytes (base64-encoded for transport
 */
export class CTilesCodeGeneratorStrategy implements CodeGeneratorStrategy<TilesCodeGeneratorParameters> {
  generate(parameters: TilesCodeGeneratorParameters): GeneratedFile[] {
    if (parameters.compressed) {
      return this.generateCompressed(parameters);
    }
    return this.generatePlain(parameters);
  }

  private generatePlain(parameters: TilesCodeGeneratorParameters): GeneratedFile[] {
    const includedIndices = getIncludedTileIndices(parameters);
    const hasAttributes = (parameters.tiles.attributes?.length ?? 0) > 0;
    const headerContent = this.generatePlainHeaderFile(parameters.name, hasAttributes);
    const asmContent = this.generatePlainAsmFile(parameters, includedIndices);

    return [
      buildMapFile(parameters),
      {
        fileType: 'c-header',
        fileName: `${parameters.name}.h`,
        content: headerContent,
      },
      {
        fileType: 'asm',
        fileName: `${parameters.name}.asm`,
        content: asmContent,
      },
    ];
  }

  private generateCompressed(parameters: TilesCodeGeneratorParameters): GeneratedFile[] {
    const includedIndices = getIncludedTileIndices(parameters);
    const hasAttributes = (parameters.tiles.attributes?.length ?? 0) > 0;

    const rawBytes = buildTilesBinary({
      inkBitmaps: parameters.tiles.inkBitmaps,
      tileWidth: parameters.tiles.tileWidth,
      tileHeight: parameters.tiles.tileHeight,
      attributes: parameters.tiles.attributes,
      includedIndices,
    });

    // ZX0-compress the raw payload in the webview. The base64-encoded
    // compressed bytes travel through the DTO and are written to disk
    // by the VS Code extension as-is.
    const compressedBytes = compressZx0(rawBytes).data;

    const perTileBytes = Math.ceil(parameters.tiles.tileWidth / 8) * parameters.tiles.tileHeight;
    const tileCount = includedIndices.length;
    const pixmapSize = tileCount * perTileBytes;
    const attributesSize = hasAttributes ? tileCount : 0;
    const totalSize = pixmapSize + attributesSize;

    return [
      buildMapFile(parameters),
      {
        fileType: 'c-header',
        fileName: `${parameters.name}.h`,
        content: this.generateCompressedHeaderFile(parameters.name, {
          tileCount,
          perTileBytes,
          attributesSize,
        }),
      },
      {
        fileType: 'asm',
        fileName: `${parameters.name}.asm`,
        content: this.generateCompressedAsmFile(parameters.name, {
          pixmapSize,
          attributesSize,
          totalSize,
          compressedSize: compressedBytes.length,
        }),
      },
      {
        fileType: 'binary',
        fileName: `${parameters.name}.bin`,
        content: bytesToBase64(compressedBytes),
      },
    ];
  }

  private generatePlainHeaderFile(baseName: string, hasAttributes: boolean): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);

    const lines: string[] = [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      '',
      '#include <stdint.h>',
      '',
      `extern const uint8_t ${id}[];`,
    ];

    if (hasAttributes) {
      lines.push(`extern const uint8_t ${id}_attributes[];`);
    }

    lines.push('', `#endif // __DATA_${guard}_H__`, '');

    return lines.join('\n');
  }

  private generateCompressedHeaderFile(
    baseName: string,
    sizes: {
      tileCount: number;
      perTileBytes: number;
      attributesSize: number;
    }
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const { tileCount, perTileBytes, attributesSize } = sizes;

    return [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      '',
      '#include <stdint.h>',
      '',
      `#define ${guard}_TILES_COUNT ${tileCount}u`,
      `#define ${guard}_PIXMAP_SIZE (${guard}_TILES_COUNT * ${perTileBytes}u)`,
      `#define ${guard}_ATTRS_SIZE  ${attributesSize}u`,
      `#define ${guard}_TOTAL_SIZE  (${guard}_PIXMAP_SIZE + ${guard}_ATTRS_SIZE)`,
      '',
      `extern const uint8_t ${id}_compressed[];`,
      '',
      `#endif // __DATA_${guard}_H__`,
      '',
    ].join('\n');
  }

  private generateCompressedAsmFile(
    baseName: string,
    sizes: {
      pixmapSize: number;
      attributesSize: number;
      totalSize: number;
      compressedSize: number;
    }
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    // The .bin is written to the same workspace folder as this .asm file
    // (src/data/<source-dir>/), so the incbin resolves locally without a path.
    const incbinPath = `${baseName}.bin`;

    return [
      `; ${guard}_PIXMAP_SIZE: ${sizes.pixmapSize}`,
      `; ${guard}_ATTRS_SIZE: ${sizes.attributesSize}`,
      `; ${guard}_TOTAL_SIZE: ${sizes.totalSize}`,
      `; Compressed Size: ${sizes.compressedSize} bytes (ZX0 standard)`,
      '',
      "; incbin path is resolved relative to this .asm file's location,",
      '; because the .bin is written next to it under src/data/<source-dir>/.',
      'SECTION rodata_user',
      '',
      `PUBLIC _${id}_compressed`,
      `_${id}_compressed:`,
      `    incbin "${incbinPath}"`,
      '',
    ].join('\n');
  }

  private generatePlainAsmFile(parameters: TilesCodeGeneratorParameters, includedIndices: number[]): string {
    const { name, tiles } = parameters;
    const id = toCodeIdentifier(name);
    const hasAttributes = (tiles.attributes?.length ?? 0) > 0;
    const dataByteCount = calculateTilesDataByteCount(parameters, includedIndices);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    // `buildTilesBinary` produces canonical bytes in contiguous layout
    // (all bitmaps, then all attributes). Slice per-tile from the bitmap
    // section; the attribute block is emitted separately below.
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

    const lines: string[] = [
      dataSizeComment,
      '; Read-Only Data Section for User Module',
      'SECTION rodata_user',
      '',
      `PUBLIC _${id}`,
      `_${id}:`,
    ];

    includedIndices.forEach((_, includedPosition) => {
      const start = includedPosition * tileStride;
      const tileBytes = rawBytes.subarray(start, start + bytesPerTile);
      lines.push('', ...formatBytesAsDefb(tileBytes));
    });

    if (hasAttributes) {
      const attributeBytes = buildAttributeBytes(tiles.attributes!, includedIndices);
      lines.push('', `PUBLIC _${id}_attributes`, `_${id}_attributes:`, ...formatAttributeBytesAsDefb(attributeBytes));
    }

    lines.push('');
    return lines.join('\n');
  }
}
