import { buildSpritesBinary } from 'src/helpers/binary-builder-utils';
import { bytesToBase64 } from 'src/helpers/binary-utils';
import { toCodeIdentifier, toMacroGuard } from 'src/helpers/string-utils';
import { compress as compressZx0 } from 'src/helpers/zx0-compress';
import { buildDataSizeComment } from 'src/domain/code-generation/code-formatting';
import { CodeGeneratorStrategy, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import {
  buildMapFile,
  calculateSpritesDataByteCount,
  generateSpriteAsmBody,
  SpritesCodeGeneratorParameters,
} from 'src/domain/code-generation/sprites/sprites-code-generation';
import { SpriteFlags } from 'src/shared/models/spriteDefinition';

/**
 * Generates sprites for Z88DK C language.
 *
 * Two output modes:
 *   - **Plain** (default): `.cfg`, `.h` with per-sprite / per-column
 *     `extern` declarations, `.asm` with `defb` directives in the
 *     `rodata_user` section.
 *   - **Compressed** (`compressed: true`): `.cfg`, `.h` with a single
 *     `<name>_compressed[]` extern + uncompressed-size `#define`s,
 *     `.asm` with one `incbin "<name>.bin"`, and `.bin` with raw
 *     uncompressed bytes (base64-encoded for transport
 */
export class CSpritesCodeGeneratorStrategy implements CodeGeneratorStrategy<SpritesCodeGeneratorParameters> {
  generate(parameters: SpritesCodeGeneratorParameters): GeneratedFile[] {
    if (parameters.compressed) {
      return this.generateCompressed(parameters);
    }
    return this.generatePlain(parameters);
  }

  private generatePlain(parameters: SpritesCodeGeneratorParameters): GeneratedFile[] {
    const headerContent = this.generatePlainHeaderFile(parameters);
    const asmContent = this.generatePlainAsmFile(parameters);

    return [
      buildMapFile(parameters),
      {
        fileType: 'c-header',
        fileName: `${parameters.name}.h`,
        content: headerContent,
      },
      {
        fileType: 'asm',
        fileName: `${parameters.name}.asm`,
        content: asmContent,
      },
    ];
  }

  private generateCompressed(parameters: SpritesCodeGeneratorParameters): GeneratedFile[] {
    const hasPadding = (parameters.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (parameters.spriteFlags & SpriteFlags.UseMask) !== 0;

    const rawBytes = buildSpritesBinary({
      sprites: parameters.sprites.map((sprite) => ({
        width: sprite.width,
        height: sprite.height,
        frames: sprite.frames.map((frame) => ({ x: frame.x, y: frame.y })),
      })),
      spriteBitmasks: parameters.spriteBitmasks,
      hasPadding,
      useMask,
    });

    const compressedBytes = compressZx0(rawBytes).data;

    const totalSize = calculateSpritesDataByteCount(parameters, hasPadding, useMask);
    const spriteCount = parameters.sprites.length;
    const frameCount = parameters.sprites.reduce((sum, sprite) => sum + sprite.frames.length, 0);

    return [
      buildMapFile(parameters),
      {
        fileType: 'c-header',
        fileName: `${parameters.name}.h`,
        content: this.generateCompressedHeaderFile(parameters.name, {
          spriteCount,
          frameCount,
          totalSize,
        }),
      },
      {
        fileType: 'asm',
        fileName: `${parameters.name}.asm`,
        content: this.generateCompressedAsmFile(parameters.name, {
          spriteCount,
          frameCount,
          totalSize,
          compressedSize: compressedBytes.length,
        }),
      },
      {
        fileType: 'binary',
        fileName: `${parameters.name}.bin`,
        content: bytesToBase64(compressedBytes),
      },
    ];
  }

  private generatePlainHeaderFile(parameters: SpritesCodeGeneratorParameters): string {
    const id = toCodeIdentifier(parameters.name);
    const guard = toMacroGuard(parameters.name);

    const lines: string[] = [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      '',
      '#include <stdint.h>',
      '',
      ...parameters.sprites.flatMap((sprite) => {
        const spriteName = `${id}_${toCodeIdentifier(sprite.name)}`;
        const columns = Math.ceil(sprite.width / 8);
        if (columns > 1) {
          const declarations: string[] = [];
          for (let column = 1; column <= columns; column++) {
            declarations.push(`extern const uint8_t ${spriteName}_col_${column}[];`);
          }
          return declarations;
        } else {
          return [`extern const uint8_t ${spriteName}[];`];
        }
      }),
      '',
      `#endif // __DATA_${guard}_H__`,
      '',
    ];

    return lines.join('\n');
  }

  private generateCompressedHeaderFile(baseName: string, sizes: { spriteCount: number; frameCount: number; totalSize: number }): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const { spriteCount, frameCount, totalSize } = sizes;

    return [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      '',
      '#include <stdint.h>',
      '',
      `#define ${guard}_SPRITES_COUNT      ${spriteCount}u`,
      `#define ${guard}_FRAMES_COUNT       ${frameCount}u`,
      `#define ${guard}_TOTAL_SIZE         ${totalSize}u`,
      '',
      `extern const uint8_t ${id}_compressed[];`,
      '',
      `#endif // __DATA_${guard}_H__`,
      '',
    ].join('\n');
  }

  private generateCompressedAsmFile(
    baseName: string,
    sizes: {
      spriteCount: number;
      frameCount: number;
      totalSize: number;
      compressedSize: number;
    }
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const incbinPath = `${baseName}.bin`;

    return [
      `; ${guard}_SPRITES_COUNT: ${sizes.spriteCount}`,
      `; ${guard}_FRAMES_COUNT: ${sizes.frameCount}`,
      `; ${guard}_TOTAL_SIZE: ${sizes.totalSize}`,
      `; Compressed Size: ${sizes.compressedSize} bytes (ZX0 standard)`,
      '',
      '; incbin path is resolved relative to the Makefile cwd (project root),',
      "; not relative to this .asm file's location.",
      'SECTION rodata_user',
      '',
      `PUBLIC _${id}_compressed`,
      `_${id}_compressed:`,
      `    incbin "${incbinPath}"`,
      '',
    ].join('\n');
  }

  private generatePlainAsmFile(parameters: SpritesCodeGeneratorParameters): string {
    const id = toCodeIdentifier(parameters.name);
    const hasPadding = (parameters.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (parameters.spriteFlags & SpriteFlags.UseMask) !== 0;
    const dataByteCount = calculateSpritesDataByteCount(parameters, hasPadding, useMask);
    const dataSizeComment = buildDataSizeComment(dataByteCount);

    const lines: string[] = [dataSizeComment, '; Read-Only Data Section for User Module', 'SECTION rodata_user', ''];

    parameters.sprites.forEach((sprite, spriteIndex) => {
      const spriteName = toCodeIdentifier(sprite.name);
      const baseLabel = `_${id}_${spriteName}`;
      const frameBitmasks = parameters.spriteBitmasks[spriteIndex] ?? [];

      lines.push(...generateSpriteAsmBody(sprite, frameBitmasks, baseLabel, baseLabel, hasPadding, useMask));
    });

    return lines.join('\n');
  }
}
