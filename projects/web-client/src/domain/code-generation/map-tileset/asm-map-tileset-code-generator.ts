import { buildDataSizeComment } from 'src/domain/code-generation/code-formatting';
import { CodeGeneratorStrategy, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import {
  buildHeader,
  calculateMapDataByteCount,
  MapCodeGeneratorParams,
} from 'src/domain/code-generation/map-tileset/map-tileset-code-generation';
import { buildMapIndicesBinary } from 'src/helpers/binary-builder-utils';
import { formatIndicesAsDefb } from 'src/domain/code-generation/code-formatting';
import { toCodeIdentifier, toMacroGuard } from 'src/helpers/string-utils';

/**
 * ASM code generator for maps.
 *
 * Implements `CodeGeneratorStrategy` and converts map parameters into
 * one or more ASM output files. The generated file contains a header,
 * an identifier label derived from the map name, and `defb` lines that
 * represent tile indices per row.
 */
export class AsmMapCodeGenerator implements CodeGeneratorStrategy<MapCodeGeneratorParams> {
  generate(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight, tileCount } = metadata;
    const identifier = toCodeIdentifier(name);
    const macroGuard = toMacroGuard(name);
    const header = buildHeader(name, mapWidth, mapHeight);

    const indexBytes = buildMapIndicesBinary(tileIndices);
    const rows = formatIndicesAsDefb(indexBytes, mapWidth);

    const dataByteCount = calculateMapDataByteCount(params);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const content = [
      `; ${macroGuard}_WIDTH: ${mapWidth}`,
      `; ${macroGuard}_HEIGHT: ${mapHeight}`,
      `; ${macroGuard}_SIZE: ${mapWidth * mapHeight}`,
      `; ${macroGuard}_TILES_COUNT: ${tileCount}`,
      dataSizeComment,
      header,
      `${identifier}:`,
      ...rows,
      '',
    ].join('\n');

    return [
      {
        fileType: 'asm',
        fileName: `${name}.asm`,
        content,
      },
    ];
  }
}
