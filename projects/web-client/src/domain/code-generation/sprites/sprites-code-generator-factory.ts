import type { CodeGenerationType } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { AsmSpritesCodeGeneratorStrategy } from 'src/domain/code-generation/sprites/asm-sprites-code-generator';
import { CSpritesCodeGeneratorStrategy } from 'src/domain/code-generation/sprites/c-sprites-code-generator';
import { CodeGeneratorStrategy, createCodeGenerator } from 'src/domain/code-generation/code-generator-strategy';
import type { SpritesCodeGeneratorParams } from 'src/domain/code-generation/sprites/sprites-code-generation';

/** Returns the sprites code generator for the given code generation language. */
export function createSpritesCodeGenerator(type: CodeGenerationType): CodeGeneratorStrategy<SpritesCodeGeneratorParams> {
  return createCodeGenerator(type, {
    c: () => new CSpritesCodeGeneratorStrategy(),
    asm: () => new AsmSpritesCodeGeneratorStrategy(),
  });
}
