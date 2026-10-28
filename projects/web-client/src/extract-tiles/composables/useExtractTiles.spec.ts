// ─── Unit tests for useExtractTiles ─────────────────────────────────────────
//
// Mirrors the useExtractSprites contract for tiles: setSourceImage(path, bytes)
// runs the tile extraction, leaves tile definitions intact across image
// switches, and delegates the ZXP path to the existing extractTilesFromZxpFile
// helper. The SDD spec wording ("convertZxpFileToImageFile") was a transcription
// slip — tiles has never gone through that helper; it consumes ZXP via
// extractTilesFromZxpFile which decodes the ZX-Paintbrush payload directly.
//
// extractResources posts a WriteFilesMessage to the VS Code bridge with every
// fileName prefixed by the source's directory (e.g. `hud/`) so the extension
// can route resources to `assets/<dir>/` and code files to `src/data/<dir>/`.

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { createVsCodeBridge } from '../../bridge/vscode';
import { extractTilesFromPng, extractTilesFromZxpFile } from '../../helpers/image-utils';

vi.mock('../../helpers/image-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../helpers/image-utils')>();
  return {
    ...actual,
    extractTilesFromPng: vi.fn(),
    extractTilesFromZxpFile: vi.fn(),
  };
});

vi.mock('../../bridge/vscode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../bridge/vscode')>();
  return {
    ...actual,
    createVsCodeBridge: vi.fn(),
  };
});

import { mount } from '@vue/test-utils';
import type { WriteFilesResultMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { i18n } from 'src/i18n';
import { useExtractTiles } from './useExtractTiles';

const mockedExtractTilesFromPng = vi.mocked(extractTilesFromPng);
const mockedExtractTilesFromZxpFile = vi.mocked(extractTilesFromZxpFile);
const mockedCreateVsCodeBridge = vi.mocked(createVsCodeBridge);

interface TilesApi {
  state: {
    source: string;
    tiles: {
      count: number;
      tileWidth: number;
      tileHeight: number;
      excludedSet: Set<number>;
      attributes?: unknown[];
    };
  };
  currentImageFile: { value: File | undefined };
  setSourceImage(path: string, bytes: Uint8Array): Promise<void>;
  extractResources(): Promise<void>;
  status: { value: { type: string; text: string } | null };
  memoryUsage: {
    tileCount: number;
    bitmapBytes: number;
    attributeBytes: number;
  };
}

function setupHarness() {
  let api!: TilesApi;
  const Host = defineComponent({
    setup() {
      api = useExtractTiles() as unknown as TilesApi;
      return () => h('div');
    },
  });
  mount(Host, { global: { plugins: [i18n] } });
  return {
    get api() {
      return api;
    },
  };
}

interface PostedWriteFilesMessage {
  messageType: string;
  codeFiles: { fileType: string; fileName: string; content: string }[];
}

function postWriteFilesResult(data: WriteFilesResultMessage) {
  window.dispatchEvent(new MessageEvent('message', { data }));
}

function installBridgeMock() {
  const posted: PostedWriteFilesMessage[] = [];
  const bridge = {
    isAvailable: true,
    postMessage: vi.fn((message: PostedWriteFilesMessage) => {
      posted.push(message);
    }),
  };
  mockedCreateVsCodeBridge.mockReturnValue(bridge as unknown as ReturnType<typeof createVsCodeBridge>);
  return { posted, bridge };
}

describe('useExtractTiles', () => {
  beforeEach(() => {
    mockedExtractTilesFromPng.mockReset();
    mockedExtractTilesFromZxpFile.mockReset();
    mockedCreateVsCodeBridge.mockReset();
    mockedExtractTilesFromPng.mockResolvedValue({
      count: 16,
      columns: 4,
      previews: [],
      inkBitmaps: [],
    });
    // ZXP is delegated to a dedicated helper; provide a benign default so
    // tests that exercise ZXP paths don't need to mock it explicitly.
    mockedExtractTilesFromZxpFile.mockResolvedValue({
      count: 0,
      columns: 0,
      previews: [],
      inkBitmaps: [],
      attributes: [],
    });
  });

  it('setSourceImage (PNG path) sets state.source to the basename, currentImageFile to a PNG File, and runs extractTilesFromPng', async () => {
    const { api } = setupHarness();
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    await api.setSourceImage('characters/sheet.png', pngBytes);

    expect(api.state.source).toBe('characters/sheet.png');
    const file = api.currentImageFile.value;
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe('sheet.png');
    expect(file?.type).toBe('image/png');
    expect(mockedExtractTilesFromPng).toHaveBeenCalledTimes(1);
    expect(mockedExtractTilesFromZxpFile).not.toHaveBeenCalled();
  });

  it('setSourceImage (ZXP path) delegates to extractTilesFromZxpFile with a File whose name is the basename', async () => {
    const { api } = setupHarness();
    const zxpBytes = new Uint8Array([0x01, 0x02, 0x03]);

    await api.setSourceImage('characters/tileset.zxp', zxpBytes);

    expect(mockedExtractTilesFromZxpFile).toHaveBeenCalledTimes(1);
    const fileArg = mockedExtractTilesFromZxpFile.mock.calls[0][0];
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toBe('tileset.zxp');

    expect(api.state.source).toBe('characters/tileset.zxp');
    expect(mockedExtractTilesFromPng).not.toHaveBeenCalled();
  });

  it('setSourceImage preserves user-defined tile dimensions across image switches', async () => {
    const { api } = setupHarness();

    await api.setSourceImage('first.png', new Uint8Array([0x01]));

    // Mutate tile dimensions to non-default values, as if the user picked them
    // in the UI. setSourceImage must not clobber them when the next image is
    // loaded (the extraction re-runs but the user's choices win).
    api.state.tiles.tileWidth = 16;
    api.state.tiles.tileHeight = 24;
    api.state.tiles.excludedSet = new Set([1, 4]);

    await api.setSourceImage('second.png', new Uint8Array([0x02]));

    expect(api.state.tiles.tileWidth).toBe(16);
    expect(api.state.tiles.tileHeight).toBe(24);
    expect(api.state.tiles.excludedSet.has(1)).toBe(true);
    expect(api.state.tiles.excludedSet.has(4)).toBe(true);
    expect(api.state.source).toBe('second.png');
  });

  it('extractResources emits only .cfg, .h, .asm, .bin and prefixes every fileName with the source directory', async () => {
    // Install the bridge mock BEFORE mounting so useExtractTiles picks up
    // the stubbed createVsCodeBridge factory on its first call.
    const { posted, bridge } = installBridgeMock();
    const { api } = setupHarness();

    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    await api.extractResources();

    expect(bridge.postMessage).toHaveBeenCalledTimes(1);
    expect(posted).toHaveLength(1);
    const fileNames = posted[0].codeFiles.map((file) => file.fileName);
    const fileTypes = posted[0].codeFiles.map((file) => file.fileType);

    // Code files (c-header, asm, binary) and the resource (map → .cfg) must
    // all carry the `hud/` prefix. No tile-sheet preview is emitted anymore.
    expect(fileNames).toEqual(['hud/hud-tiles.cfg', 'hud/hud-tiles.h', 'hud/hud-tiles.asm', 'hud/hud-tiles.bin']);
    expect(fileTypes).toEqual(['map', 'c-header', 'asm', 'binary']);
  });

  it('extractResources shows no status until the extension reports the write result', async () => {
    installBridgeMock();
    const { api } = setupHarness();

    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    await api.extractResources();

    expect(api.status.value).toBeNull();
  });

  it('extractResources shows success when the extension reports the files were written', async () => {
    installBridgeMock();
    const { api } = setupHarness();
    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    await api.extractResources();

    postWriteFilesResult({ messageType: 'writeFilesResultFromExtension', success: true });

    // Vitest does not resolve i18n messages (it returns the key), so only the type is pinned.
    expect(api.status.value?.type).toBe('success');
  });

  it('extractResources shows the error when the extension reports the write failed', async () => {
    installBridgeMock();
    const { api } = setupHarness();
    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    await api.extractResources();

    postWriteFilesResult({ messageType: 'writeFilesResultFromExtension', success: false, error: 'EACCES: permission denied' });

    expect(api.status.value).toEqual({ type: 'error', text: 'EACCES: permission denied' });
  });

  it('extractResources emits unprefixed fileNames when the source has no directory', async () => {
    const { posted, bridge } = installBridgeMock();
    const { api } = setupHarness();

    await api.setSourceImage('hud-tiles.zxp', new Uint8Array([0x01]));
    await api.extractResources();

    expect(bridge.postMessage).toHaveBeenCalledTimes(1);
    const fileNames = posted[0].codeFiles.map((file) => file.fileName);
    expect(fileNames).toEqual(['hud-tiles.cfg', 'hud-tiles.h', 'hud-tiles.asm', 'hud-tiles.bin']);
  });

  it('memoryUsage reports only bitmap bytes when no attributes are present', async () => {
    const { api } = setupHarness();

    await api.setSourceImage('hud/hud-tiles.png', new Uint8Array([0x01]));
    // 4 tiles @ 8x8 → 4 tiles × 8 bytes = 32 bitmap bytes; no attributes.
    api.state.tiles.count = 4;
    api.state.tiles.tileWidth = 8;
    api.state.tiles.tileHeight = 8;
    api.state.tiles.excludedSet = new Set();
    api.state.tiles.attributes = undefined;

    expect(api.memoryUsage.value).toEqual({
      tileCount: 4,
      bitmapBytes: 32,
      attributeBytes: 0,
    });
  });

  it('memoryUsage includes one attribute byte per included tile when attributes are decoded', async () => {
    const { api } = setupHarness();

    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    // 5 tiles @ 8x8 with attributes → 40 bitmap bytes + 5 attribute bytes.
    api.state.tiles.count = 5;
    api.state.tiles.tileWidth = 8;
    api.state.tiles.tileHeight = 8;
    api.state.tiles.excludedSet = new Set();
    api.state.tiles.attributes = [{}, {}, {}, {}, {}];

    expect(api.memoryUsage.value).toEqual({
      tileCount: 5,
      bitmapBytes: 40,
      attributeBytes: 5,
    });
  });

  it('memoryUsage subtracts excluded tiles from both bitmap and attribute counts', async () => {
    const { api } = setupHarness();

    await api.setSourceImage('hud/hud-tiles.zxp', new Uint8Array([0x01]));
    // 6 tiles total, 2 excluded → 4 included tiles × 8 bytes bitmap + 4 attr.
    api.state.tiles.count = 6;
    api.state.tiles.tileWidth = 8;
    api.state.tiles.tileHeight = 8;
    api.state.tiles.excludedSet = new Set([1, 4]);
    api.state.tiles.attributes = [{}, {}, {}, {}, {}, {}];

    expect(api.memoryUsage.value).toEqual({
      tileCount: 4,
      bitmapBytes: 32,
      attributeBytes: 4,
    });
  });
});
