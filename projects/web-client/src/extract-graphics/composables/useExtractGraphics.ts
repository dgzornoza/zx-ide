import JSZip from "jszip";
import {
  StatusMessage,
  StatusMessageType,
} from "src/extract-graphics/models/graphicsMapData";
import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import {
  TilesDefinitionModel,
  TilesModel,
} from "src/extract-graphics/models/tilesDefinition";
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
import { extractTilesFromFile } from "../../utils/image-utils";
import { createCodeGenerator } from "./codeGenerators";

/**
 * Composable that manages the full state and business logic for the
 * extract-graphics form.
 */
export function useExtractGraphics() {
  const vscode = createVsCodeBridge();

  /** Namespaced translation helper for the extract-graphics scope. */
  const tp = createTranslationPrefixFn("extract-graphics");

  const state = reactive({
    source: "",
    mapSource: "",
    graphicsData: "",
    tiles: {
      count: 0,
      tileWidth: 8,
      tileHeight: 8,
      names: [] as string[],
      previews: [] as string[],
      bitmasks: [] as boolean[][],
    } as TilesModel,
    sprites: [] as SpriteDefinition[],
  });

  /** The last PNG File chosen by the user, kept to allow re-extraction on dimension change. */
  const currentImageFile = ref<File | null>(null);

  const status = ref<StatusMessage | null>(null);
  const selectedType = ref<"tiles" | "sprites" | "">("");
  const codeGenerationType = ref<CodeGenerationType>("asm");
  const isCodeGenerationTypeReadOnly = ref(false);

  /**
   * Keeps the tile names array in sync with tile count.
   * Adds empty entries when count grows, splices extras when count shrinks.
   */
  const syncTileNames = (count: number) => {
    // avoid negative and non-integer counts, which would break the logic
    const normalized = Math.max(0, Math.floor(count));

    // less (remove slots), greater (add slots), equals (do nothing)
    if (normalized < state.tiles.names.length) {
      state.tiles.names.splice(normalized);
    } else if (normalized > state.tiles.names.length) {
      const startIndex = state.tiles.names.length;
      state.tiles.names.push(
        ...Array.from(
          { length: normalized - startIndex },
          (_, i) => `tile${startIndex + i + 1}`,
        ),
      );
    }
  };

  // ─── Load map ──────────────────────────────────────────────────────────────

  /**
   * Parses a .map file and restores tile/sprites configuration from it.
   * Also re-extracts tile previews if a source image is already loaded.
   */
  const setMapFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const mapData = JSON.parse(text) as TilesDefinitionModel;

      state.tiles.tileWidth = mapData.tileWidth ?? state.tiles.tileWidth;
      state.tiles.tileHeight = mapData.tileHeight ?? state.tiles.tileHeight;
      state.tiles.names = Array.isArray(mapData.names)
        ? [...mapData.names]
        : [];

      if (!selectedType.value) {
        selectedType.value = "tiles";
      }

      if (currentImageFile.value) {
        await extractTiles(currentImageFile.value);
      }
    } catch {
      setStatus("error", tp("errorMapLoadFailed"));
    }
  };

  // ─── Tile extraction ───────────────────────────────────────────────────────

  /**
   * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
   * generates a base64 data-URL preview for each tile, and updates the state.
   */
  const extractTiles = async (file: File): Promise<void> => {
    try {
      const { count, previews, bitmasks } = await extractTilesFromFile({
        file,
        tileWidth: state.tiles.tileWidth,
        tileHeight: state.tiles.tileHeight,
      });

      state.tiles.count = count;
      state.tiles.previews = previews;
      state.tiles.bitmasks = bitmasks;
      syncTileNames(count);
    } catch (error) {
      console.error("Tile extraction failed:", error);
      setStatus("error", tp("errorTileExtractionFailed"));
    }
  };

  /**
   * Stores the selected PNG file and triggers tile extraction when the current
   * selectedType is "tiles". Otherwise it waits until the user picks that type.
   */
  const setSourceFile = async (file: File) => {
    currentImageFile.value = file;
    if (selectedType.value === "tiles") {
      await extractTiles(file);
    }
  };

  // Re-extract when tileWidth/tileHeight change
  watch(
    [() => state.tiles.tileWidth, () => state.tiles.tileHeight],
    async () => {
      if (currentImageFile.value && selectedType.value === "tiles") {
        await extractTiles(currentImageFile.value);
      }
    },
  );

  // Re-extract when switching to tiles type
  watch(selectedType, async (val) => {
    if (val === "tiles" && currentImageFile.value) {
      await extractTiles(currentImageFile.value);
    }
  });

  // ─── Sprite actions ────────────────────────────────────────────────────────

  /** Returns a new sprite definition initialised with default values and one empty frame. */
  const createSprite = (): SpriteDefinition => ({
    _id: crypto.randomUUID(),
    name: "",
    width: 8,
    height: 8,
    frames: [{ x: 0, y: 0 }],
  });

  /** Appends a new default sprite to the sprites list. */
  const addSprite = () => state.sprites.push(createSprite());

  /** Removes the sprite at the given index from the sprites list. */
  const removeSprite = (index: number) => state.sprites.splice(index, 1);

  /** Appends a new default frame to the sprite at the given index. */
  const addSpriteFrame = (spriteIndex: number) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.push({ x: 0, y: 0 });
  };

  /** Removes the frame at frameIndex from the sprite at spriteIndex. */
  const removeSpriteFrame = (spriteIndex: number, frameIndex: number) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.splice(frameIndex, 1);
  };

  // ─── Status ────────────────────────────────────────────────────────────────

  /** Updates the status banner with a success or error message. */
  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  // ─── Create map ────────────────────────────────────────────────────────────

  /**
   * Builds a {@link TilesDefinitionModel} from the current tiles state and either:
   * - sends it to the VS Code extension via {@link SaveMapMessage}, or
   * - triggers a browser download when the extension API is unavailable.
   */
  const extractResources = async () => {
    if (!currentImageFile.value) {
      setStatus("error", tp("errorNoSourceFile"));
      return;
    }

    const mapFile: TilesDefinitionModel = {
      tileWidth: state.tiles.tileWidth,
      tileHeight: state.tiles.tileHeight,
      names: [...state.tiles.names],
    };

    const baseName = currentImageFile.value.name.replace(/\.[^.]+$/, "");
    const tileNames = state.tiles.names.slice(0, state.tiles.count);

    const mapContent = JSON.stringify(mapFile, null, 2);

    const generator = createCodeGenerator(codeGenerationType.value);
    const generatedFiles = generator.generate({
      baseName,
      tileNames,
      tileWidth: state.tiles.tileWidth,
      tileHeight: state.tiles.tileHeight,
      bitmasks: state.tiles.bitmasks,
    });

    const codeFiles: FileEntry[] = [
      { path: `${baseName}.map`, content: mapContent },
      ...generatedFiles.map((file) => ({
        path: `${baseName}${file.extension}`,
        content: file.content,
      })),
    ];

    if (vscode.isAvailable) {
      const message: WriteFilesMessage = {
        messageType: "writeFiles",
        codeFiles,
      };
      vscode.postMessage(message);
    } else {
      // Browser fallback: download all files bundled in a single ZIP
      const zip = new JSZip();
      for (const file of codeFiles) {
        zip.file(file.path, file.content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${baseName}.zip`);

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
    if (!state.sprites.length) addSprite();
    window.addEventListener("message", onWindowMessage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", onWindowMessage);
  });

  return {
    state,
    status,
    selectedType,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    currentImageFile,
    tp,
    setSourceFile,
    setMapFile,
    addSprite,
    removeSprite,
    addSpriteFrame,
    removeSpriteFrame,
    extractResources: extractResources,
  };
}
