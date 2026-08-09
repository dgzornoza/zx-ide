/**
 * Validates and parses Tiled JSON map exports for ZX-IDE tilemap tools.
 *
 * This module reads a JSON string exported from the Tiled map editor (with a custom exporter),
 * validates its structure and version, and extracts the tileset and layer data into a normalized,
 * UI-friendly format. It ensures all required fields are present, checks for valid dimensions,
 * and normalizes the tile data array to match the expected map size.
 */
import type {
  MapTilesetMetadata,
  TiledJsonLayer,
  TiledJsonMapSource,
  TiledJsonTileset,
} from "../models/mapTilesetDefinition";

export interface ParsedTiledJsonMap {
  metadata: MapTilesetMetadata;
  layer: TiledJsonLayer;
}

/**
 * Returns true if the value is a non-null object (record).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  errorKey: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${errorKey}:${key}`);
  }
  return value;
}

function readString(
  record: Record<string, unknown>,
  key: string,
  errorKey: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${errorKey}:${key}`);
  }
  return value;
}

function parseTileset(value: unknown): TiledJsonTileset {
  if (!isRecord(value)) {
    throw new Error("errorJsonMissingField:tileset");
  }

  const tileCount = readNumber(value, "tileCount", "errorJsonMissingField");
  if (tileCount <= 0) {
    throw new Error("errorJsonMissingField:tileset.tileCount");
  }
  if (tileCount > 255) {
    throw new Error(`errorTileCountExceeds255:${tileCount}`);
  }

  return {
    image: readString(value, "image", "errorJsonMissingField"),
    tileWidth: readNumber(value, "tileWidth", "errorJsonMissingField"),
    tileHeight: readNumber(value, "tileHeight", "errorJsonMissingField"),
    tileCount,
    columns: readNumber(value, "columns", "errorJsonMissingField"),
  };
}

function parseLayer(value: unknown, index: number): TiledJsonLayer {
  if (!isRecord(value)) {
    throw new Error(`errorJsonMissingField:layers[${index}]`);
  }

  const data = value.data;
  if (!Array.isArray(data) || !data.every((item) => typeof item === "number")) {
    throw new Error("errorLayerDataInvalid");
  }

  return {
    name: readString(value, "name", "errorJsonMissingField"),
    width: readNumber(value, "width", "errorJsonMissingField"),
    height: readNumber(value, "height", "errorJsonMissingField"),
    data,
  };
}

/**
 * Parses and validates a Tiled JSON map export string.
 *
 * - Checks exporter version compatibility.
 * - Validates and normalizes tileset and layer data.
 * - Ensures the layer data array matches map dimensions, padding with 0 if
 *   short and throwing `errorLayerDataLengthMismatch` if it exceeds the
 *   expected size. A length mismatch in the "too long" direction is treated
 *   as malformed input rather than silently truncated, so callers get a
 *   loud failure instead of a quiet data loss.
 *
 * Throws localized error keys if validation fails.
 */
export function parseAndValidateTiledJson(content: string): ParsedTiledJsonMap {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(content);
  } catch {
    throw new Error("errorJsonInvalid");
  }

  if (!isRecord(parsedValue)) {
    throw new Error("errorJsonInvalid");
  }

  // Validate exporter version
  const EXPECTED_EXPORTER_VERSION = "1.0.0";
  if (parsedValue.exporterVersion !== EXPECTED_EXPORTER_VERSION) {
    throw new Error("errorExporterVersionMismatch");
  }

  const tileset = parseTileset(parsedValue.tileset);
  const layersValue = parsedValue.layers;
  if (!Array.isArray(layersValue) || layersValue.length === 0) {
    throw new Error("errorNoLayers");
  }

  const layer = parseLayer(layersValue[0], 0);
  if (layer.width <= 0 || layer.height <= 0) {
    throw new Error("errorJsonInvalidDimensions");
  }

  const expectedEntries = layer.width * layer.height;
  if (layer.data.length > expectedEntries) {
    throw new Error(
      `errorLayerDataLengthMismatch:${expectedEntries}:${layer.data.length}`,
    );
  }
  const normalisedData = [...layer.data];
  if (normalisedData.length < expectedEntries) {
    // Pad with 0 to reach the expected size; also replace any NaN entries
    // (parseLayer already ensures every entry is a number, so this only
    // catches NaN, not non-numeric values).
    while (normalisedData.length < expectedEntries) {
      normalisedData.push(0);
    }
    for (let index = 0; index < normalisedData.length; index++) {
      const currentValue = normalisedData[index];
      if (typeof currentValue !== "number" || Number.isNaN(currentValue)) {
        normalisedData[index] = 0;
      }
    }
  }

  const source: TiledJsonMapSource = {
    tileset,
    layers: [{ ...layer, data: normalisedData }],
  };

  const metadata: MapTilesetMetadata = {
    mapWidth: source.layers[0].width,
    mapHeight: source.layers[0].height,
    tileWidth: source.tileset.tileWidth,
    tileHeight: source.tileset.tileHeight,
    tilesetName:
      source.tileset.image
        .split("/")
        .at(-1)
        ?.replace(/\.[^.]+$/, "") ?? "tileset",
    tileCount: source.tileset.tileCount,
    columns: source.tileset.columns,
    sourceImage: source.tileset.image,
  };

  return {
    metadata,
    layer: source.layers[0],
  };
}
