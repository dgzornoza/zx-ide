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

// ─── Shared low-level helpers ─────────────────────────────────────────────────

/**
 * Creates an object URL for `file`, loads it into an HTMLImageElement, and
 * returns the resolved image together with a `cleanup()` function that revokes
 * the object URL.  Call `cleanup()` once the image is no longer needed to
 * avoid memory leaks.
 */
function loadImage(
  file: File,
): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => resolve({ img, cleanup });
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image file"));
    };
    img.src = url;
  });
}

/**
 * Draws the rectangular region `(sx, sy, sw, sh)` from `img` onto a new
 * offscreen canvas sized `sw × sh` and returns that canvas.
 * The caller can then call `canvas.toDataURL()` or `ctx.getImageData()`.
 */
function drawRegionToCanvas(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return { canvas, ctx };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
 * generates a base64 data-URL preview for each tile, and returns the results.
 */
export async function extractTilesFromFile(
  params: ExtractTilesFromFileModel,
): Promise<ExtractTilesFromFileResult> {
  const { img, cleanup } = await loadImage(params.file);

  const tileWidth = Math.max(1, Math.floor(params.tileWidth));
  const tileHeight = Math.max(1, Math.floor(params.tileHeight));
  const cols = Math.floor(img.width / tileWidth);
  const rows = Math.floor(img.height / tileHeight);
  const count = cols * rows;

  const previews: string[] = [];
  const bitmasks: boolean[][] = [];

  // create tiles in row-major order (left-to-right, top-to-bottom)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const { canvas, ctx } = drawRegionToCanvas(
        img,
        col * tileWidth,
        row * tileHeight,
        tileWidth,
        tileHeight,
      );
      previews.push(canvas.toDataURL("image/png"));

      // Extract per-pixel ink/paper bitmask (true = light/ink pixel)
      const imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);
      const tileMask: boolean[] = [];
      for (let p = 0; p < tileWidth * tileHeight; p++) {
        const r = imageData.data[p * 4];
        const g = imageData.data[p * 4 + 1];
        const b = imageData.data[p * 4 + 2];
        const a = imageData.data[p * 4 + 3];
        // Treat transparent or very light pixels as ink (true)
        const brightness = a < 128 ? 255 : (r + g + b) / 3;
        tileMask.push(brightness > 127);
      }
      bitmasks.push(tileMask);
    }
  }

  cleanup();
  return { count, previews, bitmasks };
}

/**
 * Extracts a single rectangular region from a PNG File and returns it as a
 * base64 PNG data-URL, suitable for use as a sprite-frame thumbnail.
 *
 * Returns `""` when the source file is `null` or the dimensions are invalid
 * (zero or negative), so callers can render a placeholder instead.
 *
 * @param file   - The source PNG File (same image used for tile extraction).
 * @param x      - Left pixel offset of the region in the source image (0-based).
 * @param y      - Top pixel offset of the region in the source image (0-based).
 * @param width  - Region width in pixels.
 * @param height - Region height in pixels.
 */
export async function extractSpriteFramePreview(
  file: File | null,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  if (!file || width <= 0 || height <= 0) return "";

  const { img, cleanup } = await loadImage(file);
  const { canvas } = drawRegionToCanvas(img, x, y, width, height);
  cleanup();
  return canvas.toDataURL("image/png");
}

// ─── Bitmask-to-bytes helpers ─────────────────────────────────────────────────

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
    const bytes = tileRowToBytes(bitmask, rowOffset, tileWidth);
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
 * const bitmask = [true, true, false, false, true, true, false, false];
 * tileRowToBytes(bitmask, 0, 8);
 * // → [0b11001100]  →  [204]
 *
 * @param bitmask   - Flat row-major boolean array for the entire tile.
 * @param rowOffset - Index into `bitmask` where this row begins.
 * @param tileWidth - Width of the tile in pixels (determines how many
 *                    booleans to read and how many bytes to produce).
 * @returns Array of bytes, length = `ceil(tileWidth / 8)`.
 */
function tileRowToBytes(
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
