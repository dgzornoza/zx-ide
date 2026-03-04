// ─── ink-bitmaps-to-bytes helpers ─────────────────────────────────────────────────

/**
 * Converts a tile ink bitmap into assembly `defb` directives, one per byte.
 *
 * Each row of the tile produces `ceil(tileWidth / 8)` directives using binary
 * notation (`@XXXXXXXX`), suitable for sjasmplus / Z88DK assemblers.
 *
 * @example
 * // 2×2 tile where top-left and bottom-right pixels are ink:
 * // ██░░░░░░
 * // ░░░░░░██
 * const inkBitmap = [
 *   true, false, false, false, false, false, false, false,
 *   false, false, false, false, false, false, false, true,
 * ];
 * generateTileDefbLines(inkBitmap, 8, 2);
 * // → [
 * //   '    defb @10000000',
 * //   '    defb @00000001',
 * // ]
 *
 * @param inkBitmap  - Tile Row-major boolean[] of length `tileWidth * tileHeight`.
 * @param tileWidth  - Tile width in pixels.
 * @param tileHeight - Tile height in pixels.
 * @returns Array of indented `defb` lines ready to join into an ASM file.
 */
export function generateTileDefbLines(
  inkBitmap: boolean[],
  tileWidth: number,
  tileHeight: number,
): string[] {
  const lines: string[] = [];
  for (let row = 0; row < tileHeight; row++) {
    const rowOffset = row * tileWidth;

    const bytes = tileRowToBytes(inkBitmap, rowOffset, tileWidth);
    for (const byte of bytes) {
      const bits = byte.toString(2).padStart(8, "0");
      lines.push(`    defb @${bits}`);
    }
  }
  return lines;
}

/**
 * Packs one row of boolean ink values into an array of bytes
 * (one byte per 8 pixels, MSB = leftmost pixel).
 *
 * @example
 * // A 8-pixel row: ██░░██░░ (true = ink, false = paper)
 * const inkBitmap = [true, true, false, false, true, true, false, false];
 * tileRowToBytes(inkBitmap, 0, 8);
 * // → [0b11001100]  →  [204]
 *
 * @param inkBitmap - Flat row-major boolean array for the entire tile.
 * @param rowOffset - Index into `inkBitmap` where this row begins.
 * @param tileWidth - Width of the tile in pixels (determines how many
 *                    booleans to read and how many bytes to produce).
 * @returns Array of bytes, length = `ceil(tileWidth / 8)`.
 */
export function tileRowToBytes(
  inkBitmap: boolean[],
  rowOffset: number,
  tileWidth: number,
): number[] {
  const bytesPerRow = Math.ceil(tileWidth / 8);
  const bytes = new Array<number>(bytesPerRow).fill(0);

  // Iterate pixels in the row and set the corresponding bit in the
  // appropriate output byte.
  for (let col = 0; col < tileWidth; col++) {
    if (!inkBitmap[rowOffset + col]) continue; // skip paper pixels

    const byteIndex = Math.trunc(col / 8);
    const bitIndex = col % 8;
    // MSB = leftmost pixel -> shift by (7 - bitIndex)
    bytes[byteIndex] |= 1 << (7 - bitIndex);
  }

  return bytes;
}
