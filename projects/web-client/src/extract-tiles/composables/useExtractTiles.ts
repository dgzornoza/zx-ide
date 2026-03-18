import JSZip from "jszip";
import { createTilesCodeGenerator } from "src/extract-tiles/composables/codeGenerators/tilesCodeGenerators";
import { TilesModel } from "src/extract-tiles/models/tilesDefinition";
import {
  StatusMessage,
  StatusMessageType,
} from "src/shared/models/statusMessage";
import { createTranslationPrefixFn } from "src/utils/vue-utils";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import {
  CodeGenerationType,
  FileEntry,
  InitMessage,
  WriteFilesMessage,
} from "../../../../shared/extract-graphics/extract-graphics-dtos";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadBlob } from "../../utils/html-utils";
import {
  extractTilesFromPng,
  extractTilesFromZxpFile,
} from "../../utils/image-utils";

/**
 * Composable that manages the full state and business logic for the
 * extract-tiles page.
 */
export function useExtractTiles() {
  const vscode = createVsCodeBridge();

  /** Namespaced translation helper for the extract-tiles scope. */
  const tp = createTranslationPrefixFn("extract-tiles");

  const state = reactive({
    source: "",
    mapSource: "",
    tiles: {
      type: "tiles" as const,
      count: 0,
      tileWidth: 8,
      tileHeight: 8,
      names: [] as string[],
      excluded: [] as number[],
      excludedSet: new Set<number>(),
      previews: [] as string[],
      inkBitmaps: [] as boolean[][],
    } as TilesModel,
  });

  /** The last PNG/ZXP File chosen by the user, kept to allow re-extraction on dimension change. */
  const currentImageFile = ref<File | null>(null);

  const status = ref<StatusMessage | null>(null);
  const codeGenerationType = ref<CodeGenerationType>("asm");
  const isCodeGenerationTypeReadOnly = ref(false);

  /**
   * Keeps the tile names array in sync with tile count.
   * Adds empty entries when count grows, splices extras when count shrinks.
   * Also removes out-of-range indices from the excluded set.
   */
  const syncTileArrays = (count: number) => {
    const normalized = Math.max(0, Math.floor(count));

    if (normalized < state.tiles.names.length) {
      state.tiles.names.splice(normalized);
    } else if (normalized > state.tiles.names.length) {
      const startIndex = state.tiles.names.length;
      state.tiles.names.push(
        ...Array.from(
          { length: normalized - startIndex },
          (_, tileIndex) => `tile${startIndex + tileIndex + 1}`,
        ),
      );
    }

    // Remove excluded indices that are now out of range
    for (const excludedIndex of state.tiles.excludedSet) {
      if (excludedIndex >= normalized) {
        state.tiles.excludedSet.delete(excludedIndex);
      }
    }
    state.tiles.excluded = [...state.tiles.excludedSet];
  };

  // ─── Load map ──────────────────────────────────────────────────────────────

  /**
   * Parses a `.tiles.map` file and restores tile configuration from it.
   * Files without a `type` field are treated as tiles (backward-compatibility).
   * Also re-extracts tile previews if a source image is already loaded.
   */
  const setMapFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const mapData = JSON.parse(text);

      if (mapData.type === "sprites") {
        setStatus("error", tp("errorMapLoadFailed"));
        return;
      }

      // Tiles (explicit type: "tiles" or legacy files without type field)
      state.tiles.tileWidth = mapData.tileWidth ?? state.tiles.tileWidth;
      state.tiles.tileHeight = mapData.tileHeight ?? state.tiles.tileHeight;
      state.tiles.names = Array.isArray(mapData.names)
        ? [...mapData.names]
        : [];

      const loadedExcluded: number[] = Array.isArray(mapData.excluded)
        ? mapData.excluded
        : [];
      state.tiles.excluded = [...loadedExcluded];
      state.tiles.excludedSet = new Set(loadedExcluded);

      if (currentImageFile.value) {
        await extractTiles(currentImageFile.value);
      }
    } catch {
      setStatus("error", tp("errorMapLoadFailed"));
    }
  };

  // ─── Tile extraction ───────────────────────────────────────────────────────

  /**
   * Extracts tiles from `file` and updates the state.
   *
   * - `.zxp` files (ZX-Paintbrush): uses {@link extractTilesFromZxpFile}.
   *   Tile size is fixed at 8×8 and colour attributes are stored.
   * - All other files (PNG): uses {@link extractTilesFromPng} with the
   *   current `tileWidth`/`tileHeight` from state.
   */
  const extractTiles = async (file: File): Promise<void> => {
    try {
      if (file.name.toLowerCase().endsWith(".zxp")) {
        const {
          count,
          previews,
          inkBitmaps: bitmasks,
          attributes,
        } = await extractTilesFromZxpFile(file);
        state.tiles.tileWidth = 8;
        state.tiles.tileHeight = 8;
        state.tiles.count = count;
        state.tiles.previews = previews;
        state.tiles.inkBitmaps = bitmasks;
        state.tiles.attributes = attributes;
        syncTileArrays(count);
      } else {
        const {
          count,
          previews,
          inkBitmaps: bitmasks,
        } = await extractTilesFromPng({
          file,
          tileWidth: state.tiles.tileWidth,
          tileHeight: state.tiles.tileHeight,
        });
        state.tiles.count = count;
        state.tiles.previews = previews;
        state.tiles.inkBitmaps = bitmasks;
        state.tiles.attributes = undefined;
        syncTileArrays(count);
      }
    } catch (error) {
      console.error("Tile extraction failed:", error);
      setStatus("error", tp("errorTileExtractionFailed"));
    }
  };

  /**
   * Stores the selected file and triggers tile extraction immediately.
   */
  const setSourceFile = async (file: File) => {
    currentImageFile.value = file;
    await extractTiles(file);
  };

  // Re-extract when tileWidth/tileHeight change
  watch(
    [() => state.tiles.tileWidth, () => state.tiles.tileHeight],
    async () => {
      if (currentImageFile.value) {
        await extractTiles(currentImageFile.value);
      }
    },
  );

  // ─── Status ────────────────────────────────────────────────────────────────

  /** Updates the status banner with a success or error message. */
  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  // ─── Tile exclusion ────────────────────────────────────────────────────────

  /**
   * Toggles the excluded state of the tile at `tileIndex`.
   * Excluded tiles are omitted from generated `.h` and `.asm` output.
   */
  const toggleTileExclusion = (tileIndex: number) => {
    if (state.tiles.excludedSet.has(tileIndex)) {
      state.tiles.excludedSet.delete(tileIndex);
    } else {
      state.tiles.excludedSet.add(tileIndex);
    }
    state.tiles.excluded = [...state.tiles.excludedSet];
  };

  // ─── Create map ────────────────────────────────────────────────────────────

  /**
   * Generates all resource files for the current tiles.
   * Output is either sent to VS Code via {@link WriteFilesMessage}
   * or downloaded as a ZIP bundle in standalone browser mode.
   */
  const extractResources = async () => {
    if (!currentImageFile.value) {
      setStatus("error", tp("errorNoSourceFile"));
      return;
    }

    const fileNameWithoutExtension = currentImageFile.value.name.replace(
      /\.[^.]+$/,
      "",
    );

    const generator = createTilesCodeGenerator(codeGenerationType.value);
    const codeFiles: FileEntry[] = generator.generate({
      name: fileNameWithoutExtension,
      tiles: state.tiles,
    });

    if (vscode.isAvailable) {
      const message: WriteFilesMessage = {
        messageType: "writeFiles",
        codeFiles,
      };
      vscode.postMessage(message);
    } else {
      const zip = new JSZip();
      for (const file of codeFiles) {
        zip.file(file.fileName, file.content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${fileNameWithoutExtension}.zip`);

      setStatus("success", tp("statusMapDownloaded"));
    }
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  const onWindowMessage = (event: MessageEvent) => {
    const message = event.data as InitMessage;
    if (message?.messageType !== "init") return;

    if (message.projectType === "sjasmplus") {
      codeGenerationType.value = "asm";
      isCodeGenerationTypeReadOnly.value = true;
    } else if (message.projectType === "z88dk") {
      codeGenerationType.value = "c";
      isCodeGenerationTypeReadOnly.value = true;
    }
  };

  onMounted(() => {
    window.addEventListener("message", onWindowMessage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", onWindowMessage);
  });

  return {
    state,
    status,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    tp,
    setSourceFile,
    setMapFile,
    extractResources,
    toggleTileExclusion,
  };
}
