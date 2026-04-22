import { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { AsmSpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/asmGenerator";
import { CSpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/cGenerator";
import { SpritesCodeGeneratorStrategy } from "src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy";

/**
 * Returns the appropriate {@link SpritesCodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createSpritesCodeGenerator(
  type: CodeGenerationType,
): SpritesCodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CSpritesCodeGeneratorStrategy();
    case "asm":
      return new AsmSpritesCodeGeneratorStrategy();
  }
}
