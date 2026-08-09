import { describe, expect, it } from "vitest";

import { parseAndValidateTiledJson } from "./tiledJsonValidation";

describe("parseAndValidateTiledJson", () => {
  it("parses valid JSON and normalizes metadata", () => {
    const parsed = parseAndValidateTiledJson(
      JSON.stringify({
        exporterVersion: "1.0.0",
        tileset: {
          image: "hud-tiles.png",
          tileWidth: 8,
          tileHeight: 8,
          tileCount: 64,
          columns: 16,
        },
        layers: [
          {
            name: "Layer 1",
            width: 4,
            height: 2,
            data: [1, 2, 3, 4, 5, 6, 7, 8],
          },
        ],
      }),
    );

    expect(parsed.metadata.mapWidth).toBe(4);
    expect(parsed.metadata.mapHeight).toBe(2);
    expect(parsed.metadata.tileWidth).toBe(8);
    expect(parsed.metadata.columns).toBe(16);
    expect(parsed.layer.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("rejects malformed JSON", () => {
    expect(() => parseAndValidateTiledJson("{ not-json }")).toThrow(
      "errorJsonInvalid",
    );
  });

  it("rejects missing required fields", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorJsonMissingField:tileCount");
  });

  it("rejects non-numeric layer data", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [
            {
              name: "Layer 1",
              width: 2,
              height: 2,
              data: [1, "2", 3, 4],
            },
          ],
        }),
      ),
    ).toThrow("errorLayerDataInvalid");
  });

  it("rejects wrong exporter version", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "0.9.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorExporterVersionMismatch");
  });

  it("rejects tileCount above 255", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 256,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorTileCountExceeds255:256");
  });

  it("rejects non-positive tileCount with the same key as a missing value", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 0,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorJsonMissingField:tileset.tileCount");
  });

  it("rejects empty layers array", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [],
        }),
      ),
    ).toThrow("errorNoLayers");
  });

  it("pads short layer data with zeros to match width*height", () => {
    const parsed = parseAndValidateTiledJson(
      JSON.stringify({
        exporterVersion: "1.0.0",
        tileset: {
          image: "hud-tiles.png",
          tileWidth: 8,
          tileHeight: 8,
          tileCount: 64,
          columns: 16,
        },
        layers: [
          {
            name: "Layer 1",
            width: 4,
            height: 2,
            data: [1, 2, 3],
          },
        ],
      }),
    );

    expect(parsed.layer.width).toBe(4);
    expect(parsed.layer.height).toBe(2);
    expect(parsed.metadata.mapWidth).toBe(4);
    expect(parsed.metadata.mapHeight).toBe(2);
    expect(parsed.layer.data).toEqual([1, 2, 3, 0, 0, 0, 0, 0]);
  });

  it("rejects layer data that exceeds width*height", () => {
    // 4x2 → 8 cells, but data has 12 entries. A length mismatch in the
    // "too long" direction is treated as malformed input and surfaces
    // `errorLayerDataLengthMismatch:expected:actual` rather than silently
    // truncating — callers get a loud failure instead of a quiet data loss.
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [
            {
              name: "Layer 1",
              width: 4,
              height: 2,
              data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            },
          ],
        }),
      ),
    ).toThrow("errorLayerDataLengthMismatch:8:12");
  });

  it("rejects empty tileset image path", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorJsonMissingField:image");
  });

  it("rejects non-numeric tileset tileWidth", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: "8",
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 1, height: 1, data: [1] }],
        }),
      ),
    ).toThrow("errorJsonMissingField:tileWidth");
  });

  it("rejects non-positive layer dimensions", () => {
    expect(() =>
      parseAndValidateTiledJson(
        JSON.stringify({
          exporterVersion: "1.0.0",
          tileset: {
            image: "hud-tiles.png",
            tileWidth: 8,
            tileHeight: 8,
            tileCount: 64,
            columns: 16,
          },
          layers: [{ name: "Layer 1", width: 0, height: 2, data: [] }],
        }),
      ),
    ).toThrow("errorJsonInvalidDimensions");
  });
});
