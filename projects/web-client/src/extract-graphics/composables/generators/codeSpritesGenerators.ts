import {
  GeneratedFile,
  SpritesCodeGeneratorParams,
  SpritesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/generators/generatorStrategy";

/**
 * Generates a C source file per sprite for Z88DK.
 * @todo Implementation pending.
 */
export class CSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(_params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [];
  }
}

// ─── ASM sprites strategy (sjasmplus) ────────────────────────────────────────

/**
 * Generates a sjasmplus assembly file per sprite.
 * @todo Implementation pending.
 */
export class AsmSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(_params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [];
  }
}
