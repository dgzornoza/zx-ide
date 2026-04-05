import {
  buildDataSizeComment,
  buildMapFile,
  calculateSpritesDataByteCount,
  GeneratedFile,
  generateSpriteAsmBody,
  SpritesCodeGeneratorParams,
  SpritesCodeGeneratorStrategy,
} from "src/extract-sprites/composables/codeGenerators/codeGeneratorStrategy";
import { SpriteFlags } from "src/extract-sprites/models/spriteDefinition";
import { toCodeIdentifier } from "src/helpers/string-utils";

/**
 * Generates sprites for sjasmplus assembly language.
 * Produces a `.cfg` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary sprite data.
 */
export class AsmSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    const id = toCodeIdentifier(params.name);
    const hasPadding = (params.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (params.spriteFlags & SpriteFlags.UseMask) !== 0;

    const dataByteCount = calculateSpritesDataByteCount(
      params,
      hasPadding,
      useMask,
    );
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const lines: string[] = [dataSizeComment];

    params.sprites.forEach((sprite, spriteIndex) => {
      const spriteName = toCodeIdentifier(sprite.name);
      const baseLabel = `${id}_${spriteName}`;
      const frameBitmasks = params.spriteBitmasks[spriteIndex] ?? [];

      lines.push(
        ...generateSpriteAsmBody(
          sprite,
          frameBitmasks,
          baseLabel,
          null,
          hasPadding,
          useMask,
        ),
      );
    });

    return [
      buildMapFile(params),
      {
        fileType: "asm",
        fileName: `${params.name}.asm`,
        content: lines.join("\n"),
      },
    ];
  }
}
