import type { GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import { buildColumnBytes, buildPaddingBytes } from 'src/helpers/binary-builder-utils';
import { formatBytesAsDefb } from 'src/domain/code-generation/code-formatting';
import { SpriteDefinition, SpritesMapModel } from 'src/shared/models/spriteDefinition';

const PADDING_ROWS_ABOVE = 7;
const PADDING_ROWS_BELOW = 8;

/** Parameters for sprite code-generation strategies. */
export interface SpritesCodeGeneratorParameters {
  /** Filename without extension (e.g. `"player"`). */
  name: string;
  /** Full list of sprite definitions (including frame coordinates). */
  sprites: SpriteDefinition[];
  /**
   * Numeric combination of {@link SpriteFlags} bits describing active options.
   * Use bitwise AND to test individual flags:
   * ```ts
   * if (parameters.spriteFlags & SpriteFlags.Sp1Padding) { ... }
   * ```
   */
  spriteFlags: number;
  /**
   * Pre-extracted pixel bitmasks for every sprite frame, indexed as
   * `spriteBitmasks[spriteIndex][frameIndex]`.
   *
   * Each inner array is row-major with length `sprite.width * sprite.height`.
   * `true` = ink pixel (dark / opaque), `false` = paper pixel.
   */
  spriteBitmasks: boolean[][][];
  /**
   * When `true` and the language is C, the generator emits a single
   * compressed blob instead of per-frame / per-column labels.
   */
  compressed?: boolean;
}

/** Creates the `.cfg` {@link GeneratedFile} entry for sprites. */
export function buildMapFile(parameters: SpritesCodeGeneratorParameters): GeneratedFile {
  const spritesMap: SpritesMapModel = {
    type: 'sprites',
    ...(parameters.spriteFlags ? { spriteFlags: parameters.spriteFlags } : {}),
    sprites: parameters.sprites.map(({ _id: _omit, ...rest }) => rest),
  };

  return {
    fileType: 'map',
    fileName: `${parameters.name}.cfg`,
    content: JSON.stringify(spritesMap, null, 2),
  };
}

/**
 * Builds the complete ASM body for all frames of a single sprite.
 *
 * Frame 1 uses `baseLabel` directly (no suffix).
 * Subsequent frames use `${baseLabel}_f${frameNumber}` (1-based, starting at 2).
 *
 * Padding structure when `hasPadding` is true. The function emits ONE
 * sprite at a time, so the 7-row guard repeats per sprite in a multi-sprite
 * set, not just once globally.
 * - 7 rows of zeros **before the first column of the first frame** (SP1
 *   vertical rotation guard, per sprite)
 * - 8 rows of zeros **after every column** of this sprite (including the
 *   last column of the last frame — bottom padding is per-column, not
 *   per-frame)
 */
export function generateSpriteAsmBody(
  sprite: SpriteDefinition,
  frameBitmasks: boolean[][],
  baseLabel: string,
  publicLabel: string | undefined,
  hasPadding: boolean,
  useMask: boolean
): string[] {
  const lines: string[] = [];

  const columns = Math.ceil(sprite.width / 8);

  if (publicLabel !== undefined) {
    if (columns > 1) {
      for (let column = 1; column <= columns; column++) {
        lines.push(`PUBLIC ${publicLabel}_col_${column}`);
      }
      lines.push('');
    } else {
      lines.push(`PUBLIC ${publicLabel}`, '');
    }
  }

  if (hasPadding) {
    // 7 rows of top padding before the first column of this sprite's first
    // frame. Emitted per sprite — the guard repeats for every sprite in a
    // multi-sprite set, not just the first one. Compute padding bytes once,
    // then format as text.
    const paddingBytes = buildPaddingBytes(PADDING_ROWS_ABOVE, 8, useMask);
    lines.push(...formatBytesAsDefb(paddingBytes, 16, useMask), '');
  }

  sprite.frames.forEach((_, frameIndex) => {
    const frameLabel = frameIndex === 0 ? baseLabel : `${baseLabel}_f${frameIndex + 1}`;
    const bitmask = frameBitmasks[frameIndex] ?? [];

    for (let column = 0; column < columns; column++) {
      const columnLabel = columns > 1 ? `${frameLabel}_col_${column + 1}` : frameLabel;

      lines.push(`${columnLabel}:`);

      // Compute column bytes once, then format. The single source of truth
      // for bit-packing is `binary-builder-utils.ts`.
      const columnBytes = buildColumnBytes(bitmask, sprite.width, sprite.height, column, useMask);
      lines.push(...formatBytesAsDefb(columnBytes, 16, useMask));

      if (hasPadding) {
        const bottomPaddingBytes = buildPaddingBytes(PADDING_ROWS_BELOW, 8, useMask);
        lines.push('', ...formatBytesAsDefb(bottomPaddingBytes, 16, useMask), '');
      }
    }
  });

  return lines;
}

/** Returns total binary data size (in bytes) for sprites output. */
export function calculateSpritesDataByteCount(parameters: SpritesCodeGeneratorParameters, hasPadding: boolean, useMask: boolean): number {
  return parameters.sprites.reduce((totalBytes, sprite) => {
    const frameCount = sprite.frames.length;
    const columns = Math.ceil(sprite.width / 8);
    const bytesPerColumnRow = useMask ? 2 : 1;

    // Each column has `height` rows of data
    const frameDataBytes = sprite.height * bytesPerColumnRow;

    // Top padding is only 7 rows for the very first column of the entire sprite
    const topPaddingBytes = hasPadding ? PADDING_ROWS_ABOVE * bytesPerColumnRow : 0;

    // Bottom padding is 8 rows per column per frame
    const bottomPaddingBytes = hasPadding ? PADDING_ROWS_BELOW * bytesPerColumnRow : 0;

    const singleFrameColumnBytes = frameDataBytes + bottomPaddingBytes;

    return totalBytes + topPaddingBytes + frameCount * columns * singleFrameColumnBytes;
  }, 0);
}
