import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { AsmTilesCodeGeneratorStrategy } from "src/extract-tiles/composables/codeGenerators/asmGenerator";
import { CTilesCodeGeneratorStrategy } from "src/extract-tiles/composables/codeGenerators/cGenerator";
import { CodeGeneratorStrategy } from "src/extract-tiles/composables/codeGenerators/codeGeneratorStrategy";

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
