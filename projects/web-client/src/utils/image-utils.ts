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
