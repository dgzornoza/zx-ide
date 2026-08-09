import {
  buildDataSizeComment,
  buildHeader,
  calculateMapDataByteCount,
  CodeGeneratorStrategy,
  GeneratedFile,
  MapCodeGeneratorParams,
} from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy";
import { buildMapIndicesBinary } from "src/helpers/binary-builder-utils";
import { bytesToBase64 } from "src/helpers/binary-utils";
import { formatIndicesAsDefb } from "src/helpers/code-generator-utils";
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";
import { compress as compressZx0 } from "src/helpers/zx0-compress";

/**
 * C code generator for maps.
 *
 * Implements `CodeGeneratorStrategy` and produces a C header file with
 * macro guards and `extern` declarations, plus an accompanying ASM file.
 *
 * Two output modes:
 *   - **Plain** (default): `.h` with a 2D array extern (rows × cols),
 *     `.asm` with `defb` lines for each row.
 *   - **Compressed** (`compressed: true`): `.h` with a single
 *     `<name>_compressed[]` extern + dimensions `#define`s, `.asm`
 *     with one `incbin "<name>.bin"`, and `.bin` with raw uncompressed
 *     bytes (base64-encoded for transport.
 */
export class CMapCodeGenerator implements CodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[] {
    if (params.compressed) {
      return this.generateCompressed(params);
    }
    return this.generatePlain(params);
  }

  private generatePlain(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight, tileCount } = metadata;
    const identifier = toCodeIdentifier(name);
    const macroGuard = toMacroGuard(name);
    const header = buildHeader(name, mapWidth, mapHeight);

    // Build the indices bytes once, then format them as text. This keeps
    // a single source of truth for the byte representation across plain
    // and compressed outputs.
    const indexBytes = buildMapIndicesBinary(tileIndices);
    const rows = formatIndicesAsDefb(indexBytes, mapWidth);

    const dataByteCount = calculateMapDataByteCount(params);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const headerContent = [
      `#ifndef __DATA_${macroGuard}_H__`,
      `#define __DATA_${macroGuard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `// ${header.slice(2)}`,
      `#define ${macroGuard}_WIDTH  ${mapWidth}`,
      `#define ${macroGuard}_HEIGHT ${mapHeight}`,
      `#define ${macroGuard}_SIZE   ${mapWidth * mapHeight}`,
      `#define ${macroGuard}_TILES_COUNT ${tileCount}`,
      `extern uint8_t ${identifier}[${mapHeight}][${mapWidth}];`,
      "",
      `#endif // __DATA_${macroGuard}_H__`,
      "",
    ].join("\n");

    const asmContent = [
      `; ${macroGuard}_WIDTH: ${mapWidth}`,
      `; ${macroGuard}_HEIGHT: ${mapHeight}`,
      `; ${macroGuard}_SIZE: ${mapWidth * mapHeight}`,
      `; ${macroGuard}_TILES_COUNT: ${tileCount}`,
      dataSizeComment,
      "SECTION rodata_user",
      `PUBLIC _${identifier}`,
      "",
      header,
      `_${identifier}:`,
      ...rows,
      "",
    ].join("\n");

    return [
      {
        fileType: "c-header",
        fileName: `${name}.h`,
        content: headerContent,
      },
      {
        fileType: "asm",
        fileName: `${name}.asm`,
        content: asmContent,
      },
    ];
  }

  private generateCompressed(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight, tileCount } = metadata;
    const identifier = toCodeIdentifier(name);
    const macroGuard = toMacroGuard(name);
    const totalSize = mapWidth * mapHeight;

    const rawBytes = buildMapIndicesBinary(tileIndices);
    const compressedBytes = compressZx0(rawBytes).data;

    const headerContent = [
      `#ifndef __DATA_${macroGuard}_H__`,
      `#define __DATA_${macroGuard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `#define ${macroGuard}_WIDTH       ${mapWidth}u`,
      `#define ${macroGuard}_HEIGHT      ${mapHeight}u`,
      `#define ${macroGuard}_TOTAL_SIZE  (${macroGuard}_WIDTH * ${macroGuard}_HEIGHT)`,
      `#define ${macroGuard}_TILES_COUNT ${tileCount}u`,
      "",
      `extern const uint8_t ${identifier}_compressed[];`,
      "",
      `#endif // __DATA_${macroGuard}_H__`,
      "",
    ].join("\n");

    const asmContent = [
      `; ${macroGuard}_WIDTH: ${mapWidth}`,
      `; ${macroGuard}_HEIGHT: ${mapHeight}`,
      `; ${macroGuard}_TOTAL_SIZE: ${totalSize}`,
      `; ${macroGuard}_TILES_COUNT: ${tileCount}`,
      `; Compressed Size: ${compressedBytes.length} bytes (ZX0 standard)`,
      "; incbin path is resolved relative to the Makefile cwd (project root),",
      "; not relative to this .asm file's location.",
      "",
      "SECTION rodata_user",
      "",
      `PUBLIC _${identifier}_compressed`,
      `_${identifier}_compressed:`,
      `    incbin "${name}.bin"`,
      "",
    ].join("\n");

    return [
      {
        fileType: "c-header",
        fileName: `${name}.h`,
        content: headerContent,
      },
      {
        fileType: "asm",
        fileName: `${name}.asm`,
        content: asmContent,
      },
      {
        fileType: "binary",
        fileName: `${name}.bin`,
        content: bytesToBase64(compressedBytes),
      },
    ];
  }
}
