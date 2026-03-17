// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Packs one row of boolean ink values into an array of bytes
 * (one byte per 8 pixels, MSB = leftmost pixel).
 *
 * @example
 * // An 8-pixel row: ██░░██░░ (true = ink, false = paper)
 * bitmapRowToBytes([true, true, false, false, true, true, false, false], 0, 8);
 * // → [0b11001100]  →  [204]
 *
 * @param inkBitmap - Flat row-major boolean array for the entire bitmap.
 * @param rowOffset - Index into `inkBitmap` where this row begins.
 * @param width     - Width in pixels (determines how many booleans to read).
 * @returns Array of bytes, length = `ceil(width / 8)`.
 */
function bitmapRowToBytes(
  inkBitmap: boolean[],
  rowOffset: number,
  width: number,
): number[] {
  const bytesPerRow = Math.ceil(width / 8);
  const bytes = new Array<number>(bytesPerRow).fill(0);

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
 * Formats a single `defb` directive for one data byte.
 *
 * Without mask: `    defb @XXXXXXXX`
 * With mask:    `    defb @MMMMMMMM, @XXXXXXXX`
 *               where the mask byte is `~dataByte & 0xFF`
 *               (transparent pixels → 1, ink pixels → 0).
 */
function formatDefbLine(dataByte: number, useMask: boolean): string {
  const dataBits = dataByte.toString(2).padStart(8, "0");
  if (!useMask) {
    return `    defb @${dataBits}`;
  }
  const maskBits = (~dataByte & 0xff).toString(2).padStart(8, "0");
  return `    defb @${maskBits}, @${dataBits}`;
}

// ─── defb line generators ─────────────────────────────────────────────────────

/**
 * Converts a row-major ink bitmap into assembly `defb` directives.
 *
 * Iterates each row of the bitmap, packs pixels into bytes
 * (MSB = leftmost pixel), and emits one `defb` directive per byte.
 *
 * Without mask: plain `defb @XXXXXXXX` per byte.
 * With mask:    `defb @MMMMMMMM, @XXXXXXXX` pairs per byte, where the mask
 *               byte is the bitwise NOT of the data byte
 *               (transparent pixels → 1, ink pixels → 0).
 *
 * @example
 * // 8×2 bitmap where only the top-left pixel is ink:
 * generateBitmapDefbLines([true, false, ...], 8, 2);
 * // → ['    defb @10000000', '    defb @00000000']
 *
 * @example
 * // 8×1 bitmap with mask, leftmost pixel is ink:
 * generateBitmapDefbLines([true, false, ...], 8, 1, true);
 * // → ['    defb @01111111, @10000000']
 *
 * @param inkBitmap - Row-major boolean[] of length `width × height`.
 * @param width     - Width in pixels.
 * @param height    - Height in pixels.
 * @param useMask   - When `true`, prepends a computed mask byte to each
 *                    directive. Defaults to `false`.
 * @returns Array of indented `defb` lines ready to join into an ASM file.
 */
export function generateBitmapDefbLines(
  inkBitmap: boolean[],
  width: number,
  height: number,
  useMask = false,
): string[] {
  const lines: string[] = [];

  for (let row = 0; row < height; row++) {
    const rowOffset = row * width;
    const bytes = bitmapRowToBytes(inkBitmap, rowOffset, width);

    for (const byte of bytes) {
      lines.push(formatDefbLine(byte, useMask));
    }
  }

  return lines;
}

/**
 * Generates `count` complete rows of zeroed `defb` padding directives.
 * Each row occupies `ceil(width / 8)` bytes.
 *
 * Used for SP1 sprite padding (vertical rotation guard rows).
 *
 * Without mask: `defb @00000000` per byte (empty row).
 * With mask:    `defb @11111111, @00000000` per byte (opaque mask, empty data).
 *
 * @param count   - Number of padding rows to generate.
 * @param width   - Width in pixels (determines bytes per row).
 * @param useMask - When `true`, includes the mask byte in each directive.
 *                  Defaults to `false`.
 * @returns Array of indented `defb` lines.
 */
export function generatePaddingDefbLines(
  count: number,
  width: number,
  useMask = false,
): string[] {
  const lines: string[] = [];
  const bytesPerRow = Math.ceil(width / 8);

  for (let row = 0; row < count; row++) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
      lines.push(
        useMask ? "    defb @11111111, @00000000" : "    defb @00000000",
      );
    }
  }

  return lines;
}
