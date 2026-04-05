import {
  buildDataSizeComment,
  buildHeader,
  calculateMapDataByteCount,
  CodeGeneratorStrategy,
  GeneratedFile,
  MapCodeGeneratorParams,
} from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy";
import { generateIndexDefbLines } from "src/helpers/code-generator-utils";
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";

/**
 * C code generator for maps (C header + ASM data).
 *
 * Implements `CodeGeneratorStrategy` and produces a C header file with
 * macro guards and an `extern` declaration, plus an accompanying ASM
 * file that contains the tile index data as `defb` lines.
 */
export class CMapCodeGenerator implements CodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight } = metadata;
    const identifier = toCodeIdentifier(name);
    const macroGuard = toMacroGuard(name);
    const header = buildHeader(name, mapWidth, mapHeight);
    const rows = generateIndexDefbLines(tileIndices, mapWidth);

    const dataByteCount = calculateMapDataByteCount(params);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const headerContent = [
      `#ifndef ${macroGuard}_H`,
      `#define ${macroGuard}_H`,
      "",
      `// ${header.slice(2)}`,
      `#define ${macroGuard}_WIDTH  ${mapWidth}`,
      `#define ${macroGuard}_HEIGHT ${mapHeight}`,
      `#define ${macroGuard}_SIZE   ${mapWidth * mapHeight}`,
      `extern unsigned char ${identifier}[${mapHeight}][${mapWidth}];`,
      "",
      `#endif`,
      "",
    ].join("\n");

    const asmContent = [
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
}
