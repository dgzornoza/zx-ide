import { getFileExtension } from './file-utils';
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
async function loadImage<Result>(file: File, callback: (image: HTMLImageElement) => Promise<Result> | Result): Promise<Result> {
  // VS Code webviews enforce a Content Security Policy that blocks blob: URLs
  // for img-src. Use a data URL (data:<mime>;base64,...) so the browser can
  // decode the image without violating the CSP.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image file'));
    image.src = dataUrl;
  });

  return await callback(image);
}

/**
 * Creates an offscreen canvas of the given dimensions and returns it
 * together with its 2D rendering context.
 */
function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  return { canvas, context };
}

/**
 * Draws the rectangular `region` from `image` onto a new offscreen canvas
 * of the same size and returns that canvas.
 * The caller can then call `canvas.toDataURL()` or `context.getImageData()`.
 */
function drawRegionToCanvas(image: HTMLImageElement, region: Rect): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const { canvas, context } = createCanvas(region.width, region.height);
  context.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
  return { canvas, context };
}

/**
 * Converts the pixel data from `CanvasRenderingContext2D (context)` into a boolean array where
 * `true` = white / ink pixel (light) and `false` = black or transparent (dark).
 * @param context The canvas rendering context containing the image data.
 * @param tileWidth The width of the tile in pixels.
 * @param tileHeight The height of the tile in pixels.
 * @returns A boolean array representing the bitmask (true = white/1).
 */
function getInkBitmap(context: CanvasRenderingContext2D, tileWidth: number, tileHeight: number) {
  const imageData = context.getImageData(0, 0, tileWidth, tileHeight);

  const inkBitmap: boolean[] = [];
  for (let pixel = 0; pixel < tileWidth * tileHeight; pixel++) {
    const red = imageData.data[pixel * 4];
    const green = imageData.data[pixel * 4 + 1];
    const blue = imageData.data[pixel * 4 + 2];
    const alpha = imageData.data[pixel * 4 + 3];

    // Treat transparent pixels as dark (false). White/bright pixels => true (1).
    const brightness = alpha < 128 ? 0 : (red + green + blue) / 3;
    inkBitmap.push(brightness > 127);
  }

  return inkBitmap;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
 * generates a base64 data-URL preview for each tile, and returns the results.
 */
export async function extractTilesFromPng(parameters: ExtractTilesFromFileModel): Promise<ExtractTilesFromFileResult> {
  return loadImage(parameters.file, (image) => {
    const tileWidth = Math.max(1, Math.floor(parameters.tileWidth));
    const tileHeight = Math.max(1, Math.floor(parameters.tileHeight));
    const columnCount = Math.floor(image.width / tileWidth);
    const rows = Math.floor(image.height / tileHeight);
    const count = columnCount * rows;

    const previews: string[] = [];
    const inkBitmaps: boolean[][] = [];

    // create tiles in row-major order (left-to-right, top-to-bottom)
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columnCount; column++) {
        const { canvas, context } = drawRegionToCanvas(image, {
          x: column * tileWidth,
          y: row * tileHeight,
          width: tileWidth,
          height: tileHeight,
        });
        previews.push(canvas.toDataURL('image/png'));

        // Extract per-pixel bitmask (true = white/1, false = black/transparent/0)
        const inkBitmap: boolean[] = getInkBitmap(context, tileWidth, tileHeight);

        inkBitmaps.push(inkBitmap);
      }
    }
    return { count, previews, inkBitmaps: inkBitmaps, columns: columnCount };
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
export async function extractSpritesFromFile(file: File, requests: Rect[][]): Promise<boolean[][][]> {
  return loadImage(file, (image) => {
    const result: boolean[][][] = requests.map((spriteRequests) =>
      spriteRequests.map((sprite) => {
        if (sprite.width <= 0 || sprite.height <= 0) return [];

        const { context } = drawRegionToCanvas(image, sprite);

        // Extract per-pixel bitmask (true = white/1, false = black/transparent/0)
        return getInkBitmap(context, sprite.width, sprite.height);
      })
    );
    return result;
  });
}

/**
 * Extracts a single rectangular region from a PNG File and returns it as a
 * base64 PNG data-URL, suitable for use as a sprite-frame thumbnail.
 *
 * Returns `""` when the source file is `undefined` or the dimensions are invalid
 * (zero or negative), so callers can render a placeholder instead.
 *
 * @param file   - The source PNG File (same image used for tile extraction).
 * @param region - The rectangular region to extract.
 */
export async function extractSpriteFramePreview(file: File | undefined, region: Rect): Promise<string> {
  if (!file || region.width <= 0 || region.height <= 0) return '';
  return loadImage(file, (image) => {
    const { canvas } = drawRegionToCanvas(image, region);
    return canvas.toDataURL('image/png');
  });
}

// ─── ZX-Paintbrush (.zxp) tile extraction ────────────────────────────────────

/**
 * ZX Spectrum colour palette — normal intensity.
 * Index corresponds to colour number (0 = black … 7 = white).
 */
const ZX_COLORS_NORMAL: readonly string[] = ['#000000', '#0000D7', '#D70000', '#D700D7', '#00D700', '#00D7D7', '#D7D700', '#D7D7D7'];

/**
 * ZX Spectrum colour palette — bright intensity.
 * Index corresponds to colour number (0 = black … 7 = white).
 */
const ZX_COLORS_BRIGHT: readonly string[] = ['#000000', '#0000FF', '#FF0000', '#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FFFFFF'];

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
export async function extractTilesFromZxpFile(file: File): Promise<ExtractTilesFromZxpFileResult> {
  const text = await file.text();
  const { pixels, attributes: parsedAttributes, tilesPerRow, tileRows } = parseZxpFile(text);

  const count = tilesPerRow * tileRows;
  const previews: string[] = [];
  const inkBitmaps: boolean[][] = [];
  const tileAttributes: ZxpColorAttribute[] = [];

  for (let tileRow = 0; tileRow < tileRows; tileRow++) {
    for (let tileColumn = 0; tileColumn < tilesPerRow; tileColumn++) {
      const tileIndex = tileRow * tilesPerRow + tileColumn;
      // Fall back to black ink on white paper if the attribute is missing.
      const attribute: ZxpColorAttribute = parsedAttributes[tileIndex] ?? {
        flash: false,
        bright: false,
        paper: 7,
        ink: 0,
      };

      const canvas = renderZxpTileToCanvas(pixels, tileColumn, tileRow, attribute);
      previews.push(canvas.toDataURL('image/png'));

      const baseRow = tileRow * 8;
      const baseColumn = tileColumn * 8;
      const inkBitmap: boolean[] = [];
      for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
        for (let pixelColumn = 0; pixelColumn < 8; pixelColumn++) {
          inkBitmap.push(pixels[baseRow + pixelRow]?.[baseColumn + pixelColumn] ?? false);
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
 * Converts a ZX-Paintbrush `.zxp` file into an in-memory PNG File by rendering
 * all tiles onto a single canvas using the ZX Spectrum colour palette.
 *
 * The resulting File can be used anywhere a standard browser-renderable image
 * File is expected (e.g. {@link extractSpriteFramePreview},
 * {@link extractSpritesFromFile}).
 *
 * @param file - The `.zxp` source file to convert.
 * @returns A synthetic PNG File sized `(tilesPerRow * 8) × (tileRows * 8)` pixels.
 * @throws If the file cannot be parsed or the canvas blob cannot be created.
 */
export async function convertZxpFileToImageFile(file: File): Promise<File> {
  const text = await file.text();
  const { pixels, attributes, tilesPerRow, tileRows } = parseZxpFile(text);

  if (tilesPerRow === 0 || tileRows === 0) {
    throw new Error('Invalid or empty .zxp file');
  }

  const canvas = renderZxpToCanvas(pixels, attributes, tilesPerRow, tileRows);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to convert .zxp file to PNG'));
        return;
      }
      const pngName = file.name.replace(/\.zxp$/i, '.png');
      resolve(new File([blob], pngName, { type: 'image/png' }));
    }, 'image/png');
  });
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
      pixels.push(Array.from(line, (character) => character === '1'));
    } else if (/^(?:[0-9A-Fa-f]{2}\s*)+$/.test(line)) {
      for (const hexByte of line.split(/\s+/).filter(Boolean)) {
        const byte = Number.parseInt(hexByte, 16);
        attributes.push({
          flash: (byte & 0x80) !== 0,
          bright: (byte & 0x40) !== 0,
          paper: (byte >> 3) & 0x07,
          ink: byte & 0x07,
        });
      }
    }
  }

  const pixelColumnCount = pixels.length > 0 ? pixels[0].length : 0;
  const tilesPerRow = Math.floor(pixelColumnCount / 8);
  const tileRows = Math.floor(pixels.length / 8);

  return { pixels, attributes, tilesPerRow, tileRows };
}

/**
 * Renders an 8×8 tile from a `.zxp` pixel grid onto a new offscreen canvas,
 * using the ZX Spectrum ink/paper colours from `attribute`.
 *
 * @param pixels     - Full pixel grid (row-major boolean array from {@link parseZxpFile}).
 * @param tileColumn - Tile column index (0-based).
 * @param tileRow    - Tile row index (0-based).
 * @param attribute  - Decoded ZX Spectrum colour attribute for this tile.
 * @returns A 8×8 offscreen canvas with the tile rendered in Spectrum colours.
 */
function renderZxpTileToCanvas(pixels: boolean[][], tileColumn: number, tileRow: number, attribute: ZxpColorAttribute): HTMLCanvasElement {
  const { canvas, context } = createCanvas(8, 8);

  const palette = attribute.bright ? ZX_COLORS_BRIGHT : ZX_COLORS_NORMAL;
  const inkColor = palette[attribute.ink];
  const paperColor = palette[attribute.paper];

  const baseRow = tileRow * 8;
  const baseColumn = tileColumn * 8;

  for (let pixelRow = 0; pixelRow < 8; pixelRow++) {
    for (let pixelColumn = 0; pixelColumn < 8; pixelColumn++) {
      const isInk = pixels[baseRow + pixelRow]?.[baseColumn + pixelColumn] ?? false;
      context.fillStyle = isInk ? inkColor : paperColor;
      context.fillRect(pixelColumn, pixelRow, 1, 1);
    }
  }

  return canvas;
}

/**
 * Renders all tiles from a parsed ZXP file onto a single master canvas.
 *
 * @param pixels      - Full pixel grid from {@link parseZxpFile}.
 * @param attributes  - Per-tile decoded colour attributes from {@link parseZxpFile}.
 * @param tilesPerRow - Number of tile columns.
 * @param tileRows    - Number of tile rows.
 * @returns Canvas sized `(tilesPerRow * 8) × (tileRows * 8)` with all tiles rendered.
 */
function renderZxpToCanvas(pixels: boolean[][], attributes: ZxpColorAttribute[], tilesPerRow: number, tileRows: number): HTMLCanvasElement {
  const { canvas, context } = createCanvas(tilesPerRow * 8, tileRows * 8);
  for (let tileRow = 0; tileRow < tileRows; tileRow++) {
    for (let tileColumn = 0; tileColumn < tilesPerRow; tileColumn++) {
      const tileIndex = tileRow * tilesPerRow + tileColumn;
      const attribute: ZxpColorAttribute = attributes[tileIndex] ?? {
        flash: false,
        bright: false,
        paper: 7,
        ink: 0,
      };
      const tileCanvas = renderZxpTileToCanvas(pixels, tileColumn, tileRow, attribute);
      context.drawImage(tileCanvas, tileColumn * 8, tileRow * 8);
    }
  }
  return canvas;
}

// ─── Tileset map preview ─────────────────────────────────────────────────────

/** Tile-grid dimensions needed by {@link renderTilesetMapPreviewFromTileData}. */
export interface TileMapRenderOptions {
  mapWidth: number;
  mapHeight: number;
  tileWidth: number;
  tileHeight: number;
  columns: number;
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
  attributeBytes: number[] = []
): void {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const { mapWidth, mapHeight, tileWidth, tileHeight } = options;

  canvas.width = mapWidth * tileWidth;
  canvas.height = mapHeight * tileHeight;
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const resolveTileColors = (attributeByte: number | undefined): { paperColor: string; inkColor: string } => {
    if (attributeByte === undefined) {
      return { paperColor: '#000000', inkColor: '#FFFFFF' };
    }

    const bright = (attributeByte & 0x40) !== 0;
    const paper = (attributeByte >> 3) & 0x07;
    const ink = attributeByte & 0x07;
    const palette = bright ? ZX_COLORS_BRIGHT : ZX_COLORS_NORMAL;
    return {
      paperColor: palette[paper] ?? '#000000',
      inkColor: palette[ink] ?? '#FFFFFF',
    };
  };

  const drawTileBitmap = (bitmap: boolean[], xOffset: number, yOffset: number, paperColor: string, inkColor: string) => {
    for (let pixelRow = 0; pixelRow < tileHeight; pixelRow++) {
      for (let pixelColumn = 0; pixelColumn < tileWidth; pixelColumn++) {
        const pixelIndex = pixelRow * tileWidth + pixelColumn;
        context.fillStyle = bitmap[pixelIndex] ? inkColor : paperColor;
        context.fillRect(xOffset + pixelColumn, yOffset + pixelRow, 1, 1);
      }
    }
  };

  for (let row = 0; row < mapHeight; row++) {
    for (let column = 0; column < mapWidth; column++) {
      const localIndex = tileIndices[row * mapWidth + column] ?? 0;
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

      const xOffset = column * tileWidth;
      const yOffset = row * tileHeight;

      drawTileBitmap(bitmap, xOffset, yOffset, paperColor, inkColor);
    }
  }
}

// ─── Image bytes → File ──────────────────────────────────────────────────────────

/**
 * Wraps image bytes (delivered over the VS Code bridge as a
 * base64-decoded Uint8Array) in a synthetic File with the given
 * basename. ZXP payloads are wrapped without an explicit mime type because
 * the ZXP decoders read the payload as UTF-8 text; PNG files carry image/png
 * so callers that branch on the file type can detect them.
 */
export function imageBytesToFile(bytes: Uint8Array, basename: string): File {
  if (getFileExtension(basename) === '.zxp') {
    return new File([bytes as BlobPart], basename);
  }
  return new File([bytes as BlobPart], basename, { type: 'image/png' });
}
