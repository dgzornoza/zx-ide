import { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import {
  buildColumnBytes,
  buildPaddingBytes,
} from "src/helpers/binary-builder-utils";
import { formatBytesAsDefb } from "src/helpers/code-generator-utils";
import {
  SpriteDefinition,
  SpritesMapModel,
} from "src/shared/models/spriteDefinition";

// ─── Public types ─────────────────────────────────────────────────────────────

const PADDING_ROWS_ABOVE = 7;
const PADDING_ROWS_BELOW = 8;

/** Generated file entry for generators */
export type GeneratedFile = FileEntry;

/** Parameters for sprite code-generation strategies. */
export interface SpritesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  name: string;
  /** Full list of sprite definitions (including frame coordinates). */
  sprites: SpriteDefinition[];
  /**
   * Numeric combination of {@link SpriteFlags} bits describing active options.
   * Use bitwise AND to test individual flags:
   * ```ts
   * if (params.spriteFlags & SpriteFlags.Sp1Padding) { ... }
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

// ─── Strategy interface ───────────────────────────────────────────────────────

/**
 * Strategy that produces all output files (map + source) from sprite data.
 */
export interface SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[];
}

// ─── Common Helpers ──────────────────────────────────────────────────────────

/** Creates the `.cfg` {@link GeneratedFile} entry for sprites. */
export function buildMapFile(
  params: SpritesCodeGeneratorParams,
): GeneratedFile {
  const spritesMap: SpritesMapModel = {
    type: "sprites",
    ...(params.spriteFlags ? { spriteFlags: params.spriteFlags } : {}),
    sprites: params.sprites.map(({ _id: _omit, ...rest }) => rest),
  };

  return {
    fileType: "map",
    fileName: `${params.name}.cfg`,
    content: JSON.stringify(spritesMap, null, 2),
  };
}

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
export function generateSpriteAsmBody(
  sprite: SpriteDefinition,
  frameBitmasks: boolean[][],
  baseLabel: string,
  publicLabel: string | null,
  hasPadding: boolean,
  useMask: boolean,
): string[] {
  const lines: string[] = [];

  const columns = Math.ceil(sprite.width / 8);

  if (publicLabel !== null) {
    if (columns > 1) {
      for (let col = 1; col <= columns; col++) {
        lines.push(`PUBLIC ${publicLabel}_col_${col}`);
      }
      lines.push("");
    } else {
      lines.push(`PUBLIC ${publicLabel}`, "");
    }
  }

  if (hasPadding) {
    // Only 7 rows of top padding before the very first column of the entire sprite data.
    // Compute padding bytes once, then format as text.
    const paddingBytes = buildPaddingBytes(PADDING_ROWS_ABOVE, 8, useMask);
    lines.push(...formatBytesAsDefb(paddingBytes, 16, useMask), "");
  }

  sprite.frames.forEach((_, frameIndex) => {
    const frameLabel =
      frameIndex === 0 ? baseLabel : `${baseLabel}_f${frameIndex + 1}`;
    const bitmask = frameBitmasks[frameIndex] ?? [];

    for (let col = 0; col < columns; col++) {
      const colLabel =
        columns > 1 ? `${frameLabel}_col_${col + 1}` : frameLabel;

      lines.push(`${colLabel}:`);

      // Compute column bytes once, then format. The single source of truth
      // for bit-packing is `binary-builder-utils.ts`.
      const colBytes = buildColumnBytes(
        bitmask,
        sprite.width,
        sprite.height,
        col,
        useMask,
      );
      lines.push(...formatBytesAsDefb(colBytes, 16, useMask));

      if (hasPadding) {
        const padBytes = buildPaddingBytes(PADDING_ROWS_BELOW, 8, useMask);
        lines.push("", ...formatBytesAsDefb(padBytes, 16, useMask), "");
      }
    }
  });

  return lines;
}

/** Returns total binary data size (in bytes) for sprites output. */
export function calculateSpritesDataByteCount(
  params: SpritesCodeGeneratorParams,
  hasPadding: boolean,
  useMask: boolean,
): number {
  return params.sprites.reduce((totalBytes, sprite) => {
    const frameCount = sprite.frames.length;
    const columns = Math.ceil(sprite.width / 8);
    const bytesPerColRow = useMask ? 2 : 1;

    // Each column has `height` rows of data
    const frameDataBytes = sprite.height * bytesPerColRow;

    // Top padding is only 7 rows for the very first column of the entire sprite
    const topPaddingBytes = hasPadding
      ? PADDING_ROWS_ABOVE * bytesPerColRow
      : 0;

    // Bottom padding is 8 rows per column per frame
    const bottomPaddingBytes = hasPadding
      ? PADDING_ROWS_BELOW * bytesPerColRow
      : 0;

    const singleFrameColBytes = frameDataBytes + bottomPaddingBytes;

    return (
      totalBytes + topPaddingBytes + frameCount * columns * singleFrameColBytes
    );
  }, 0);
}

export function buildDataSizeComment(dataByteCount: number): string {
  return `; Data Size: ${dataByteCount} bytes`;
}
