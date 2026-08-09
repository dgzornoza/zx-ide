// ─── Binary builders ───────────────────────────────────────────────────────────
//
// These helpers convert in-memory model data (ink bitmaps, tile indices,
// attribute bytes) into raw `Uint8Array` payloads suitable for embedding
// in a `.bin` file.
//
// Keep this module pure: no DOM, no Vue, no `defb` formatting — only
// numeric byte sequences. The text-side generators (`code-generator-utils.ts`)
// and the binary-side generators share the same row-packing logic.

import type { ZxpColorAttribute } from "src/helpers/image-utils";

/**
 * Packs one row of boolean ink values into a byte array
 * (one byte per 8 pixels, MSB = leftmost pixel).
 *
 * @example
 * bitmapRowToBytes([true, true, false, false, true, true, false, false], 0, 8);
 * // → Uint8Array([0b11001100])  →  [204]
 */
export function bitmapRowToBytes(
  inkBitmap: boolean[],
  rowOffset: number,
  width: number,
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  const bytes = new Uint8Array(bytesPerRow);

  for (let col = 0; col < width; col++) {
    if (!inkBitmap[rowOffset + col]) continue; // skip paper pixels

    const byteIndex = Math.trunc(col / 8);
    const bitIndex = col % 8;
    // MSB = leftmost pixel → shift by (7 - bitIndex)
    bytes[byteIndex] |= 1 << (7 - bitIndex);
  }

  return bytes;
}

/**
 * Converts a row-major ink bitmap of dimensions `width × height` into a
 * raw byte array (one byte per 8-pixel run, MSB = leftmost pixel).
 *
 * No mask plane is emitted.
 */
export function bitmapToBytes(
  inkBitmap: boolean[],
  width: number,
  height: number,
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  const out = new Uint8Array(bytesPerRow * height);

  for (let row = 0; row < height; row++) {
    const rowBytes = bitmapRowToBytes(inkBitmap, row * width, width);
    out.set(rowBytes, row * bytesPerRow);
  }

  return out;
}

/**
 * Converts a single 8-pixel column of a row-major ink bitmap into one byte.
 */
export function columnBitmapToByte(
  inkBitmap: boolean[],
  width: number,
  row: number,
  colIndex: number,
): number {
  const bytes = bitmapRowToBytes(inkBitmap, row * width, width);
  return bytes[colIndex] ?? 0;
}

/**
 * Builds the binary payload for a single tile: the pixel bitmap followed,
 * if `attributes` is provided, by the corresponding attribute byte.
 */
export function tileToBytes(
  inkBitmap: boolean[],
  width: number,
  height: number,
  attribute?: ZxpColorAttribute,
): Uint8Array {
  const bitmap = bitmapToBytes(inkBitmap, width, height);
  if (!attribute) return bitmap;

  const out = new Uint8Array(bitmap.length + 1);
  out.set(bitmap, 0);
  out[bitmap.length] = attributeToByte(attribute);
  return out;
}

/**
 * ZX Spectrum attribute byte layout (see {@link attributeToByte} for details).
 */
export function attributeToByte(attribute: ZxpColorAttribute): number {
  return (
    (attribute.flash ? 0x80 : 0) |
    (attribute.bright ? 0x40 : 0) |
    ((attribute.paper & 0x07) << 3) |
    (attribute.ink & 0x07)
  );
}

/**
 * Builds the binary payload for an entire tile set.
 *
 * Order: for each included tile index, emit (bitmap bytes) followed by the
 * corresponding attribute byte (if attributes are provided). The result is
 * the same byte sequence that {@link calculateTilesDataByteCount} measures.
 *
 * Tiles at indices not in `includedIndices` are skipped.
 */
export function buildTilesBinary(params: {
  inkBitmaps: boolean[][];
  tileWidth: number;
  tileHeight: number;
  attributes?: ZxpColorAttribute[];
  includedIndices: number[];
}): Uint8Array {
  const { inkBitmaps, tileWidth, tileHeight, attributes, includedIndices } =
    params;

  const bytesPerTile = Math.ceil(tileWidth / 8) * tileHeight;
  const hasAttributes = Boolean(attributes && attributes.length > 0);
  const tileSize = bytesPerTile + (hasAttributes ? 1 : 0);
  const out = new Uint8Array(tileSize * includedIndices.length);

  let writeOffset = 0;
  for (const tileIndex of includedIndices) {
    const inkBitmap = inkBitmaps[tileIndex] ?? [];
    const attribute = hasAttributes ? attributes?.[tileIndex] : undefined;
    const tileBytes = tileToBytes(inkBitmap, tileWidth, tileHeight, attribute);
    out.set(tileBytes, writeOffset);
    writeOffset += tileBytes.length;
  }

  return out;
}

/**
 * Builds the binary payload for an entire sprite set.
 *
 * Each sprite frame contributes one column at a time, with mask enabled
 * the mask byte precedes each data byte, matching the text generator's
 * `defb` ordering so the decompressed payload is byte-compatible with the
 * uncompressed `.asm` output.
 *
 * Layout per sprite (no padding):
 *   for each frame:
 *     for each column:
 *       for each row (top→bottom):
 *         (mask byte, if useMask) then data byte
 *
 * With SP1 padding:
 *   - 7 padding rows **before** the first column of the first frame
 *   - 8 padding rows **after** every column of every frame
 */
export function buildSpritesBinary(params: {
  sprites: Array<{
    width: number;
    height: number;
    frames: Array<{ x: number; y: number }>;
  }>;
  spriteBitmasks: boolean[][][];
  hasPadding: boolean;
  useMask: boolean;
}): Uint8Array {
  const PADDING_ROWS_ABOVE = 7;
  const PADDING_ROWS_BELOW = 8;
  const { sprites, spriteBitmasks, hasPadding, useMask } = params;

  const chunks: Uint8Array[] = [];

  sprites.forEach((sprite, spriteIndex) => {
    const columns = Math.ceil(sprite.width / 8);
    const frameBitmasks = spriteBitmasks[spriteIndex] ?? [];

    if (hasPadding) {
      // 7 padding rows before the very first column of the first frame
      chunks.push(buildPaddingBytes(PADDING_ROWS_ABOVE, 8, useMask));
    }

    sprite.frames.forEach((_frame, frameIndex) => {
      const bitmask = frameBitmasks[frameIndex] ?? [];
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < sprite.height; row++) {
          const dataByte = columnBitmapToByte(bitmask, sprite.width, row, col);
          if (useMask) chunks.push(new Uint8Array([~dataByte & 0xff]));
          chunks.push(new Uint8Array([dataByte]));
        }
        if (hasPadding) {
          // 8 padding rows after every column
          chunks.push(buildPaddingBytes(PADDING_ROWS_BELOW, 8, useMask));
        }
      }
    });
  });

  // Concatenate all chunks into one payload.
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Builds `count` rows of zero bytes (or `$FF,$00` pairs when `useMask`),
 * each row spanning `width` pixels (i.e. `ceil(width / 8)` bytes).
 */
export function buildPaddingBytes(
  count: number,
  width: number,
  useMask: boolean,
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  const rowSize = bytesPerRow * (useMask ? 2 : 1);
  const out = new Uint8Array(count * rowSize);

  for (let i = 0; i < out.length; i += rowSize) {
    for (let j = 0; j < bytesPerRow; j++) {
      if (useMask) out[i + j * 2] = 0xff;
      // data byte stays 0
    }
  }

  return out;
}

/**
 * Builds the byte payload for a single 8-pixel column of a sprite:
 * `sprite.height` rows of (mask, data) pairs when `useMask` is true, or
 * just `sprite.height` data bytes otherwise.
 *
 * Returned in the same order the text-side ASM emits (top→bottom row),
 * so the compressed payload is byte-for-byte compatible with the
 * uncompressed `defb` output.
 */
export function buildColumnBytes(
  inkBitmap: boolean[],
  width: number,
  height: number,
  colIndex: number,
  useMask: boolean,
): Uint8Array {
  const out = new Uint8Array(height * (useMask ? 2 : 1));
  let writeOffset = 0;
  for (let row = 0; row < height; row++) {
    const dataByte = columnBitmapToByte(inkBitmap, width, row, colIndex);
    if (useMask) {
      out[writeOffset++] = ~dataByte & 0xff;
    }
    out[writeOffset++] = dataByte;
  }
  return out;
}

/**
 * Builds the attribute byte payload for an included subset of tiles.
 * Tiles not in `includedIndices` are skipped. Missing or undefined
 * attributes fall back to ZX Spectrum defaults (paper=7, ink=0).
 */
export function buildAttributeBytes(
  attributes: ZxpColorAttribute[],
  includedIndices: number[],
): Uint8Array {
  const out = new Uint8Array(includedIndices.length);
  for (let i = 0; i < includedIndices.length; i++) {
    const attr = attributes[includedIndices[i]] ?? {
      flash: false,
      bright: false,
      paper: 7,
      ink: 0,
    };
    out[i] = attributeToByte(attr);
  }
  return out;
}

/**
 * Builds the binary payload for a map (a flat list of uint8 tile indices).
 * No bounds check — the caller is expected to validate `index ≤ 0xFF`.
 */
export function buildMapIndicesBinary(tileIndices: number[]): Uint8Array {
  const out = new Uint8Array(tileIndices.length);
  for (let i = 0; i < tileIndices.length; i++) {
    out[i] = tileIndices[i] & 0xff;
  }
  return out;
}
