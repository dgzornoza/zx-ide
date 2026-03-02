import {
  GeneratedFile,
  SpritesCodeGeneratorParams,
  SpritesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/codeGenerators/codeGeneratorStrategy";
import { SpritesMapModel } from "src/extract-graphics/models/tilesDefinition";

// ─── Helpers ───────────────────────────────────────────────

/** Creates the `.map` {@link GeneratedFile} entry for sprites. */
function buildMapFile(params: SpritesCodeGeneratorParams): GeneratedFile {
  const spritesMap: SpritesMapModel = {
    type: "sprites",
    ...(params.spriteSp1Padding ? { spriteSp1Padding: true } : {}),
    sprites: params.sprites.map(({ _id: _omit, ...rest }) => rest),
  };

  return {
    fileType: "map",
    fileName: `${params.name}.map`,
    content: JSON.stringify(spritesMap, null, 2),
  };
}

// ─── C Sprites  ────────────────────────────────────────

/**
 * Generates a C source file per sprite for Z88DK.
 * Produces a `.map` file and C source files.
 * @todo Code generation implementation pending.
 */
export class CSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [buildMapFile(params)];
  }
}

// ─── ASM Sprites  ────────────────────────────────────────

/**
 * Generates a sjasmplus assembly file per sprite.
 * Produces a `.map` file and ASM source files.
 * @todo Code generation implementation pending.
 */
export class AsmSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    return [buildMapFile(params)];
  }
}
