export interface ExtractTilesFromFileModel {
  file: File;
  tileWidth: number;
  tileHeight: number;
}

export interface ExtractTilesFromFileResult {
  count: number;
  previews: string[];
  /**
   * Per-tile pixel bitmap, row-major order.
   * `inkBitmaps[tileIndex]` is a boolean[] of length `tileWidth * tileHeight`.
   * `true` = ink pixel (light), `false` = paper pixel (dark).
   */
  inkBitmaps: boolean[][];
}

/**
 * Rectangular region.
 */
export interface Rect {
  /** Left offset of the region. */
  x: number;
  /** Top offset of the region. */
  y: number;
  /** Region width in pixels. */
  width: number;
  /** Region height in pixels. */
  height: number;
}

// ─── Shared low-level helpers ─────────────────────────────────────────────────

/**
 * Loads an image from a File, invokes the callback with the loaded image, and automatically cleans up the object URL after the callback completes.
 *
 * @param file - The image file to load.
 * @param callback - Function to invoke with the loaded HTMLImageElement.
 *                   Can be async; cleanup is called after it resolves.
 */
async function loadImage<T>(
  file: File,
  callback: (img: HTMLImageElement) => Promise<T> | T,
): Promise<T> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  const cleanup = () => URL.revokeObjectURL(url);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => {
        cleanup();
        reject(new Error("Failed to load image file"));
      };
      img.src = url;
    });

    const result = await callback(img);
    cleanup();

    return result;
  } catch (err) {
    cleanup();
    throw err;
  }
}

/**
 * Draws the rectangular region `(sx, sy, sw, sh)` from `img` onto a new
 * offscreen canvas sized `sw × sh` and returns that canvas.
 * The caller can then call `canvas.toDataURL()` or `ctx.getImageData()`.
 */
function drawRegionToCanvas(
  img: HTMLImageElement,
  rect: Rect,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
  return { canvas, ctx };
}

/**
 * Converts the pixel data from `CanvasRenderingContext2D (ctx)` into a boolean array where
 * `true` = white / ink pixel (light) and `false` = black or transparent (dark).
 * @param ctx The canvas rendering context containing the image data.
 * @param tileWidth The width of the tile in pixels.
 * @param tileHeight The height of the tile in pixels.
 * @returns A boolean array representing the bitmask (true = white/1).
 */
function getInkBitmap(
  ctx: CanvasRenderingContext2D,
  tileWidth: number,
  tileHeight: number,
) {
  const imageData = ctx.getImageData(0, 0, tileWidth, tileHeight);

  const inkBitmap: boolean[] = [];
  for (let pixel = 0; pixel < tileWidth * tileHeight; pixel++) {
    const r = imageData.data[pixel * 4];
    const g = imageData.data[pixel * 4 + 1];
    const b = imageData.data[pixel * 4 + 2];
    const a = imageData.data[pixel * 4 + 3];

    // Treat transparent pixels as dark (false). White/bright pixels => true (1).
    const brightness = a < 128 ? 0 : (r + g + b) / 3;
    inkBitmap.push(brightness > 127);
  }

  return inkBitmap;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
 * generates a base64 data-URL preview for each tile, and returns the results.
 */
export async function extractTilesFromFile(
  params: ExtractTilesFromFileModel,
): Promise<ExtractTilesFromFileResult> {
  return loadImage(params.file, (img) => {
    const tileWidth = Math.max(1, Math.floor(params.tileWidth));
    const tileHeight = Math.max(1, Math.floor(params.tileHeight));
    const cols = Math.floor(img.width / tileWidth);
    const rows = Math.floor(img.height / tileHeight);
    const count = cols * rows;

    const previews: string[] = [];
    const inkBitmaps: boolean[][] = [];

    // create tiles in row-major order (left-to-right, top-to-bottom)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const { canvas, ctx } = drawRegionToCanvas(img, {
          x: col * tileWidth,
          y: row * tileHeight,
          width: tileWidth,
          height: tileHeight,
        });
        previews.push(canvas.toDataURL("image/png"));

        // Extract per-pixel bitmask (true = white/1, false = black/transparent/0)
        const inkBitmap: boolean[] = getInkBitmap(ctx, tileWidth, tileHeight);

        inkBitmaps.push(inkBitmap);
      }
    }
    return { count, previews, inkBitmaps: inkBitmaps };
  });
}

/**
 * Loads a PNG File **once** and extracts pixel bitmasks for all sprite frames
 * described by `requests`.
 *
 * Bitmasks use the same convention as {@link extractTilesFromFile}:
 * `true` = white pixel (light), `false` = black or transparent (dark).
 *
 * @param file     - The source PNG File.
 * @param requests - Two-dimensional array `[spriteIndex][frameIndex]` of
 *                   rectangular regions to extract.
 * @returns Three-dimensional boolean array `[spriteIndex][frameIndex][pixelIndex]`
 *          in row-major order.
 */
export async function extractSpritesFromFile(
  file: File,
  requests: Rect[][],
): Promise<boolean[][][]> {
  return loadImage(file, (img) => {
    const result: boolean[][][] = requests.map((spriteRequests) =>
      spriteRequests.map((sprite) => {
        if (sprite.width <= 0 || sprite.height <= 0) return [];

        const { ctx } = drawRegionToCanvas(img, sprite);

        // Extract per-pixel bitmask (true = white/1, false = black/transparent/0)
        return getInkBitmap(ctx, sprite.width, sprite.height);
      }),
    );
    return result;
  });
}

/**
 * Extracts a single rectangular region from a PNG File and returns it as a
 * base64 PNG data-URL, suitable for use as a sprite-frame thumbnail.
 *
 * Returns `""` when the source file is `null` or the dimensions are invalid
 * (zero or negative), so callers can render a placeholder instead.
 *
 * @param file   - The source PNG File (same image used for tile extraction).
 * @param rect   - The rectangular region to extract.
 */
export async function extractSpriteFramePreview(
  file: File | null,
  rect: Rect,
): Promise<string> {
  if (!file || rect.width <= 0 || rect.height <= 0) return "";
  return loadImage(file, (img) => {
    const { canvas } = drawRegionToCanvas(img, rect);
    return canvas.toDataURL("image/png");
  });
}
