// ─── Unit tests for useExtractTiles ─────────────────────────────────────────
//
// Mirrors the useExtractSprites contract for tiles: setSourceImage(path, bytes)
// runs the tile extraction, leaves tile definitions intact across image
// switches, and delegates the ZXP path to the existing extractTilesFromZxpFile
// helper. The SDD spec wording ("convertZxpFileToImageFile") was a transcription
// slip — tiles has never gone through that helper; it consumes ZXP via
// extractTilesFromZxpFile which decodes the ZX-Paintbrush payload directly.

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import {
  extractTilesFromPng,
  extractTilesFromZxpFile,
  generateTileSheetPng,
} from "../../helpers/image-utils";

vi.mock("../../helpers/image-utils", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../helpers/image-utils")>();
  return {
    ...actual,
    extractTilesFromPng: vi.fn(),
    extractTilesFromZxpFile: vi.fn(),
    generateTileSheetPng: vi.fn(),
  };
});

import { mount } from "@vue/test-utils";
import { i18n } from "src/i18n";
import { useExtractTiles } from "./useExtractTiles";

const mockedExtractTilesFromPng = vi.mocked(extractTilesFromPng);
const mockedExtractTilesFromZxpFile = vi.mocked(extractTilesFromZxpFile);
const mockedGenerateTileSheetPng = vi.mocked(generateTileSheetPng);

interface TilesApi {
  state: {
    source: string;
    tiles: {
      count: number;
      tileWidth: number;
      tileHeight: number;
      excludedSet: Set<number>;
    };
  };
  currentImageFile: { value: File | undefined };
  setSourceImage(path: string, bytes: Uint8Array): Promise<void>;
}

function setupHarness() {
  let api!: TilesApi;
  const Host = defineComponent({
    setup() {
      api = useExtractTiles() as unknown as TilesApi;
      return () => h("div");
    },
  });
  mount(Host, { global: { plugins: [i18n] } });
  return {
    get api() {
      return api;
    },
  };
}

describe("useExtractTiles", () => {
  beforeEach(() => {
    mockedExtractTilesFromPng.mockReset();
    mockedExtractTilesFromZxpFile.mockReset();
    mockedGenerateTileSheetPng.mockReset();
    mockedExtractTilesFromPng.mockResolvedValue({
      count: 16,
      columns: 4,
      previews: [],
      inkBitmaps: [],
    });
  });

  it("setSourceImage (PNG path) sets state.source to the basename, currentImageFile to a PNG File, and runs extractTilesFromPng", async () => {
    const { api } = setupHarness();
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    await api.setSourceImage("characters/sheet.png", pngBytes);

    expect(api.state.source).toBe("characters/sheet.png");
    const file = api.currentImageFile.value;
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe("sheet.png");
    expect(file?.type).toBe("image/png");
    expect(mockedExtractTilesFromPng).toHaveBeenCalledTimes(1);
    expect(mockedExtractTilesFromZxpFile).not.toHaveBeenCalled();
  });

  it("setSourceImage (ZXP path) delegates to extractTilesFromZxpFile with a File whose name is the basename", async () => {
    const { api } = setupHarness();
    const zxpBytes = new Uint8Array([0x01, 0x02, 0x03]);
    mockedExtractTilesFromZxpFile.mockResolvedValue({
      count: 0,
      columns: 0,
      previews: [],
      inkBitmaps: [],
      attributes: [],
    });

    await api.setSourceImage("characters/tileset.zxp", zxpBytes);

    expect(mockedExtractTilesFromZxpFile).toHaveBeenCalledTimes(1);
    const fileArg = mockedExtractTilesFromZxpFile.mock.calls[0][0];
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toBe("tileset.zxp");

    expect(api.state.source).toBe("characters/tileset.zxp");
    expect(mockedExtractTilesFromPng).not.toHaveBeenCalled();
  });

  it("setSourceImage preserves user-defined tile dimensions across image switches", async () => {
    const { api } = setupHarness();

    await api.setSourceImage("first.png", new Uint8Array([0x01]));

    // Mutate tile dimensions to non-default values, as if the user picked them
    // in the UI. setSourceImage must not clobber them when the next image is
    // loaded (the extraction re-runs but the user's choices win).
    api.state.tiles.tileWidth = 16;
    api.state.tiles.tileHeight = 24;
    api.state.tiles.excludedSet = new Set([1, 4]);

    await api.setSourceImage("second.png", new Uint8Array([0x02]));

    expect(api.state.tiles.tileWidth).toBe(16);
    expect(api.state.tiles.tileHeight).toBe(24);
    expect(api.state.tiles.excludedSet.has(1)).toBe(true);
    expect(api.state.tiles.excludedSet.has(4)).toBe(true);
    expect(api.state.source).toBe("second.png");
  });
});
