export interface ParsedAsmTileset {
  tileInkBitmaps: boolean[][];
  attributeBytes: number[];
  tileCount: number;
}

function parseDefbBytes(line: string): number[] {
  const noCommentLine = line.split(";")[0] ?? "";
  const defbRegex = /\bdefb\b(.*)$/i;
  const match = defbRegex.exec(noCommentLine);
  if (!match) {
    return [];
  }

  const payload = match[1] ?? "";
  const tokens = payload
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const bytes: number[] = [];
  for (const token of tokens) {
    if (/^\$[0-9a-f]{1,2}$/i.test(token)) {
      bytes.push(Number.parseInt(token.slice(1), 16));
      continue;
    }

    if (/^\d+$/.test(token)) {
      bytes.push(Number.parseInt(token, 10));
      continue;
    }

    throw new Error("errorAsmInvalidToken");
  }

  return bytes;
}

function decodeTileBitmap(
  tileBytes: number[],
  tileWidth: number,
  tileHeight: number,
): boolean[] {
  const bytesPerRow = Math.ceil(tileWidth / 8);
  const bitmap: boolean[] = [];

  for (let row = 0; row < tileHeight; row++) {
    for (let column = 0; column < tileWidth; column++) {
      const byteInRow = Math.floor(column / 8);
      const bitIndex = column % 8;
      const byte = tileBytes[row * bytesPerRow + byteInRow] ?? 0;
      const isInk = ((byte >> (7 - bitIndex)) & 1) === 1;
      bitmap.push(isInk);
    }
  }

  return bitmap;
}

export function parseAsmTilesetData(
  content: string,
  tileWidth: number,
  tileHeight: number,
): ParsedAsmTileset {
  const bytesPerTile = Math.ceil(tileWidth / 8) * tileHeight;
  if (bytesPerTile <= 0) {
    throw new Error("errorAsmInvalidTileDimensions");
  }

  const tileBytes: number[] = [];
  const attributeBytes: number[] = [];
  let inAttributesSection = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (/_tiles_attributes\b/i.test(line)) {
      inAttributesSection = true;
    }

    const parsedBytes = parseDefbBytes(line);
    if (parsedBytes.length === 0) {
      continue;
    }

    if (inAttributesSection) {
      attributeBytes.push(...parsedBytes);
    } else {
      tileBytes.push(...parsedBytes);
    }
  }

  if (tileBytes.length === 0) {
    throw new Error("errorAsmMissingTileData");
  }

  if (tileBytes.length % bytesPerTile !== 0) {
    throw new Error("errorAsmInvalidByteCount");
  }

  const tileCount = tileBytes.length / bytesPerTile;
  const tileInkBitmaps: boolean[][] = [];

  for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
    const start = tileIndex * bytesPerTile;
    const end = start + bytesPerTile;
    const tileData = tileBytes.slice(start, end);
    tileInkBitmaps.push(decodeTileBitmap(tileData, tileWidth, tileHeight));
  }

  return {
    tileInkBitmaps,
    attributeBytes,
    tileCount,
  };
}
