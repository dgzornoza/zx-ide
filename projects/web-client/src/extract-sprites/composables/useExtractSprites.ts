import {
  CodeGenerationType,
  FileEntry,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import JSZip from "jszip";
import { createSpritesCodeGenerator } from "src/extract-sprites/composables/codeGenerators/spritesCodeGenerators";
import {
  SpriteDefinition,
  SpriteFlags,
  SpritesMapModel,
} from "src/extract-sprites/models/spriteDefinition";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import {
  StatusMessage,
  StatusMessageType,
} from "src/shared/models/statusMessage";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadBlob } from "../../helpers/html-utils";
import { extractSpritesFromFile } from "../../helpers/image-utils";

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

  /** The last PNG File chosen by the user, kept for sprite frame preview extraction. */
  const currentImageFile = ref<File | null>(null);

  const status = ref<StatusMessage | null>(null);
  const codeGenerationType = ref<CodeGenerationType>("asm");
  const isCodeGenerationTypeReadOnly = ref(false);
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
        })),
      );
      spriteFlags.value = mapData.spriteFlags ?? SpriteFlags.None;
    } catch {
      setStatus("error", tp("errorMapLoadFailed"));
    }
  };

  // ─── Source file ───────────────────────────────────────────────────────────

  /**
   * Stores the selected PNG file for use in sprite frame previews.
   */
  const setSourceFile = async (file: File) => {
    currentImageFile.value = file;
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
   * Generates all resource files for the current sprites.
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

    const generator = createSpritesCodeGenerator(codeGenerationType.value);
    const spriteBitmasks = await extractSpritesFromFile(
      currentImageFile.value,
      state.sprites.map((sprite) =>
        sprite.frames.map((frame) => ({
          x: frame.x,
          y: frame.y,
          width: sprite.width,
          height: sprite.height,
        })),
      ),
    );
    const codeFiles: FileEntry[] = generator.generate({
      name: fileNameWithoutExtension,
      sprites: state.sprites,
      spriteFlags: spriteFlags.value,
      spriteBitmasks,
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
    if (!state.sprites.length) addSprite();
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
