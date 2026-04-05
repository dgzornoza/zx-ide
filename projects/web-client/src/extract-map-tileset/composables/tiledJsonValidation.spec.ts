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
});
