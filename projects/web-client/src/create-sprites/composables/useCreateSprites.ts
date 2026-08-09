import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import JSZip from "jszip";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { createSpritesCodeGenerator } from "src/shared/composables/spritesCodeGenerators/codeGeneratorFactory";
import type { SpritesCodeGeneratorParams } from "src/shared/composables/spritesCodeGenerators/codeGeneratorStrategy";
import {
  SpriteDefinition,
  SpriteFlags,
} from "src/shared/models/spriteDefinition";
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
    sprites: [] as SpriteDefinition[],
  });

  const status = ref<StatusMessage | null>(null);
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  /** ZX0 compression flag forwarded to the C code generator. Default true. */
  const useZx0Compression = ref<boolean>(true);
  const binaryText = ref("");
  const outputName = ref("sprites");
  /** Combined sprite flags (SP1 padding, Use mask) forwarded to the generator. */
  const spriteFlags = ref<number>(SpriteFlags.None);
  /** Index of the sprite that receives the next "Add" from the BinaryInputPanel. */
  const activeSpriteIndex = ref(-1);

  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  // ─── Sprite actions ────────────────────────────────────────────────────────

  function addSprite() {
    const newSprite: SpriteDefinition = {
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
    if (activeSpriteIndex.value > index) {
      // Removed sprite was before the active one — shift the pointer down
      // so the "Active" badge stays on the same sprite.
      activeSpriteIndex.value -= 1;
    } else if (activeSpriteIndex.value >= state.sprites.length) {
      activeSpriteIndex.value = state.sprites.length - 1;
    }
  }

  function removeFrame(spriteIndex: number, frameIndex: number) {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.splice(frameIndex, 1);
  }

  /**
   * Called when the user clicks the per-sprite "Add frame" button in the
   * shared SpritesEditorSection. The button does not produce an empty frame;
   * it only marks the sprite as active so the next frame coming from the
   * BinaryInputPanel lands in it.
   */
  function addSpriteFrame(spriteIndex: number) {
    if (spriteIndex < 0 || spriteIndex >= state.sprites.length) return;
    activeSpriteIndex.value = spriteIndex;
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
  ): void {
    // Auto-create a sprite if there is none
    if (state.sprites.length === 0 || activeSpriteIndex.value < 0) {
      addSprite();
    }

    const sprite = state.sprites[activeSpriteIndex.value];
    if (!sprite) return;

    // Validate dimensions against the sprite's current width/height.
    // On the first frame, adopt the bitmap dimensions as the sprite size.
    if (sprite.frames.length > 0) {
      if (sprite.width !== width || sprite.height !== height) {
        setStatus("error", tp("errorDimensionMismatch"));
        return;
      }
    } else {
      sprite.width = width;
      sprite.height = height;
    }

    sprite.frames.push({ x: 0, y: 0, bitmap: { inkBitmap, preview } });
    // Clear the binary input so the next frame starts from a clean slate.
    binaryText.value = "";
    status.value = null;
  }

  // ─── Code generation ───────────────────────────────────────────────────────

  async function generateCode() {
    const sprites = state.sprites.filter((s) => s.frames.length > 0);

    if (sprites.length === 0) {
      setStatus("error", tp("errorNoSprites"));
      return;
    }

    // Build SpritesCodeGeneratorParams. Each frame is reduced to (x=0, y=0)
    // because the pixel data lives in spriteBitmasks, which we derive from
    // the per-frame bitmap attached by addFrame().
    const params: SpritesCodeGeneratorParams = {
      name: outputName.value.trim() || "sprites",
      sprites: sprites.map((sprite) => ({
        _id: sprite._id,
        name: sprite.name || sprite._id || "",
        width: sprite.width,
        height: sprite.height,
        frames: sprite.frames.map(() => ({ x: 0, y: 0 })),
      })),
      spriteFlags: spriteFlags.value,
      spriteBitmasks: sprites.map((sprite) =>
        sprite.frames.map((frame) => frame.bitmap?.inkBitmap ?? []),
      ),
      compressed: useZx0Compression.value,
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
        const isBinary = file.fileType === "png" || file.fileType === "binary";
        zip.file(file.fileName, file.content, isBinary ? { base64: true } : undefined);
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
    useZx0Compression,
    spriteFlags,
    activeSpriteIndex,
    tp,
    addSprite,
    removeSprite,
    removeFrame,
    addSpriteFrame,
    addFrame,
    generateCode,
  };
}