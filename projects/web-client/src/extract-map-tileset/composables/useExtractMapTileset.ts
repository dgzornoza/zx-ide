import { computed, onMounted, ref, watch } from "vue";
import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "../../../../shared/extract-graphics/extract-graphics-dtos";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadFilesAsZip } from "../../utils/html-utils";
import { renderTilesetMapPreview } from "../../utils/image-utils";
import type { TmxMapMetadata } from "../models/mapTilesetDefinition";
import { createMapCodeGenerator } from "./codeGenerators/mapTilesetCodeGenerators";

function normalizeGids(rawGids: number[], firstGid: number): number[] {
  const normalised: number[] = [];

  for (const gid of rawGids) {
    const safeGid = gid ?? 0;
    const localIndex = safeGid === 0 ? 0 : safeGid - firstGid + 1;

    if (localIndex < 0 || localIndex > 255) {
      throw new Error("errorGidOutOfRange");
    }

    normalised.push(localIndex);
  }

  return normalised;
}

export function useExtractMapTileset() {
  // ─── State ───────────────────────────────────────────────────────────────────

  const xmlSource = ref("");
  const imageSource = ref("");
  const metadata = ref<TmxMapMetadata | null>(null);
  const tileIndices = ref<number[]>([]);
  const errors = ref<string[]>([]);
  const warnings = ref<string[]>([]);
  const codeGenerationType = ref<CodeGenerationType>("asm");
  const isCodeGenerationTypeReadOnly = ref(false);
  const tilesetImageBitmap = ref<ImageBitmap | null>(null);
  const statusMessage = ref("");

  const isReady = computed(
    () =>
      errors.value.length === 0 &&
      metadata.value !== null &&
      tileIndices.value.length > 0 &&
      xmlSource.value !== "",
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

  // ─── XML File Loading ─────────────────────────────────────────────────────────

  async function setXmlFile(
    file: File,
    companions: File[] = [],
  ): Promise<void> {
    errors.value = [];
    warnings.value = [];
    metadata.value = null;
    tileIndices.value = [];
    imageSource.value = "";
    tilesetImageBitmap.value = null;
    xmlSource.value = file.name;

    try {
      const content = await file.text();
      const parsedMetadata = parseTmxDocument(content);
      metadata.value = parsedMetadata;

      const rawIndices = parseCsvLayer(content, parsedMetadata);
      tileIndices.value = normalizeGids(rawIndices, parsedMetadata.firstGid);

      // Auto-load the PNG if it was selected alongside the TMX
      const imageFileName = parsedMetadata.sourceImage.split("/").at(-1) ?? "";
      if (imageFileName) {
        const match = companions.find((f) => f.name === imageFileName);
        if (match) {
          await setImageFile(match);
        }
      }
    } catch (error) {
      errors.value = [String(error)];
    }
  }

  function parseTmxDocument(xmlContent: string): TmxMapMetadata {
    const parser = new DOMParser();
    const document_ = parser.parseFromString(xmlContent, "text/xml");

    const parseError = document_.querySelector("parsererror");
    if (parseError) {
      throw new Error("errorXmlInvalid");
    }

    const mapElement = document_.querySelector("map");
    if (!mapElement) {
      throw new Error("errorXmlInvalid");
    }

    const tilesetElement = document_.querySelector("tileset");
    if (!tilesetElement) {
      throw new Error("errorXmlInvalid");
    }

    const imageElement = tilesetElement.querySelector("image");

    const mapWidth = Number.parseInt(
      mapElement.getAttribute("width") ?? "0",
      10,
    );
    const mapHeight = Number.parseInt(
      mapElement.getAttribute("height") ?? "0",
      10,
    );
    const tileWidth = Number.parseInt(
      mapElement.getAttribute("tilewidth") ?? "0",
      10,
    );
    const tileHeight = Number.parseInt(
      mapElement.getAttribute("tileheight") ?? "0",
      10,
    );
    const firstGid = Number.parseInt(
      tilesetElement.getAttribute("firstgid") ?? "1",
      10,
    );
    const tileCount = Number.parseInt(
      tilesetElement.getAttribute("tilecount") ?? "0",
      10,
    );
    const columns = Number.parseInt(
      tilesetElement.getAttribute("columns") ?? "0",
      10,
    );
    const tilesetName = tilesetElement.getAttribute("name") ?? "";
    const sourceImage = imageElement?.getAttribute("source") ?? "";

    if (tileCount > 255) {
      throw new Error(`errorTileCountExceeds255:${tileCount}`);
    }
    if (tileCount <= 0) {
      throw new Error("errorXmlInvalid");
    }

    return {
      mapWidth,
      mapHeight,
      tileWidth,
      tileHeight,
      tilesetName,
      firstGid,
      tileCount,
      columns,
      sourceImage,
    };
  }

  function parseCsvLayer(
    xmlContent: string,
    mapMetadata: TmxMapMetadata,
  ): number[] {
    const parser = new DOMParser();
    const document_ = parser.parseFromString(xmlContent, "text/xml");

    const layers = Array.from(document_.querySelectorAll("layer"));
    const csvLayer = layers.find(
      (layer) => layer.querySelector("data[encoding='csv']") !== null,
    );

    if (!csvLayer) {
      throw new Error("errorNoLayerCsv");
    }

    const dataElement = csvLayer.querySelector("data");
    const csvContent = dataElement?.textContent ?? "";

    const rawGids = csvContent
      .trim()
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token !== "")
      .map((token) => Number.parseInt(token, 10))
      .filter((value) => !Number.isNaN(value));

    const expectedCount = mapMetadata.mapWidth * mapMetadata.mapHeight;
    if (rawGids.length !== expectedCount) {
      // Accept the data anyway — truncate or pad silently
      rawGids.length = expectedCount;
    }

    return rawGids;
  }

  // ─── PNG File Loading ─────────────────────────────────────────────────────────

  async function setImageFile(file: File): Promise<void> {
    warnings.value = [];
    imageSource.value = file.name;

    const bitmap = await createImageBitmap(file);
    tilesetImageBitmap.value = bitmap;

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
      tilesetImageBitmap.value,
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
    xmlSource,
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
    setXmlFile,
    renderPreview,
    extractResources,
  };
}
