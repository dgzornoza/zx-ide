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
  const normalisedData = [...layer.data];
  if (normalisedData.length !== expectedEntries) {
    normalisedData.length = expectedEntries;
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
