import {
  FileEntry,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { createSpritesCodeGenerator } from "src/shared/composables/spritesCodeGenerators/codeGeneratorFactory";
import { useProjectTypeLock } from "src/shared/composables/useProjectTypeLock";
import {
  SpriteDefinition,
  SpriteFlags,
  SpritesMapModel,
} from "src/shared/models/spriteDefinition";
import {
  StatusMessage,
  StatusMessageType,
} from "src/shared/models/statusMessage";
import { onMounted, reactive, ref } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import {
  convertZxpFileToImageFile,
  extractSpritesFromFile,
} from "../../helpers/image-utils";

/**
 * Composable that manages the full state and business logic for the
 * extract-sprites page.
 */
export function useExtractSprites() {
  const vscode = createVsCodeBridge();

  /** Namespaced translation helper for the extract-sprites scope. */
  const tp = createTranslationPrefixFn("extract-sprites");

  const state = reactive({
    source: "",
    mapSource: "",
    sprites: [] as SpriteDefinition[],
  });

  /** The last source File chosen by the user (PNG or converted-from-ZXP PNG), kept for sprite frame preview extraction. */
  const currentImageFile = ref<File | null>(null);

  const status = ref<StatusMessage | null>(null);
  const {
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
  } = useProjectTypeLock();
  const spriteFlags = ref<number>(SpriteFlags.None);

  // ─── Load map ──────────────────────────────────────────────────────────────

  /**
   * Parses a `.cfg` file and restores sprite configuration from it.
   */
  const setMapFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const mapData = JSON.parse(text) as SpritesMapModel;

      if (mapData.type !== "sprites") {
        setStatus("error", tp("errorMapLoadFailed"));
        return;
      }

      // Restore sprites — inject fresh runtime _id for each
      state.sprites.splice(
        0,
        state.sprites.length,
        ...mapData.sprites.map((sprite) => ({
          ...sprite,
          _id: crypto.randomUUID(),
        }))
      );
      spriteFlags.value = mapData.spriteFlags ?? SpriteFlags.None;
    } catch {
      setStatus("error", tp("errorMapLoadFailed"));
    }
  };

  // ─── Source file ───────────────────────────────────────────────────────────

  /**
   * Stores the selected source file for use in sprite frame previews.
   * `.zxp` files are converted to an in-memory PNG before storing so that
   * the rest of the pipeline (previews, bitmask extraction) works unchanged.
   */
  const setSourceFile = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith(".zxp")) {
        currentImageFile.value = await convertZxpFileToImageFile(file);
      } else {
        currentImageFile.value = file;
      }
    } catch (error) {
      console.error("Source file load failed:", error);
      setStatus("error", tp("errorSourceFileLoad"));
    }
  };

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
   * Generates all resource files for the current sprites and posts them to
   * the VS Code extension via {@link WriteFilesMessage}.
   */
  const extractResources = async () => {
    if (!currentImageFile.value) {
      setStatus("error", tp("errorNoSourceFile"));
      return;
    }

    const fileNameWithoutExtension = currentImageFile.value.name.replace(
      /\.[^.]+$/,
      ""
    );

    const generator = createSpritesCodeGenerator(codeGenerationType.value);
    const spriteBitmasks = await extractSpritesFromFile(
      currentImageFile.value,
      state.sprites.map((sprite) =>
        sprite.frames.map((frame) => ({
          x: frame.x,
          y: frame.y,
          width: sprite.width,
          height: sprite.height,
        }))
      )
    );
    const codeFiles: FileEntry[] = generator.generate({
      name: fileNameWithoutExtension,
      sprites: state.sprites,
      spriteFlags: spriteFlags.value,
      spriteBitmasks,
      compressed: useZx0Compression.value,
    });

    if (!vscode.isAvailable) {
      setStatus("error", tp("errorVsCodeRequired"));
      return;
    }

    const message: WriteFilesMessage = {
      messageType: "writeFiles",
      codeFiles,
    };
    vscode.postMessage(message);
    setStatus("success", tp("statusSent"));
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onMounted(() => {
    if (!state.sprites.length) addSprite();
  });

  return {
    state,
    status,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
    spriteFlags,
    currentImageFile,
    tp,
    setSourceFile,
    setMapFile,
    addSprite,
    removeSprite,
    addSpriteFrame,
    removeSpriteFrame,
    extractResources,
  };
}
