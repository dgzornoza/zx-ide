import { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { AsmSpritesCodeGeneratorStrategy } from "src/extract-sprites/composables/codeGenerators/asmGenerator";
import { CSpritesCodeGeneratorStrategy } from "src/extract-sprites/composables/codeGenerators/cGenerator";
import { SpritesCodeGeneratorStrategy as CodeGeneratorStrategy } from "src/extract-sprites/composables/codeGenerators/codeGeneratorStrategy";

/**
 * Returns the appropriate {@link CodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createSpritesCodeGenerator(
  type: CodeGenerationType,
): CodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CSpritesCodeGeneratorStrategy();
    case "asm":
      return new AsmSpritesCodeGeneratorStrategy();
  }
}
