import { SpriteFlags } from 'src/shared/models/spriteDefinition';
import { toCodeIdentifier } from 'src/helpers/string-utils';
import { buildDataSizeComment } from 'src/domain/code-generation/code-formatting';
import { CodeGeneratorStrategy, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import {
  buildMapFile,
  calculateSpritesDataByteCount,
  generateSpriteAsmBody,
  SpritesCodeGeneratorParams,
} from 'src/domain/code-generation/sprites/sprites-code-generation';

/**
 * Generates sprites for sjasmplus assembly language.
 * Produces a `.cfg` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary sprite data.
 */
export class AsmSpritesCodeGeneratorStrategy implements CodeGeneratorStrategy<SpritesCodeGeneratorParams> {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    const id = toCodeIdentifier(params.name);
    const hasPadding = (params.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (params.spriteFlags & SpriteFlags.UseMask) !== 0;

    const dataByteCount = calculateSpritesDataByteCount(params, hasPadding, useMask);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const lines: string[] = [dataSizeComment];

    params.sprites.forEach((sprite, spriteIndex) => {
      const spriteName = toCodeIdentifier(sprite.name);
      const baseLabel = `${id}_${spriteName}`;
      const frameBitmasks = params.spriteBitmasks[spriteIndex] ?? [];

      lines.push(...generateSpriteAsmBody(sprite, frameBitmasks, baseLabel, undefined, hasPadding, useMask));
    });

    return [
      buildMapFile(params),
      {
        fileType: 'asm',
        fileName: `${params.name}.asm`,
        content: lines.join('\n'),
      },
    ];
  }
}
