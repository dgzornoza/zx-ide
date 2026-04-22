import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { AsmTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/asmGenerator";
import { CTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/cGenerator";
import { CodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/codeGeneratorStrategy";

/**
 * Returns the appropriate {@link CodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createTilesCodeGenerator(
  type: CodeGenerationType,
): CodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CTilesCodeGeneratorStrategy();
    case "asm":
      return new AsmTilesCodeGeneratorStrategy();
  }
}
