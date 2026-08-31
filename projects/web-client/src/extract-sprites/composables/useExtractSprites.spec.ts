// ─── Unit tests for useExtractSprites ───────────────────────────────────────
//
// Pins the `setSourceImage(path, bytes)` contract: state.source is the basename
// of the path, currentImageFile is a File with that basename, extractSpritesFromFile
// is called exactly once, and the ZXP branch delegates to convertZxpFileToImageFile.
// State (sprites, spriteFlags) is left untouched across image switches.

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import {
  convertZxpFileToImageFile,
  extractSpritesFromFile,
} from "../../helpers/image-utils";

vi.mock("../../helpers/image-utils", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../helpers/image-utils")>();
  return {
    ...actual,
    extractSpritesFromFile: vi.fn(),
    convertZxpFileToImageFile: vi.fn(),
  };
});

import { i18n } from "src/i18n";
import { useExtractSprites } from "./useExtractSprites";

const mockedExtractSpritesFromFile = vi.mocked(extractSpritesFromFile);
const mockedConvertZxpFileToImageFile = vi.mocked(convertZxpFileToImageFile);

interface SpritesApi {
  state: { source: string; sprites: unknown[] };
  currentImageFile: { value: File | undefined };
  setSourceImage(path: string, bytes: Uint8Array): Promise<void>;
}

function setupHarness() {
  let api!: SpritesApi;
  const Host = defineComponent({
    setup() {
      api = useExtractSprites() as unknown as SpritesApi;
      return () => h("div");
    },
  });
  const wrapper = mount(Host, { global: { plugins: [i18n] } });
  return {
    wrapper,
    get api() {
      return api;
    },
  };
}

import { mount } from "@vue/test-utils";

describe("useExtractSprites", () => {
  beforeEach(() => {
    mockedExtractSpritesFromFile.mockReset();
    mockedConvertZxpFileToImageFile.mockReset();
    mockedExtractSpritesFromFile.mockResolvedValue([]);
  });

  it("setSourceImage (PNG path) sets state.source to the basename, currentImageFile to a PNG File, and calls extractSpritesFromFile once", async () => {
    const { api } = setupHarness();
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    await api.setSourceImage("characters/player.png", pngBytes);

    expect(api.state.source).toBe("characters/player.png");
    const file = api.currentImageFile.value;
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe("player.png");
    expect(file?.type).toBe("image/png");
    expect(mockedExtractSpritesFromFile).toHaveBeenCalledTimes(1);
  });

  it("setSourceImage (ZXP path) wraps bytes in a File and delegates to convertZxpFileToImageFile", async () => {
    const { api } = setupHarness();
    const zxpBytes = new Uint8Array([0x01, 0x02, 0x03]);
    const convertedFile = new File([new Uint8Array([0xff])], "tileset.png", {
      type: "image/png",
    });
    mockedConvertZxpFileToImageFile.mockResolvedValue(convertedFile);

    await api.setSourceImage("characters/tileset.zxp", zxpBytes);

    expect(mockedConvertZxpFileToImageFile).toHaveBeenCalledTimes(1);
    const zxpFileArg = mockedConvertZxpFileToImageFile.mock.calls[0][0];
    expect(zxpFileArg).toBeInstanceOf(File);
    expect(zxpFileArg.name).toBe("tileset.zxp");

    expect(api.currentImageFile.value).toBe(convertedFile);
    expect(api.state.source).toBe("characters/tileset.zxp");
  });

  it("setSourceImage preserves state.sprites and state.source when switching images", async () => {
    const { api } = setupHarness();
    const before = JSON.parse(JSON.stringify(api.state.sprites));

    await api.setSourceImage("first.png", new Uint8Array([0x01]));
    const afterFirst = JSON.parse(JSON.stringify(api.state.sprites));

    api.state.sprites.push({
      _id: "fake",
      name: "hero",
      width: 8,
      height: 8,
      frames: [{ x: 0, y: 0 }],
    });
    const beforeSwitch = JSON.parse(JSON.stringify(api.state.sprites));

    await api.setSourceImage("second.png", new Uint8Array([0x02]));

    expect(api.state.sprites).toEqual(beforeSwitch);
    expect(api.state.source).toBe("second.png");
    expect(before).toEqual(afterFirst);
  });
});
