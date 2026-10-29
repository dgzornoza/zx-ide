import type { CodeGenerationType } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { AsmTilesCodeGeneratorStrategy } from 'src/domain/code-generation/tiles/asm-tiles-code-generator';
import { CTilesCodeGeneratorStrategy } from 'src/domain/code-generation/tiles/c-tiles-code-generator';
import { CodeGeneratorStrategy, createCodeGenerator } from 'src/domain/code-generation/code-generator-strategy';
import type { TilesCodeGeneratorParams } from 'src/domain/code-generation/tiles/tiles-code-generation';

/** Returns the tiles code generator for the given code generation language. */
export function createTilesCodeGenerator(type: CodeGenerationType): CodeGeneratorStrategy<TilesCodeGeneratorParams> {
  return createCodeGenerator(type, {
    c: () => new CTilesCodeGeneratorStrategy(),
    asm: () => new AsmTilesCodeGeneratorStrategy(),
  });
}
