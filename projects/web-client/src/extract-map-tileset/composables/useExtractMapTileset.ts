import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import { createMapCodeGenerator } from "src/extract-map-tileset/composables/codeGenerators/codeGeneratorFactory";
import { computed, onMounted, ref, watch } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadFilesAsZip } from "../../helpers/html-utils";
import { renderTilesetMapPreview } from "../../helpers/image-utils";
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
  const imageSource = ref("");
  const metadata = ref<MapTilesetMetadata>();
  const tileIndices = ref<number[]>([]);
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  const tilesetImageBitmap = ref<ImageBitmap>();
  const statusMessage = ref("");

  const isReady = computed(
    () =>
      errors.value.length === 0 &&
      metadata.value !== undefined &&
      tileIndices.value.length > 0 &&
      mapSource.value !== "",
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

  // ─── JSON Map File Loading ────────────────────────────────────────────────────

  async function setMapFile(
    file: File,
    companions: File[] = [],
  ): Promise<void> {
    errors.value = [];
    warnings.value = [];
    metadata.value = undefined;
    tileIndices.value = [];
    imageSource.value = "";
    tilesetImageBitmap.value = undefined;
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

      // Auto-load the PNG if it was selected alongside the JSON map file.
      const imageFileName =
        parsedMap.metadata.sourceImage.split("/").at(-1) ?? "";
      if (imageFileName) {
        const match = companions.find((f) => f.name === imageFileName);
        if (match) {
          await setImageFile(match);
        }
      }
    } catch (error) {
      errors.value = [toUserErrorKey(error)];
    }
  }

  // ─── PNG File Loading ─────────────────────────────────────────────────────────

  async function setImageFile(file: File): Promise<void> {
    warnings.value = [];

    const bitmap = await createImageBitmap(file);
    tilesetImageBitmap.value = bitmap;
    imageSource.value = file.name;

    if (metadata.value) {
      const expectedWidth = metadata.value.columns * metadata.value.tileWidth;
      if (bitmap.width !== expectedWidth) {
        warnings.value = [
          `warningDimensionsMismatch:${bitmap.width}:${expectedWidth}`,
        ];
      }
    }
  }

  // ─── Canvas Rendering ─────────────────────────────────────────────────────────

  function renderPreview(canvas: HTMLCanvasElement): void {
    if (!metadata.value) {
      return;
    }
    renderTilesetMapPreview(
      canvas,
      tileIndices.value,
      metadata.value,
      tilesetImageBitmap.value ?? null,
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

  watch([tileIndices, tilesetImageBitmap], () => {
    // Canvas re-render is triggered by the component via renderPreview()
  });

  return {
    mapSource,
    imageSource,
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
    statusMessage,
    setMapFile,
    renderPreview,
    extractResources,
  };
}
