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
  /** Number of tile columns derived from the source image dimensions. */
  columns: number;
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

/**
 * Decoded ZX Spectrum colour attribute byte.
 *
 * Bit layout of the raw attribute byte:
 * - Bit 7: Flash
 * - Bit 6: Bright
 * - Bits 5–3: Paper colour index (0–7)
 * - Bits 2–0: Ink colour index (0–7)
 */
export interface ZxpColorAttribute {
  /** Bit 7 — flash effect enabled. */
  flash: boolean;
  /** Bit 6 — bright palette variant. */
  bright: boolean;
  /** Bits 5–3 — paper (background) colour index (0–7). */
  paper: number;
  /** Bits 2–0 — ink (foreground) colour index (0–7). */
  ink: number;
}

/**
 * Result of {@link extractTilesFromZxpFile}.
 * Extends {@link ExtractTilesFromFileResult} with a per-tile colour attribute.
 */
export interface ExtractTilesFromZxpFileResult extends ExtractTilesFromFileResult {
  /**
   * Per-tile decoded ZX Spectrum colour attribute.
   * `attributes[i]` corresponds to `inkBitmaps[i]` and `previews[i]`.
   */
  attributes: ZxpColorAttribute[];
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
 * Creates an offscreen canvas of the given dimensions and returns it
 * together with its 2D rendering context.
 */
function createCanvas(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
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
  const { canvas, ctx } = createCanvas(rect.width, rect.height);
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
export async function extractTilesFromPng(
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
    return { count, previews, inkBitmaps: inkBitmaps, columns: cols };
  });
}

/**
 * Loads a PNG File **once** and extracts pixel bitmasks for all sprite frames
 * described by `requests`.
 *
 * Bitmasks use the same convention as {@link extractTilesFromPng}:
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

// ─── ZX-Paintbrush (.zxp) tile extraction ────────────────────────────────────

/**
 * ZX Spectrum colour palette — normal intensity.
 * Index corresponds to colour number (0 = black … 7 = white).
 */
const ZX_COLORS_NORMAL: readonly string[] = [
  "#000000",
  "#0000D7",
  "#D70000",
  "#D700D7",
  "#00D700",
  "#00D7D7",
  "#D7D700",
  "#D7D7D7",
];

/**
 * ZX Spectrum colour palette — bright intensity.
 * Index corresponds to colour number (0 = black … 7 = white).
 */
const ZX_COLORS_BRIGHT: readonly string[] = [
  "#000000",
  "#0000FF",
  "#FF0000",
  "#FF00FF",
  "#00FF00",
  "#00FFFF",
  "#FFFF00",
  "#FFFFFF",
];

/**
 * Parses a ZX-Paintbrush `.zxp` text file, extracts all 8×8 tiles in
 * row-major order (left-to-right, top-to-bottom), and returns:
 * - `count`      — total number of tiles.
 * - `previews`   — base64 PNG data-URLs rendered with real ZX Spectrum colours.
 * - `inkBitmaps` — per-tile boolean pixel bitmask (`true` = ink pixel).
 * - `attributes` — per-tile decoded ZX Spectrum colour attribute.
 *
 * The tile size is always 8×8 pixels (one attribute per tile).
 *
 * @param file - The `.zxp` text file to parse.
 */
export async function extractTilesFromZxpFile(
  file: File,
): Promise<ExtractTilesFromZxpFileResult> {
  const text = await file.text();
  const {
    pixels,
    attributes: parsedAttributes,
    tilesPerRow,
    tileRows,
  } = parseZxpFile(text);

  const count = tilesPerRow * tileRows;
  const previews: string[] = [];
  const inkBitmaps: boolean[][] = [];
  const tileAttributes: ZxpColorAttribute[] = [];

  for (let tileRow = 0; tileRow < tileRows; tileRow++) {
    for (let tileCol = 0; tileCol < tilesPerRow; tileCol++) {
      const tileIndex = tileRow * tilesPerRow + tileCol;
      // Fall back to black ink on white paper if the attribute is missing.
      const attribute: ZxpColorAttribute = parsedAttributes[tileIndex] ?? {
        flash: false,
        bright: false,
        paper: 7,
        ink: 0,
      };

      const canvas = renderZxpTileToCanvas(pixels, tileCol, tileRow, attribute);
      previews.push(canvas.toDataURL("image/png"));

      const baseRow = tileRow * 8;
      const baseCol = tileCol * 8;
      const inkBitmap: boolean[] = [];
      for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
        for (let pixelCol = 0; pixelCol < 8; pixelCol++) {
          inkBitmap.push(
            pixels[baseRow + pixelRow]?.[baseCol + pixelCol] ?? false,
          );
        }
      }

      inkBitmaps.push(inkBitmap);
      tileAttributes.push(attribute);
    }
  }

  return {
    count,
    previews,
    inkBitmaps,
    attributes: tileAttributes,
    columns: tilesPerRow,
  };
}

/**
 * Parses the plain-text content of a ZX-Paintbrush `.zxp` file into raw pixel
 * rows and decoded colour attributes.
 *
 * The file format is:
 * 1. An optional header line (`ZX-Paintbrush image`).
 * 2. Lines of `0`/`1` characters — one line per pixel row.
 * 3. Blank line(s) separating the two sections.
 * 4. Lines of space-separated two-digit hex attribute bytes — one line per
 *    row of 8×8-pixel tiles.
 */
function parseZxpFile(text: string): {
  pixels: boolean[][];
  attributes: ZxpColorAttribute[];
  tilesPerRow: number;
  tileRows: number;
} {
  const lines = text.split(/\r?\n/).map((line) => line.trim());

  const pixels: boolean[][] = [];
  const attributes: ZxpColorAttribute[] = [];

  for (const line of lines) {
    if (/^[01]+$/.test(line)) {
      pixels.push(Array.from(line, (character) => character === "1"));
    } else if (/^(?:[0-9A-Fa-f]{2}\s*)+$/.test(line)) {
      for (const hex of line.split(/\s+/).filter(Boolean)) {
        const byte = Number.parseInt(hex, 16);
        attributes.push({
          flash: (byte & 0x80) !== 0,
          bright: (byte & 0x40) !== 0,
          paper: (byte >> 3) & 0x07,
          ink: byte & 0x07,
        });
      }
    }
  }

  const pixelCols = pixels.length > 0 ? pixels[0].length : 0;
  const tilesPerRow = Math.floor(pixelCols / 8);
  const tileRows = Math.floor(pixels.length / 8);

  return { pixels, attributes, tilesPerRow, tileRows };
}

/**
 * Renders an 8×8 tile from a `.zxp` pixel grid onto a new offscreen canvas,
 * using the ZX Spectrum ink/paper colours from `attribute`.
 *
 * @param pixels    - Full pixel grid (row-major boolean array from {@link parseZxpFile}).
 * @param tileCol   - Tile column index (0-based).
 * @param tileRow   - Tile row index (0-based).
 * @param attribute - Decoded ZX Spectrum colour attribute for this tile.
 * @returns A 8×8 offscreen canvas with the tile rendered in Spectrum colours.
 */
function renderZxpTileToCanvas(
  pixels: boolean[][],
  tileCol: number,
  tileRow: number,
  attribute: ZxpColorAttribute,
): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(8, 8);

  const palette = attribute.bright ? ZX_COLORS_BRIGHT : ZX_COLORS_NORMAL;
  const inkColor = palette[attribute.ink];
  const paperColor = palette[attribute.paper];

  const baseRow = tileRow * 8;
  const baseCol = tileCol * 8;

  for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
    for (let pixelCol = 0; pixelCol < 8; pixelCol++) {
      const isInk = pixels[baseRow + pixelRow]?.[baseCol + pixelCol] ?? false;
      ctx.fillStyle = isInk ? inkColor : paperColor;
      ctx.fillRect(pixelCol, pixelRow, 1, 1);
    }
  }

  return canvas;
}

// ─── Tileset map preview ─────────────────────────────────────────────────────

/** Tile-grid dimensions needed by {@link renderTilesetMapPreview}. */
export interface TileMapRenderOptions {
  mapWidth: number;
  mapHeight: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
}

/**
 * Renders a Tiled map onto `canvas` by sampling tiles from a tileset
 * {@link ImageBitmap}.
 *
 * Each cell in the flat `tileIndices` array is a 1-based tile index
 * (0 = empty/transparent). The function sizes the canvas to
 * `(mapWidth * tileWidth) × (mapHeight * tileHeight)` and draws each
 * non-empty tile by slicing it out of `bitmap` using its column / row
 * position in the tileset sheet.
 *
 * @param canvas      - Target canvas element.
 * @param tileIndices - Flat row-major tile index array (0 = transparent).
 * @param options     - Map and tile dimensions.
 * @param bitmap      - Decoded tileset image, or `null` if not yet loaded.
 */
export function renderTilesetMapPreview(
  canvas: HTMLCanvasElement,
  tileIndices: number[],
  options: TileMapRenderOptions,
  bitmap: ImageBitmap | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const { mapWidth, mapHeight, tileWidth, tileHeight, columns } = options;

  canvas.width = mapWidth * tileWidth;
  canvas.height = mapHeight * tileHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!bitmap) {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#aaa";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("No tileset image", canvas.width / 2, canvas.height / 2);
    return;
  }

  for (let row = 0; row < mapHeight; row++) {
    for (let col = 0; col < mapWidth; col++) {
      const localIndex = tileIndices[row * mapWidth + col] ?? 0;
      if (localIndex === 0) {
        continue;
      }

      const tileColumn = (localIndex - 1) % columns;
      const tileRow = Math.floor((localIndex - 1) / columns);
      ctx.drawImage(
        bitmap,
        tileColumn * tileWidth,
        tileRow * tileHeight,
        tileWidth,
        tileHeight,
        col * tileWidth,
        row * tileHeight,
        tileWidth,
        tileHeight,
      );
    }
  }
}

/**
 * Renders a map preview using decoded tile bitmaps instead of a PNG tileset image.
 *
 * Each value in `tileIndices` is 1-based (0 means transparent cell).
 * `tileInkBitmaps[tileIndex]` is a row-major boolean array where true=ink pixel.
 */
export function renderTilesetMapPreviewFromTileData(
  canvas: HTMLCanvasElement,
  tileIndices: number[],
  options: TileMapRenderOptions,
  tileInkBitmaps: boolean[][],
  attributeBytes: number[] = [],
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const { mapWidth, mapHeight, tileWidth, tileHeight } = options;

  canvas.width = mapWidth * tileWidth;
  canvas.height = mapHeight * tileHeight;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const resolveTileColors = (
    attributeByte: number | undefined,
  ): { paperColor: string; inkColor: string } => {
    if (attributeByte === undefined) {
      return { paperColor: "#000000", inkColor: "#FFFFFF" };
    }

    const bright = (attributeByte & 0x40) !== 0;
    const paper = (attributeByte >> 3) & 0x07;
    const ink = attributeByte & 0x07;
    const palette = bright ? ZX_COLORS_BRIGHT : ZX_COLORS_NORMAL;
    return {
      paperColor: palette[paper] ?? "#000000",
      inkColor: palette[ink] ?? "#FFFFFF",
    };
  };

  const drawTileBitmap = (
    bitmap: boolean[],
    xOffset: number,
    yOffset: number,
    paperColor: string,
    inkColor: string,
  ) => {
    for (let pixelRow = 0; pixelRow < tileHeight; pixelRow++) {
      for (let pixelColumn = 0; pixelColumn < tileWidth; pixelColumn++) {
        const pixelIndex = pixelRow * tileWidth + pixelColumn;
        ctx.fillStyle = bitmap[pixelIndex] ? inkColor : paperColor;
        ctx.fillRect(xOffset + pixelColumn, yOffset + pixelRow, 1, 1);
      }
    }
  };

  for (let row = 0; row < mapHeight; row++) {
    for (let col = 0; col < mapWidth; col++) {
      const localIndex = tileIndices[row * mapWidth + col] ?? 0;
      if (localIndex === 0) {
        continue;
      }

      const tileIndex = localIndex - 1;
      const bitmap = tileInkBitmaps[tileIndex];
      if (!bitmap) {
        continue;
      }

      const attributeByte = attributeBytes[tileIndex];
      const { paperColor, inkColor } = resolveTileColors(attributeByte);

      const xOffset = col * tileWidth;
      const yOffset = row * tileHeight;

      drawTileBitmap(bitmap, xOffset, yOffset, paperColor, inkColor);
    }
  }
}

// ─── Tile sheet PNG export ────────────────────────────────────────────────────

/**
 * Renders all tile previews onto a single tile-sheet canvas (columns × rows grid)
 * at the real tile size, overlaying a red diagonal cross on excluded tiles.
 *
 * @param previews    - Per-tile base64 PNG data-URL array, row-major order.
 * @param columns     - Number of tile columns (from the source file).
 * @param tileWidth   - Width of each tile cell in pixels.
 * @param tileHeight  - Height of each tile cell in pixels.
 * @param excludedSet - Set of tile indices that are marked as excluded.
 * @returns A Promise resolving to a PNG {@link Blob} of the tile sheet.
 */
export function generateTileSheetPng(
  previews: string[],
  columns: number,
  tileWidth: number,
  tileHeight: number,
  excludedSet: Set<number>,
): Promise<Blob> {
  const count = previews.length;
  const cols = Math.max(1, columns);
  const rows = Math.ceil(count / cols);

  const { canvas, ctx } = createCanvas(cols * tileWidth, rows * tileHeight);

  const drawTile = (index: number, dataUrl: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * tileWidth;
        const y = row * tileHeight;
        ctx.drawImage(img, x, y, tileWidth, tileHeight);

        if (excludedSet.has(index)) {
          ctx.save();
          ctx.strokeStyle = "red";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + tileWidth, y + tileHeight);
          ctx.moveTo(x + tileWidth, y);
          ctx.lineTo(x, y + tileHeight);
          ctx.stroke();
          ctx.restore();
        }

        resolve();
      };
      img.src = dataUrl;
    });

  return Promise.all(
    previews.map((dataUrl, index) => drawTile(index, dataUrl)),
  ).then(
    () =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to generate tile sheet PNG blob"));
          }
        }, "image/png");
      }),
  );
}
