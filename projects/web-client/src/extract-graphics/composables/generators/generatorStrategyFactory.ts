/**
 * Code generators factory for tile-based and sprite-based graphics exports.
 *
 * Provides strategy interfaces for tiles and sprites, each with two
 * concrete implementations selected via the factory functions:
 *
 * Tiles:
 * - `"c"`   → {@link CTilesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmTilesCodeGeneratorStrategy} (sjasmplus assembly)
 *
 * Sprites:
 * - `"c"`   → {@link CSpritesCodeGeneratorStrategy}  (stub)
 * - `"asm"` → {@link AsmSpritesCodeGeneratorStrategy} (stub)
 */

import {
  AsmSpritesCodeGeneratorStrategy,
  CSpritesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/generators/codeSpritesGenerators";
import {
  AsmTilesCodeGeneratorStrategy,
  CTilesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/generators/codeTilesGenerators";
import {
  SpritesCodeGeneratorStrategy,
  TilesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/generators/generatorStrategy";
import type { CodeGenerationType } from "../../../../../shared/extract-graphics/extract-graphics-dtos";

// ─── Public types ─────────────────────────────────────────────────────────────

/** A single generated output file. */
export interface GeneratedFile {
  /** File extension including the dot (e.g. `".h"`, `".asm"`). */
  extension: string;
  /** UTF-8 content of the file. */
  content: string;
  /**
   * Optional filename used to build the output filename.
   * Only set by sprite strategies (one file per sprite).
   */
  fileName?: string;
}

/**
 * Returns the appropriate {@link TilesCodeGeneratorStrategy} for the given
 * code-generation type.
 */
export function createTilesCodeGenerator(
  type: CodeGenerationType,
): TilesCodeGeneratorStrategy {
  switch (type) {
    case "c":
      return new CTilesCodeGeneratorStrategy();
    case "asm":
      return new AsmTilesCodeGeneratorStrategy();
  }
}

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
