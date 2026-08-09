import {
  buildAttributeBytes,
  buildTilesBinary,
} from "src/helpers/binary-builder-utils";
import { bytesToBase64 } from "src/helpers/binary-utils";
import {
  formatAttributeBytesAsDefb,
  formatBytesAsDefb,
} from "src/helpers/code-generator-utils";
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";
import { compress as compressZx0 } from "src/helpers/zx0-compress";
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
export class CTilesCodeGeneratorStrategy implements CodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    if (params.compressed) {
      return this.generateCompressed(params);
    }
    return this.generatePlain(params);
  }

  private generatePlain(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const includedIndices = getIncludedTileIndices(params);
    const hasAttributes = (params.tiles.attributes?.length ?? 0) > 0;
    const headerContent = this.generatePlainHeaderFile(
      params.name,
      hasAttributes,
    );
    const asmContent = this.generatePlainAsmFile(params, includedIndices);

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

  private generateCompressed(
    params: TilesCodeGeneratorParams,
  ): GeneratedFile[] {
    const includedIndices = getIncludedTileIndices(params);
    const hasAttributes = (params.tiles.attributes?.length ?? 0) > 0;

    const rawBytes = buildTilesBinary({
      inkBitmaps: params.tiles.inkBitmaps,
      tileWidth: params.tiles.tileWidth,
      tileHeight: params.tiles.tileHeight,
      attributes: params.tiles.attributes,
      includedIndices,
    });

    // ZX0-compress the raw payload in the webview. The base64-encoded
    // compressed bytes travel through the DTO; both VS Code and standalone
    // ZIP paths write them to disk as-is.
    const compressedBytes = compressZx0(rawBytes).data;

    const perTileBytes =
      Math.ceil(params.tiles.tileWidth / 8) * params.tiles.tileHeight;
    const tileCount = includedIndices.length;
    const pixmapSize = tileCount * perTileBytes;
    const attrsSize = hasAttributes ? tileCount : 0;
    const totalSize = pixmapSize + attrsSize;

    return [
      buildMapFile(params),
      {
        fileType: "c-header",
        fileName: `${params.name}.h`,
        content: this.generateCompressedHeaderFile(params.name, {
          tileCount,
          perTileBytes,
          attrsSize,
        }),
      },
      {
        fileType: "asm",
        fileName: `${params.name}.asm`,
        content: this.generateCompressedAsmFile(params.name, {
          pixmapSize,
          attrsSize,
          totalSize,
          compressedSize: compressedBytes.length,
        }),
      },
      {
        fileType: "binary",
        fileName: `${params.name}.bin`,
        content: bytesToBase64(compressedBytes),
      },
    ];
  }

  private generatePlainHeaderFile(
    baseName: string,
    hasAttributes: boolean,
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);

    const lines: string[] = [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `extern const uint8_t ${id}[];`,
    ];

    if (hasAttributes) {
      lines.push(`extern const uint8_t ${id}_attributes[];`);
    }

    lines.push("", `#endif // __DATA_${guard}_H__`, "");

    return lines.join("\n");
  }

  private generateCompressedHeaderFile(
    baseName: string,
    sizes: {
      tileCount: number;
      perTileBytes: number;
      attrsSize: number;
    },
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const { tileCount, perTileBytes, attrsSize } = sizes;

    return [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `#define ${guard}_TILES_COUNT       ${tileCount}u`,
      `#define ${guard}_PIXMAP_SIZE (${guard}_TILES_COUNT * ${perTileBytes}u)`,
      `#define ${guard}_ATTRS_SIZE  ${attrsSize}u`,
      `#define ${guard}_TOTAL_SIZE  (${guard}_PIXMAP_SIZE + ${guard}_ATTRS_SIZE)`,
      "",
      `extern const uint8_t ${id}_compressed[];`,
      "",
      `#endif // __DATA_${guard}_H__`,
      "",
    ].join("\n");
  }

  private generateCompressedAsmFile(
    baseName: string,
    sizes: {
      pixmapSize: number;
      attrsSize: number;
      totalSize: number;
      compressedSize: number;
    },
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const incbinPath = `${baseName}.bin`;

    return [
      `; ${guard}_PIXMAP_SIZE: ${sizes.pixmapSize}`,
      `; ${guard}_ATTRS_SIZE: ${sizes.attrsSize}`,
      `; ${guard}_TOTAL_SIZE: ${sizes.totalSize}`,
      `; Compressed Size: ${sizes.compressedSize} bytes (ZX0 standard)`,
      "",
      "; incbin path is resolved relative to the Makefile cwd (project root),",
      "; not relative to this .asm file's location.",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}_compressed`,
      `_${id}_compressed:`,
      `    incbin "${incbinPath}"`,
      "",
    ].join("\n");
  }

  private generatePlainAsmFile(
    params: TilesCodeGeneratorParams,
    includedIndices: number[],
  ): string {
    const { name, tiles } = params;
    const id = toCodeIdentifier(name);
    const hasAttributes = (tiles.attributes?.length ?? 0) > 0;
    const dataByteCount = calculateTilesDataByteCount(params, includedIndices);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    // Compute every tile's bytes (pixmap + optional attribute byte) in one
    // pass through `buildTilesBinary`, then slice per tile for text output.
    // Single source of truth for byte packing — see binary-builder-utils.ts.
    const rawBytes = buildTilesBinary({
      inkBitmaps: tiles.inkBitmaps,
      tileWidth: tiles.tileWidth,
      tileHeight: tiles.tileHeight,
      attributes: tiles.attributes,
      includedIndices,
    });
    const bytesPerTile = Math.ceil(tiles.tileWidth / 8) * tiles.tileHeight;
    const tileStride = bytesPerTile + (hasAttributes ? 1 : 0);

    const lines: string[] = [
      dataSizeComment,
      "; Read-Only Data Section for User Module",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}`,
      `_${id}:`,
    ];

    includedIndices.forEach((_, includedPosition) => {
      const start = includedPosition * tileStride;
      const tileBytes = rawBytes.subarray(start, start + bytesPerTile);
      lines.push("", ...formatBytesAsDefb(tileBytes));
    });

    if (hasAttributes) {
      const attrBytes = buildAttributeBytes(tiles.attributes!, includedIndices);
      lines.push(
        "",
        `PUBLIC _${id}_attributes`,
        `_${id}_attributes:`,
        ...formatAttributeBytesAsDefb(attrBytes),
      );
    }

    lines.push("");
    return lines.join("\n");
  }
}
