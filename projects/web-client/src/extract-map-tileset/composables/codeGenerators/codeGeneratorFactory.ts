import { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { AsmMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/asmGenerator";
import { CMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/cGenerator";
import { CodeGeneratorStrategy } from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorStrategy";

/**
 * Returns the appropriate {@link CodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createMapCodeGenerator(
  type: CodeGenerationType,
): CodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CMapCodeGenerator();
    case "asm":
      return new AsmMapCodeGenerator();
  }
}
