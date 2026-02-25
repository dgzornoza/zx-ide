export interface ExtractTilesFromFileModel {
  file: File;
  tileWidth: number;
  tileHeight: number;
}

export interface ExtractTilesFromFileResult {
  count: number;
  previews: string[];
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
        }
      }

      URL.revokeObjectURL(url);
      resolve({ count, previews });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load Image file"));
    };

    img.src = url;
  });
}
