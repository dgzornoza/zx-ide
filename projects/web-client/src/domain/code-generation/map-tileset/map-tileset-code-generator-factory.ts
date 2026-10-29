import type { CodeGenerationType } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { AsmMapCodeGenerator } from 'src/domain/code-generation/map-tileset/asm-map-tileset-code-generator';
import { CMapCodeGenerator } from 'src/domain/code-generation/map-tileset/c-map-tileset-code-generator';
import { CodeGeneratorStrategy, createCodeGenerator } from 'src/domain/code-generation/code-generator-strategy';
import type { MapCodeGeneratorParameters } from 'src/domain/code-generation/map-tileset/map-tileset-code-generation';

/** Returns the map tileset code generator for the given code generation language. */
export function createMapCodeGenerator(type: CodeGenerationType): CodeGeneratorStrategy<MapCodeGeneratorParameters> {
  return createCodeGenerator(type, {
    c: () => new CMapCodeGenerator(),
    asm: () => new AsmMapCodeGenerator(),
  });
}
