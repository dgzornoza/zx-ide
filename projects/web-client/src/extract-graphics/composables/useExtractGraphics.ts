import {
  StatusMessage,
  StatusMessageType,
} from "src/extract-graphics/models/graphicsMapData";
import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import {
  TilesDefinitionModel,
  TilesModel,
} from "src/extract-graphics/models/tilesDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-helpers";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { SaveMapMessage } from "../../../../shared/extract-graphics/extract-graphics-dtos";
import { createVsCodeBridge } from "../../bridge/vscode";
import { extractTilesFromFile } from "../../utils/image-utils";

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
    } as TilesModel,
    sprites: [] as SpriteDefinition[],
  });

  /** The last PNG File chosen by the user, kept to allow re-extraction on dimension change. */
  const pendingFile = ref<File | null>(null);

  const status = ref<StatusMessage | null>(null);
  const selectedType = ref<"tiles" | "sprites" | "">("");

  /**
   * Keeps the tile names array in sync with tile count.
   * Adds empty entries when count grows, splices extras when count shrinks.
   */
  const syncTileNames = (count: number) => {
    // avoid negative and non-integer counts, which would break the logic
    const normalized = Math.max(0, Math.floor(count));

    if (normalized === state.tiles.names.length) return;
    if (normalized > state.tiles.names.length) {
      const startIndex = state.tiles.names.length;
      state.tiles.names.push(
        ...Array.from(
          { length: normalized - startIndex },
          (_, i) => `tile${startIndex + i + 1}`,
        ),
      );
      return;
    }

    state.tiles.names.splice(normalized);
  };

  // ─── Tile extraction ───────────────────────────────────────────────────────

  /**
   * Loads a PNG File, slices it into tiles of (tileWidth × tileHeight) pixels,
   * generates a base64 data-URL preview for each tile, and updates the state.
   */
  const extractTiles = async (file: File): Promise<void> => {
    try {
      const { count, previews } = await extractTilesFromFile({
        file,
        tileWidth: state.tiles.tileWidth,
        tileHeight: state.tiles.tileHeight,
      });

      state.tiles.count = count;
      state.tiles.previews = previews;
      syncTileNames(count);
    } catch (error) {
      setStatus("error", tp("errorTileExtractionFailed"));
    }
  };

  /**
   * Stores the selected PNG file and triggers tile extraction when the current
   * selectedType is "tiles". Otherwise it waits until the user picks that type.
   */
  const setSourceFile = async (file: File) => {
    pendingFile.value = file;
    if (selectedType.value === "tiles") {
      await extractTiles(file);
    }
  };

  // Re-extract when tileWidth/tileHeight change
  watch(
    [() => state.tiles.tileWidth, () => state.tiles.tileHeight],
    async () => {
      if (pendingFile.value && selectedType.value === "tiles") {
        await extractTiles(pendingFile.value);
      }
    },
  );

  // Re-extract when switching to tiles type
  watch(selectedType, async (val) => {
    if (val === "tiles" && pendingFile.value) {
      await extractTiles(pendingFile.value);
    }
  });

  // ─── Sprite actions ────────────────────────────────────────────────────────

  /** Returns a new sprite definition initialised with default values and one empty frame. */
  const createSprite = (): SpriteDefinition => ({
    _id: crypto.randomUUID(),
    name: "",
    width: 1,
    height: 1,
    frames: [{ column: 0, row: 0 }],
  });

  /** Appends a new default sprite to the sprites list. */
  const addSprite = () => state.sprites.push(createSprite());

  /** Removes the sprite at the given index from the sprites list. */
  const removeSprite = (index: number) => state.sprites.splice(index, 1);

  /** Appends a new default frame to the sprite at the given index. */
  const addSpriteFrame = (spriteIndex: number) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.push({ column: 0, row: 0 });
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
  const extractResources = () => {
    if (!pendingFile.value) {
      setStatus("error", tp("errorNoSourceFile"));
      return;
    }

    const mapFile: TilesDefinitionModel = {
      tileWidth: state.tiles.tileWidth,
      tileHeight: state.tiles.tileHeight,
      names: [...state.tiles.names],
    };

    const json = JSON.stringify(mapFile, null, 2);
    const baseName = pendingFile.value.name.replace(/\.[^.]+$/, "");
    const fileName = `${baseName}.map`;

    if (vscode.isAvailable) {
      const message: SaveMapMessage = {
        messageType: "saveMap",
        fileName,
        content: json,
      };
      vscode.postMessage(message);
    } else {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("success", tp("statusMapDownloaded"));
    }
  };

  // ─── Load map ──────────────────────────────────────────────────────────────

  /**
   * Parses a .map file and restores tile configuration from it.
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

      if (pendingFile.value) {
        await extractTiles(pendingFile.value);
      }
    } catch {
      setStatus("error", tp("errorMapLoadFailed"));
    }
  };
  // const createMap = () => {
  //   status.value = null;
  //   if (!selectedType.value) return;

  //   try {
  //     const source = normalizeRelativePath(state.source);
  //     const graphicsData = normalizeRelativePath(state.graphicsData);

  //     const mapData: GraphicsMapData = buildGraphicsMapData(
  //       source,
  //       graphicsData,
  //       selectedType.value,
  //       state.tiles,
  //       state.sprites,
  //       tp,
  //     );

  //     const mapRelativePath = buildMapRelativePath(source);

  //     const payload: WriteFilesMessage = {
  //       messageType: "writeFiles",
  //       codeFiles: [
  //         {
  //           path: mapRelativePath,
  //           content: JSON.stringify(mapData, null, 2),
  //         },
  //         // Future: generated source files for tiles/sprites will be appended here.
  //       ],
  //     };

  //     vscode.postMessage(payload);

  //     if (!vscode.isAvailable) {
  //       setStatus(true, tp("statusSent"));
  //     }
  //   } catch (error) {
  //     setStatus(false, error instanceof Error ? error.message : String(error));
  //   }
  // };

  // ─── Message bus ──────────────────────────────────────────────────────────

  /**
   * Handles messages received from the VS Code extension host.
   * Only processes messages of type "status" to update the status banner.
   */
  // const handleMessage = (event: MessageEvent) => {
  //   const message = event.data as
  //     | { type?: string; ok?: boolean; text?: string }
  //     | undefined;
  //   if (!message || message.type !== "status") return;
  //   setStatus(Boolean(message.ok), String(message.text ?? ""));
  // };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onMounted(() => {
    //window.addEventListener("message", handleMessage);
    if (!state.sprites.length) addSprite();
  });

  onBeforeUnmount(() => {
    //window.removeEventListener("message", handleMessage);
  });

  return {
    state,
    status,
    selectedType,
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
