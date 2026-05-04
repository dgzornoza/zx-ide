// ─── Internal helpers ─────────────────────────────────────────────────────────

import { ZxpColorAttribute } from "src/helpers/image-utils";

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
 * Converts a {@link ZxpColorAttribute} to its ZX Spectrum raw attribute byte.
 *
 * Bit layout:
 * - Bit 7: Flash
 * - Bit 6: Bright
 * - Bits 5–3: Paper colour index
 * - Bits 2–0: Ink colour index
 */
function attributeToByte(attribute: ZxpColorAttribute): number {
  return (
    (attribute.flash ? 0x80 : 0) |
    (attribute.bright ? 0x40 : 0) |
    ((attribute.paper & 0x07) << 3) |
    (attribute.ink & 0x07)
  );
}

// ─── defb line generators ─────────────────────────────────────────────────────

/** Formats a single byte as a `$XX` hex string. */
function toHexByte(value: number): string {
  return `$${value.toString(16).padStart(2, "0").toUpperCase()}`;
}

/**
 * Converts a row-major ink bitmap into assembly `defb` directives
 * using hexadecimal byte values.
 *
 * Groups bytes 8 per `defb` line (16 per line when `useMask` is true,
 * since each data byte is preceded by its mask byte).
 *
 * Without mask: `defb $XX,$XX,$XX,$XX,$XX,$XX,$XX,$XX`
 * With mask:    `defb $MM,$XX,$MM,$XX,$MM,$XX,$MM,$XX,$MM,$XX,$MM,$XX,$MM,$XX,$MM,$XX`
 *               where `$MM` is the bitwise NOT of the data byte
 *               (transparent pixels → 1, ink pixels → 0).
 *
 * @example
 * // 8×2 bitmap where only the top-left pixel of each row is ink:
 * generateBitmapDefbLines([true, false, ...], 8, 2);
 * // → ['    defb $80,$00']
 *
 * @example
 * // 8×1 bitmap with mask, leftmost pixel is ink:
 * generateBitmapDefbLines([true, false, ...], 8, 1, true);
 * // → ['    defb $7F,$80']
 *
 * @param inkBitmap - Row-major boolean[] of length `width × height`.
 * @param width     - Width in pixels.
 * @param height    - Height in pixels.
 * @param useMask   - When `true`, prepends a computed mask byte before each
 *                    data byte. Defaults to `false`.
 * @returns Array of indented `defb` lines ready to join into an ASM file.
 */
export function generateBitmapDefbLines(
  inkBitmap: boolean[],
  width: number,
  height: number,
  useMask = false,
): string[] {
  const entries: string[] = [];

  for (let row = 0; row < height; row++) {
    const bytes = bitmapRowToBytes(inkBitmap, row * width, width);
    for (const byte of bytes) {
      if (useMask) {
        entries.push(toHexByte(~byte & 0xff));
      }
      entries.push(toHexByte(byte));
    }
  }

  const bytesPerLine = useMask ? 16 : 8;
  const lines: string[] = [];
  for (let i = 0; i < entries.length; i += bytesPerLine) {
    lines.push(`    defb ${entries.slice(i, i + bytesPerLine).join(",")}`);
  }
  return lines;
}

/**
 * Extracts a single 8-pixel column from a row-major ink bitmap and converts
 * it into assembly `defb` directives.
 *
 * @param inkBitmap - Row-major boolean[] of length `width × height`.
 * @param width     - Total width of the sprite in pixels (used to index rows).
 * @param height    - Height in pixels.
 * @param colIndex  - The 0-based column index to extract (each column is 8px wide).
 * @param useMask   - When `true`, prepends a computed mask byte.
 */
export function generateColumnBitmapDefbLines(
  inkBitmap: boolean[],
  width: number,
  height: number,
  colIndex: number,
  useMask = false,
): string[] {
  const entries: string[] = [];

  for (let row = 0; row < height; row++) {
    const bytes = bitmapRowToBytes(inkBitmap, row * width, width);
    const byte = bytes[colIndex] ?? 0;
    if (useMask) {
      entries.push(toHexByte(~byte & 0xff));
    }
    entries.push(toHexByte(byte));
  }

  const bytesPerLine = useMask ? 2 : 1;
  const lines: string[] = [];
  for (let i = 0; i < entries.length; i += bytesPerLine) {
    lines.push(`    defb ${entries.slice(i, i + bytesPerLine).join(",")}`);
  }
  return lines;
}

/**
 * Generates `count` complete rows of zeroed `defb` padding directives
 * using hexadecimal byte values, grouped 8 bytes per line (16 with mask).
 *
 * Used for SP1 sprite padding (vertical rotation guard rows).
 *
 * Without mask: `defb $00,$00,...` (8 zero bytes per line).
 * With mask:    `defb $FF,$00,$FF,$00,...` (opaque mask + zero data, 16 entries per line).
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
  const bytesPerRow = Math.ceil(width / 8);
  const entries: string[] = [];

  for (let row = 0; row < count; row++) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
      if (useMask) {
        entries.push("$FF");
      }
      entries.push("$00");
    }
  }

  const bytesPerLine = useMask ? 16 : 8;
  const lines: string[] = [];
  for (let i = 0; i < entries.length; i += bytesPerLine) {
    lines.push(`    defb ${entries.slice(i, i + bytesPerLine).join(",")}`);
  }
  return lines;
}

/**
 * Converts a flat row-major array of tile indices into assembly `defb`
 * directives using decimal values, one map row per line.
 *
 * Used by map code generators where tiles are addressed by uint8 index (0-255).
 *
 * @example
 * generateIndexDefbLines([1,2,3,0,4,5,6,0], 4);
 * // -> ['    defb 1,2,3,0', '    defb 4,5,6,0']
 *
 * @param indices  - Flat row-major array of tile indices.
 * @param rowWidth - Number of indices per row (= map width in tiles).
 * @returns Array of indented `defb` lines ready to join into an ASM file.
 */
export function generateIndexDefbLines(
  indices: number[],
  rowWidth: number,
): string[] {
  const rowCount = Math.floor(indices.length / rowWidth);
  const lines: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    const rowValues = indices.slice(row * rowWidth, row * rowWidth + rowWidth);
    lines.push(`    defb ${rowValues.join(",")}`);
  }
  return lines;
}

/**
 * Generates `defb` lines for the tile attributes array,
 * including only the tiles at `includedIndices`, 8 bytes per line.
 */
export function generateAttributeDefbLines(
  attributes: ZxpColorAttribute[],
  includedIndices: number[],
): string[] {
  const hexBytes = includedIndices.map((tileIndex) => {
    const attribute = attributes[tileIndex] ?? {
      flash: false,
      bright: false,
      paper: 7,
      ink: 0,
    };
    return toHexByte(attributeToByte(attribute));
  });

  const lines: string[] = [];
  for (let offset = 0; offset < hexBytes.length; offset += 8) {
    lines.push(`    defb ${hexBytes.slice(offset, offset + 8).join(",")}`);
  }
  return lines;
}
