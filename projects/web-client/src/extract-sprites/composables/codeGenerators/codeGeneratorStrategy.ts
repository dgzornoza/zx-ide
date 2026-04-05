import { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import {
  SpriteDefinition,
  SpritesMapModel,
} from "src/extract-sprites/models/spriteDefinition";
import {
  generateBitmapDefbLines,
  generatePaddingDefbLines,
} from "src/helpers/code-generator-utils";

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

/** Returns total binary data size (in bytes) for sprites output. */
export function calculateSpritesDataByteCount(
  params: SpritesCodeGeneratorParams,
  hasPadding: boolean,
  useMask: boolean,
): number {
  return params.sprites.reduce((totalBytes, sprite) => {
    const frameCount = sprite.frames.length;
    const bytesPerRow = Math.ceil(sprite.width / 8);
    const rowDataBytes = useMask ? bytesPerRow * 2 : bytesPerRow;
    const frameBytes = sprite.height * rowDataBytes;
    const topPaddingBytes = hasPadding ? PADDING_ROWS_ABOVE * rowDataBytes : 0;
    const bottomPaddingBytes = hasPadding
      ? frameCount * PADDING_ROWS_BELOW * rowDataBytes
      : 0;

    return (
      totalBytes +
      topPaddingBytes +
      frameCount * frameBytes +
      bottomPaddingBytes
    );
  }, 0);
}

export function buildDataSizeComment(dataByteCount: number): string {
  return `; Data Size: ${dataByteCount} bytes`;
}
