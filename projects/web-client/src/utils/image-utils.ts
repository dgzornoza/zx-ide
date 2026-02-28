export interface ExtractTilesFromFileModel {
  file: File;
  tileWidth: number;
  tileHeight: number;
}

export interface ExtractTilesFromFileResult {
  count: number;
  previews: string[];
  /**
   * Per-tile pixel bitmask, row-major order.
   * `bitmasks[tileIndex]` is a boolean[] of length `tileWidth * tileHeight`.
   * `true` = ink pixel (dark), `false` = paper pixel (light).
   */
  bitmasks: boolean[][];
}

/**
 * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
 * generates a base64 data-URL preview for each tile, and returns the results.
 */
export function extractTilesFromFile(
  params: ExtractTilesFromFileModel,
): Promise<ExtractTilesFromFileResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(params.file);
    const img = new Image();

    img.onload = () => {
      const tileWidth = Math.max(1, Math.floor(params.tileWidth));
      const tileHeight = Math.max(1, Math.floor(params.tileHeight));
      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      const count = cols * rows;

      const canvas = document.createElement("canvas");
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      const ctx = canvas.getContext("2d")!;

      const previews: string[] = [];
      const bitmasks: boolean[][] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, tileWidth, tileHeight);
          ctx.drawImage(
            img,
            col * tileWidth,
            row * tileHeight,
            tileWidth,
            tileHeight,
            0,
            0,
            tileWidth,
            tileHeight,
          );
          previews.push(canvas.toDataURL("image/png"));

          // Extract per-pixel ink/paper bitmask (true = dark/ink pixel)
          const imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);
          const tileMask: boolean[] = [];
          for (let p = 0; p < tileWidth * tileHeight; p++) {
            const r = imageData.data[p * 4];
            const g = imageData.data[p * 4 + 1];
            const b = imageData.data[p * 4 + 2];
            const a = imageData.data[p * 4 + 3];
            // Treat transparent or very light pixels as paper (false)
            const brightness = a < 128 ? 255 : (r + g + b) / 3;
            tileMask.push(brightness < 128);
          }
          bitmasks.push(tileMask);
        }
      }

      URL.revokeObjectURL(url);
      resolve({ count, previews, bitmasks });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load Image file"));
    };

    img.src = url;
  });
}

// ─── Bitmask-to-bytes helpers ─────────────────────────────────────────────────

/**
 * Packs one row of boolean ink values into an array of bytes
 * (one byte per 8 pixels, MSB = leftmost pixel).
 *
 * @example
 * // A 8-pixel row: ██░░██░░ (true = ink, false = paper)
 * const bitmask = [true, true, false, false, true, true, false, false];
 * rowToBytes(bitmask, 0, 8);
 * // → [0b11001100]  →  [204]
 *
 * @param bitmask   - Flat row-major boolean array for the entire tile.
 * @param rowOffset - Index into `bitmask` where this row begins.
 * @param tileWidth - Width of the tile in pixels (determines how many
 *                    booleans to read and how many bytes to produce).
 * @returns Array of bytes, length = `ceil(tileWidth / 8)`.
 */
export function rowToBytes(
  bitmask: boolean[],
  rowOffset: number,
  tileWidth: number,
): number[] {
  const bytesPerRow = Math.ceil(tileWidth / 8);
  const bytes: number[] = [];
  for (let b = 0; b < bytesPerRow; b++) {
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
      const col = b * 8 + bit;
      // MSB = leftmost pixel
      if (col < tileWidth && bitmask[rowOffset + col]) {
        value |= 1 << (7 - bit);
      }
    }
    bytes.push(value);
  }
  return bytes;
}

/**
 * Converts a full tile bitmask into assembly `defb` directives, one per byte.
 *
 * Each row of the tile produces `ceil(tileWidth / 8)` directives using binary
 * notation (`@XXXXXXXX`), suitable for sjasmplus / Z88DK assemblers.
 *
 * @example
 * // 2×2 tile where top-left and bottom-right pixels are ink:
 * // ██░░░░░░
 * // ░░░░░░██
 * const bitmask = [
 *   true, false, false, false, false, false, false, false,
 *   false, false, false, false, false, false, false, true,
 * ];
 * generateTileDefbLines(bitmask, 8, 2);
 * // → [
 * //   '    defb @10000000',
 * //   '    defb @00000001',
 * // ]
 *
 * @param bitmask    - Row-major boolean[] of length `tileWidth * tileHeight`.
 * @param tileWidth  - Tile width in pixels.
 * @param tileHeight - Tile height in pixels.
 * @returns Array of indented `defb` lines ready to join into an ASM file.
 */
export function generateTileDefbLines(
  bitmask: boolean[],
  tileWidth: number,
  tileHeight: number,
): string[] {
  const lines: string[] = [];
  for (let row = 0; row < tileHeight; row++) {
    const rowOffset = row * tileWidth;
    const bytes = rowToBytes(bitmask, rowOffset, tileWidth);
    for (const byte of bytes) {
      const bits = byte.toString(2).padStart(8, "0");
      lines.push(`    defb @${bits}`);
    }
  }
  return lines;
}
