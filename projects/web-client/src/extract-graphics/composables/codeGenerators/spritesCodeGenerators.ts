/**
 * Code generators for sprite-based graphics exports.
 *
 * Provides two concrete strategy implementations:
 *
 * - `"c"`   → {@link CSpritesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmSpritesCodeGeneratorStrategy} (sjasmplus assembly)
 */

import {
  GeneratedFile,
  SpritesCodeGeneratorParams,
  SpritesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/codeGenerators/codeGeneratorStrategy";
import {
  generateBitmapDefbLines,
  generatePaddingDefbLines,
} from "src/extract-graphics/composables/codeGenerators/codeGeneratorUtils";
import {
  SpriteDefinition,
  SpriteFlags,
} from "src/extract-graphics/models/spriteDefinition";
import { SpritesMapModel } from "src/extract-graphics/models/tilesDefinition";
import { toCodeIdentifier, toMacroGuard } from "src/utils/string-utils";

// ─── Constants ─────────────────────────────────────────────

const PADDING_ROWS_ABOVE = 7;
const PADDING_ROWS_BELOW = 8;

// ─── Map file helper ───────────────────────────────────────

/** Creates the `.map` {@link GeneratedFile} entry for sprites. */
function buildMapFile(params: SpritesCodeGeneratorParams): GeneratedFile {
  const spritesMap: SpritesMapModel = {
    type: "sprites",
    ...(params.spriteFlags ? { spriteFlags: params.spriteFlags } : {}),
    sprites: params.sprites.map(({ _id: _omit, ...rest }) => rest),
  };

  return {
    fileType: "map",
    fileName: `${params.name}.map`,
    content: JSON.stringify(spritesMap, null, 2),
  };
}

// ─── Shared ASM helpers ────────────────────────────────────

/**
 * Builds the complete ASM body for all frames of a single sprite.
 *
 * Frame 1 uses `baseLabel` directly (no suffix).
 * Subsequent frames use `${baseLabel}_f${frameNumber}` (1-based, starting at 2).
 *
 * Padding structure when `hasPadding` is true:
 * - 7 rows of zeros **before** frame 1's label (SP1 vertical rotation guard)
 * - 8 rows of zeros **after** each frame (including the last)
 */
function generateSpriteAsmBody(
  sprite: SpriteDefinition,
  frameBitmasks: boolean[][],
  baseLabel: string,
  publicLabel: string | null,
  hasPadding: boolean,
  useMask: boolean,
): string[] {
  const lines: string[] = [];

  if (publicLabel !== null) {
    lines.push(`PUBLIC ${publicLabel}`, "");
  }

  if (hasPadding) {
    lines.push(
      ...generatePaddingDefbLines(PADDING_ROWS_ABOVE, sprite.width, useMask),
      "",
    );
  }

  sprite.frames.forEach((_, frameIndex) => {
    const frameLabel =
      frameIndex === 0 ? baseLabel : `${baseLabel}_f${frameIndex + 1}`;
    const bitmask = frameBitmasks[frameIndex] ?? [];

    lines.push(
      `${frameLabel}:`,
      ...generateBitmapDefbLines(bitmask, sprite.width, sprite.height, useMask),
      ...(hasPadding
        ? [
            "",
            ...generatePaddingDefbLines(
              PADDING_ROWS_BELOW,
              sprite.width,
              useMask,
            ),
          ]
        : []),
      "",
    );
  });

  return lines;
}

// ─── C Sprites ─────────────────────────────────────────────

/**
 * Generates sprites for Z88DK C language.
 * Produces a `.map` file, a C header (`.h`) with `extern` declarations,
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

    const lines: string[] = [
      "// Read-Only Data Section for User Module",
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

// ─── ASM Sprites ───────────────────────────────────────────

/**
 * Generates sprites for sjasmplus assembly language.
 * Produces a `.map` file and a single sjasmplus assembly file (`.asm`)
 * with plain labels and `defb @XXXXXXXX` binary sprite data.
 */
export class AsmSpritesCodeGeneratorStrategy implements SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[] {
    const id = toCodeIdentifier(params.name);
    const hasPadding = (params.spriteFlags & SpriteFlags.Sp1Padding) !== 0;
    const useMask = (params.spriteFlags & SpriteFlags.UseMask) !== 0;

    const lines: string[] = [];

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
