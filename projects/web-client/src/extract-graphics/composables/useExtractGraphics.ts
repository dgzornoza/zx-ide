import {
  StatusMessage,
  StatusMessageType,
} from "src/extract-graphics/models/graphicsMapData";
import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import { TileDefinition } from "src/extract-graphics/models/tilesDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-helpers";
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { WriteFilesMessage } from "../../../../shared/extract-graphics/extract-graphics-dtos";
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
    graphicsData: "",
    tiles: {
      count: 0,
      tileWidth: 8,
      tileHeight: 8,
      names: [] as string[],
      previews: [] as string[],
    } as TileDefinition,
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
   * Validates the form data, serialises the graphics map, and posts a
   * {@link WriteFilesMessage} to the VS Code extension with all files to write.
   * Validation errors are shown in the status banner without leaving the form.
   * Falls back to a simulated success status when the extension API is unavailable.
   */
  const createMap = () => {};
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
    addSprite,
    removeSprite,
    addSpriteFrame,
    removeSpriteFrame,
    createMap,
  };
}
