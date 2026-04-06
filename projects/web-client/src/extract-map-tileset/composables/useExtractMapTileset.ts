import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import { parseAsmTilesetData } from "src/extract-map-tileset/composables/asmTilesetParser";
import { createMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorFactory";
import { computed, onMounted, ref, watch } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadFilesAsZip } from "../../helpers/html-utils";
import { renderTilesetMapPreviewFromTileData } from "../../helpers/image-utils";
import type { MapTilesetMetadata } from "../models/mapTilesetDefinition";
import { parseAndValidateTiledJson } from "./tiledJsonValidation";

function normalizeGids(rawGids: number[]): number[] {
  const normalised: number[] = [];

  for (const gid of rawGids) {
    const safeGid = gid ?? 0;
    const localIndex = safeGid;

    if (localIndex < 0 || localIndex > 255) {
      throw new Error("errorGidOutOfRange");
    }

    normalised.push(localIndex);
  }

  return normalised;
}

function toUserErrorKey(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  return "errorJsonInvalid";
}

export function useExtractMapTileset() {
  // ─── State ───────────────────────────────────────────────────────────────────

  const mapSource = ref("");
  const asmSource = ref("");
  const metadata = ref<MapTilesetMetadata>();
  const tileIndices = ref<number[]>([]);
  const asmRawContent = ref("");
  const tileInkBitmaps = ref<boolean[][]>([]);
  const tileAttributeBytes = ref<number[]>([]);
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  const statusMessage = ref("");
  /**
   * Forces the map preview canvas to rerender when incremented.
   * Used as a reactive trigger when loading JSON or ASM files,
   */
  const previewRefreshKey = ref(0);

  const isReady = computed(
    () =>
      errors.value.length === 0 &&
      metadata.value !== undefined &&
      tileIndices.value.length > 0 &&
      mapSource.value !== "" &&
      asmSource.value !== "" &&
      tileInkBitmaps.value.length > 0,
  );

  const usedTileCount = computed(() => {
    return new Set(tileIndices.value.filter((index) => index !== 0)).size;
  });

  const mapByteSize = computed(() => tileIndices.value.length);

  /** Bytes occupied by the used tiles (ZX Spectrum: ceil(tileWidth/8) × tileHeight per tile). */
  const usedTilesByteSize = computed(() => {
    if (!metadata.value) return 0;
    const { tileWidth, tileHeight } = metadata.value;
    return usedTileCount.value * Math.ceil(tileWidth / 8) * tileHeight;
  });

  const totalByteSize = computed(
    () => usedTilesByteSize.value + mapByteSize.value,
  );

  // ─── Bridge ──────────────────────────────────────────────────────────────────

  const bridge = createVsCodeBridge();

  onMounted(() => {
    window.addEventListener("message", handleInitMessage);
  });

  function handleInitMessage(event: MessageEvent): void {
    const message = event.data as InitMessage;
    if (message?.messageType !== "init") {
      return;
    }
    if (message.projectType === "sjasmplus") {
      codeGenerationType.value = "asm";
      isCodeGenerationTypeReadOnly.value = true;
    } else if (message.projectType === "z88dk") {
      codeGenerationType.value = "c";
      isCodeGenerationTypeReadOnly.value = true;
    }
  }

  function validateMapVsTileset(tileCount: number): void {
    const maxMapIndex = Math.max(0, ...tileIndices.value);
    if (maxMapIndex > tileCount) {
      throw new Error(`errorAsmTileCountMismatch:${maxMapIndex}:${tileCount}`);
    }
  }

  function tryDecodeAsmData(): void {
    if (!metadata.value || asmRawContent.value.trim() === "") {
      return;
    }

    const parsed = parseAsmTilesetData(
      asmRawContent.value,
      metadata.value.tileWidth,
      metadata.value.tileHeight,
    );

    validateMapVsTileset(parsed.tileCount);
    tileInkBitmaps.value = parsed.tileInkBitmaps;
    tileAttributeBytes.value = parsed.attributeBytes;
    previewRefreshKey.value += 1;
  }

  // ─── JSON Map File Loading ────────────────────────────────────────────────────

  async function setMapFile(file: File): Promise<void> {
    errors.value = [];
    warnings.value = [];
    metadata.value = undefined;
    tileIndices.value = [];
    tileInkBitmaps.value = [];
    tileAttributeBytes.value = [];
    previewRefreshKey.value += 1;
    mapSource.value = file.name;

    try {
      if (/\.(tmx|xml)$/i.test(file.name)) {
        throw new Error("errorJsonRequired");
      }
      if (!/\.json$/i.test(file.name)) {
        throw new Error("errorJsonUnsupportedFormat");
      }

      const content = await file.text();
      const parsedMap = parseAndValidateTiledJson(content);
      metadata.value = parsedMap.metadata;

      tileIndices.value = normalizeGids(parsedMap.layer.data);

      tryDecodeAsmData();
    } catch (error) {
      errors.value = [toUserErrorKey(error)];
    }
  }

  // ─── ASM File Loading ─────────────────────────────────────────────────────────

  async function setAsmFile(file: File): Promise<void> {
    errors.value = [];
    warnings.value = [];
    tileInkBitmaps.value = [];
    tileAttributeBytes.value = [];
    previewRefreshKey.value += 1;
    asmSource.value = file.name;

    try {
      if (!/\.asm$/i.test(file.name)) {
        throw new Error("errorAsmUnsupportedFormat");
      }

      asmRawContent.value = await file.text();
      tryDecodeAsmData();
    } catch (error) {
      errors.value = [toUserErrorKey(error)];
    }
  }

  // ─── Canvas Rendering ─────────────────────────────────────────────────────────

  function renderPreview(canvas: HTMLCanvasElement): void {
    if (!metadata.value) {
      return;
    }
    renderTilesetMapPreviewFromTileData(
      canvas,
      tileIndices.value,
      metadata.value,
      tileInkBitmaps.value,
      tileAttributeBytes.value,
    );
  }

  // ─── Extraction ───────────────────────────────────────────────────────────────

  async function extractResources(baseName: string): Promise<void> {
    if (!isReady.value || !metadata.value) {
      return;
    }

    const generator = createMapCodeGenerator(codeGenerationType.value);
    const files = generator.generate({
      name: baseName,
      metadata: metadata.value,
      tileIndices: tileIndices.value,
    });

    if (bridge.isAvailable) {
      const writeMessage: WriteFilesMessage = {
        messageType: "writeFiles",
        codeFiles: files,
      };
      bridge.postMessage(writeMessage);
      statusMessage.value = "statusSent";
    } else {
      await downloadFilesAsZip(files, baseName);
      statusMessage.value = "statusSent";
    }
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────────

  watch([tileIndices, tileInkBitmaps], () => {
    // Canvas re-render is triggered by the component via renderPreview()
  });

  return {
    mapSource,
    asmSource,
    metadata,
    tileIndices,
    errors,
    warnings,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    isReady,
    usedTileCount,
    usedTilesByteSize,
    mapByteSize,
    totalByteSize,
    previewRefreshKey,
    statusMessage,
    setMapFile,
    setAsmFile,
    renderPreview,
    extractResources,
  };
}
