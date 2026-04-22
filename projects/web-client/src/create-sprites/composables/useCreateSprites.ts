import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import JSZip from "jszip";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { createSpritesCodeGenerator } from "src/shared/composables/spritesCodeGenerators/codeGeneratorFactory";
import type { SpritesCodeGeneratorParams } from "src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy";
import type { CreateSpriteDefinition } from "src/shared/models/createSpriteDefinition";
import type {
  StatusMessage,
  StatusMessageType,
} from "src/shared/models/statusMessage";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadBlob } from "../../helpers/html-utils";

export function useCreateSprites() {
  const vscode = createVsCodeBridge();
  const tp = createTranslationPrefixFn("create-sprites");

  const state = reactive({
    sprites: [] as CreateSpriteDefinition[],
  });

  const status = ref<StatusMessage | null>(null);
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  const binaryText = ref("");
  const outputName = ref("sprites");
  /** Index of the sprite that receives the next "Add frame" action. */
  const activeSpriteIndex = ref(-1);

  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  // ─── Sprite actions ────────────────────────────────────────────────────────

  function addSprite() {
    const newSprite: CreateSpriteDefinition = {
      _id: crypto.randomUUID(),
      name: "",
      width: 0,
      height: 0,
      frames: [],
    };
    state.sprites.push(newSprite);
    activeSpriteIndex.value = state.sprites.length - 1;
  }

  function removeSprite(index: number) {
    state.sprites.splice(index, 1);
    if (activeSpriteIndex.value >= state.sprites.length) {
      activeSpriteIndex.value = state.sprites.length - 1;
    }
  }

  function removeFrame(spriteIndex: number, frameIndex: number) {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.splice(frameIndex, 1);
  }

  /**
   * Adds a frame to the active sprite.
   * Auto-creates a sprite if none exists yet.
   * Rejects frames whose dimensions don't match the first frame of the sprite.
   */
  function addFrame(
    inkBitmap: boolean[],
    width: number,
    height: number,
    preview: string,
  ) {
    // Auto-create a sprite if there is none
    if (state.sprites.length === 0 || activeSpriteIndex.value < 0) {
      addSprite();
    }

    const sprite = state.sprites[activeSpriteIndex.value];
    if (!sprite) return;

    // Validate dimensions against the first frame of this sprite
    if (sprite.frames.length > 0) {
      if (sprite.width !== width || sprite.height !== height) {
        setStatus("error", tp("errorDimensionMismatch"));
        return;
      }
    } else {
      sprite.width = width;
      sprite.height = height;
    }

    sprite.frames.push({ inkBitmap, preview });
    status.value = null;
  }

  // ─── Code generation ───────────────────────────────────────────────────────

  async function generateCode() {
    const sprites = state.sprites.filter((s) => s.frames.length > 0);

    if (sprites.length === 0) {
      setStatus("error", tp("errorNoSprites"));
      return;
    }

    // Build SpritesCodeGeneratorParams using dummy frame coordinates (x=0, y=0)
    // since bitmaps are already extracted and stored in CreateSpriteFrame.inkBitmap.
    const params: SpritesCodeGeneratorParams = {
      name: outputName.value.trim() || "sprites",
      sprites: sprites.map((sprite) => ({
        _id: sprite._id,
        name: sprite.name || sprite._id,
        width: sprite.width,
        height: sprite.height,
        frames: sprite.frames.map(() => ({ x: 0, y: 0 })),
      })),
      spriteFlags: 0,
      spriteBitmasks: sprites.map((sprite) =>
        sprite.frames.map((frame) => frame.inkBitmap),
      ),
    };

    const generator = createSpritesCodeGenerator(codeGenerationType.value);
    const codeFiles = generator.generate(params);

    if (vscode.isAvailable) {
      const message: WriteFilesMessage = {
        messageType: "writeFiles",
        codeFiles,
      };
      vscode.postMessage(message);
      setStatus("success", tp("statusSent"));
    } else {
      const zip = new JSZip();
      for (const file of codeFiles) {
        zip.file(file.fileName, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${params.name}.zip`);
      setStatus("success", tp("statusDownloaded"));
    }
  }

  // ─── VSCode init message ───────────────────────────────────────────────────

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
    binaryText,
    outputName,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    activeSpriteIndex,
    tp,
    addSprite,
    removeSprite,
    removeFrame,
    addFrame,
    generateCode,
  };
}
