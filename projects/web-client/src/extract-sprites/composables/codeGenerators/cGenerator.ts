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
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";

/**
 * Generates sprites for Z88DK C language.
 * Produces a `.cfg` file, a C header (`.h`) with `extern` declarations,
 * and a Z88DK assembly file (`.asm`) with sprite binary data in the
 * `rodata_user` section.
 */
export class CSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    const headerContent = this.generateHeaderFile(params);
    const asmContent = this.generateAsmFile(params);

    return [
      buildMapFile(params),
      {
        fileType: "c-header",
        fileName: `${params.name}.h`,
        content: headerContent,
      },
      {
        fileType: "asm",
        fileName: `${params.name}.asm`,
        content: asmContent,
      },
    ];
  }

  private generateHeaderFile(params: SpritesCodeGeneratorParams): string {
    const id = toCodeIdentifier(params.name);
    const guard = toMacroGuard(params.name);

    const lines: string[] = [
      `#ifndef __${guard}_H__`,
      `#define __${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      ...params.sprites.map(
        (sprite) =>
          `extern const uint8_t ${id}_${toCodeIdentifier(sprite.name)}[];`,
      ),
      "",
      `#endif // __${guard}_H__`,
      "",
    ];

    return lines.join("\n");
  }

  private generateAsmFile(params: SpritesCodeGeneratorParams): string {
    const id = toCodeIdentifier(params.name);
    const hasPadding = (params.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (params.spriteFlags & SpriteFlags.UseMask) !== 0;
    const dataByteCount = calculateSpritesDataByteCount(
      params,
      hasPadding,
      useMask,
    );
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const lines: string[] = [
      dataSizeComment,
      "; Read-Only Data Section for User Module",
      "SECTION rodata_user",
      "",
    ];

    params.sprites.forEach((sprite, spriteIndex) => {
      const spriteName = toCodeIdentifier(sprite.name);
      const baseLabel = `_${id}_${spriteName}`;
      const frameBitmasks = params.spriteBitmasks[spriteIndex] ?? [];

      lines.push(
        ...generateSpriteAsmBody(
          sprite,
          frameBitmasks,
          baseLabel,
          baseLabel,
          hasPadding,
          useMask,
        ),
      );
    });

    return lines.join("\n");
  }
}
