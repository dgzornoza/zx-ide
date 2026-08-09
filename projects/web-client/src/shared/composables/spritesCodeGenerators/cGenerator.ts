import { buildSpritesBinary } from "src/helpers/binary-builder-utils";
import { bytesToBase64 } from "src/helpers/binary-utils";
import { toCodeIdentifier, toMacroGuard } from "src/helpers/string-utils";
import { compress as compressZx0 } from "src/helpers/zx0-compress";
import {
  buildDataSizeComment,
  buildMapFile,
  calculateSpritesDataByteCount,
  GeneratedFile,
  generateSpriteAsmBody,
  SpritesCodeGeneratorParams,
  SpritesCodeGeneratorStrategy,
} from "src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy";
import { SpriteFlags } from "src/shared/models/spriteDefinition";

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
export class CSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    if (params.compressed) {
      return this.generateCompressed(params);
    }
    return this.generatePlain(params);
  }

  private generatePlain(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    const headerContent = this.generatePlainHeaderFile(params);
    const asmContent = this.generatePlainAsmFile(params);

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

  private generateCompressed(
    params: SpritesCodeGeneratorParams,
  ): GeneratedFile[] {
    const hasPadding = (params.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (params.spriteFlags & SpriteFlags.UseMask) !== 0;

    const rawBytes = buildSpritesBinary({
      sprites: params.sprites.map((s) => ({
        width: s.width,
        height: s.height,
        frames: s.frames.map((f) => ({ x: f.x, y: f.y })),
      })),
      spriteBitmasks: params.spriteBitmasks,
      hasPadding,
      useMask,
    });

    const compressedBytes = compressZx0(rawBytes).data;

    const totalSize = calculateSpritesDataByteCount(
      params,
      hasPadding,
      useMask,
    );
    const spriteCount = params.sprites.length;
    const frameCount = params.sprites.reduce(
      (sum, sprite) => sum + sprite.frames.length,
      0,
    );

    return [
      buildMapFile(params),
      {
        fileType: "c-header",
        fileName: `${params.name}.h`,
        content: this.generateCompressedHeaderFile(params.name, {
          spriteCount,
          frameCount,
          totalSize,
        }),
      },
      {
        fileType: "asm",
        fileName: `${params.name}.asm`,
        content: this.generateCompressedAsmFile(params.name, {
          spriteCount,
          frameCount,
          totalSize,
          compressedSize: compressedBytes.length,
        }),
      },
      {
        fileType: "binary",
        fileName: `${params.name}.bin`,
        content: bytesToBase64(compressedBytes),
      },
    ];
  }

  private generatePlainHeaderFile(params: SpritesCodeGeneratorParams): string {
    const id = toCodeIdentifier(params.name);
    const guard = toMacroGuard(params.name);

    const lines: string[] = [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      ...params.sprites.flatMap((sprite) => {
        const spriteName = `${id}_${toCodeIdentifier(sprite.name)}`;
        const columns = Math.ceil(sprite.width / 8);
        if (columns > 1) {
          const decls: string[] = [];
          for (let col = 1; col <= columns; col++) {
            decls.push(`extern const uint8_t ${spriteName}_col_${col}[];`);
          }
          return decls;
        } else {
          return [`extern const uint8_t ${spriteName}[];`];
        }
      }),
      "",
      `#endif // __DATA_${guard}_H__`,
      "",
    ];

    return lines.join("\n");
  }

  private generateCompressedHeaderFile(
    baseName: string,
    sizes: { spriteCount: number; frameCount: number; totalSize: number },
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const { spriteCount, frameCount, totalSize } = sizes;

    return [
      `#ifndef __DATA_${guard}_H__`,
      `#define __DATA_${guard}_H__`,
      "",
      "#include <stdint.h>",
      "",
      `#define ${guard}_SPRITES_COUNT      ${spriteCount}u`,
      `#define ${guard}_FRAMES_COUNT       ${frameCount}u`,
      `#define ${guard}_TOTAL_SIZE         ${totalSize}u`,
      "",
      `extern const uint8_t ${id}_compressed[];`,
      "",
      `#endif // __DATA_${guard}_H__`,
      "",
    ].join("\n");
  }

  private generateCompressedAsmFile(
    baseName: string,
    sizes: {
      spriteCount: number;
      frameCount: number;
      totalSize: number;
      compressedSize: number;
    },
  ): string {
    const id = toCodeIdentifier(baseName);
    const guard = toMacroGuard(baseName);
    const incbinPath = `${baseName}.bin`;

    return [
      `; ${guard}_SPRITES_COUNT: ${sizes.spriteCount}`,
      `; ${guard}_FRAMES_COUNT: ${sizes.frameCount}`,
      `; ${guard}_TOTAL_SIZE: ${sizes.totalSize}`,
      `; Compressed Size: ${sizes.compressedSize} bytes (ZX0 standard)`,
      "",
      "; incbin path is resolved relative to the Makefile cwd (project root),",
      "; not relative to this .asm file's location.",
      "SECTION rodata_user",
      "",
      `PUBLIC _${id}_compressed`,
      `_${id}_compressed:`,
      `    incbin "${incbinPath}"`,
      "",
    ].join("\n");
  }

  private generatePlainAsmFile(params: SpritesCodeGeneratorParams): string {
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
