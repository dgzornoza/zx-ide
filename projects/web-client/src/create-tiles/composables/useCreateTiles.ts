import type {
  CodeGenerationType,
  InitMessage,
  WriteFilesMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import JSZip from "jszip";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { createTilesCodeGenerator } from "src/shared/composables/tilesCodeGenerators/codeGeneratorFactory";
import type {
  StatusMessage,
  StatusMessageType,
} from "src/shared/models/statusMessage";
import type { TilesModel } from "src/shared/models/tilesDefinition";
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { createVsCodeBridge } from "../../bridge/vscode";
import { downloadBlob } from "../../helpers/html-utils";

export function useCreateTiles() {
  const vscode = createVsCodeBridge();
  const tp = createTranslationPrefixFn("create-tiles");

  const state = reactive({
    tiles: {
      previews: [] as string[],
      inkBitmaps: [] as boolean[][],
      tileWidth: 0,
      tileHeight: 0,
    },
  });

  const status = ref<StatusMessage | null>(null);
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  /** ZX0 compression flag forwarded to the C code generator. Default true. */
  const useZx0Compression = ref<boolean>(true);
  const binaryText = ref("");
  const outputName = ref("tiles");

  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  function addTile(
    inkBitmap: boolean[],
    width: number,
    height: number,
    preview: string,
  ) {
    if (state.tiles.tileWidth === 0) {
      state.tiles.tileWidth = width;
      state.tiles.tileHeight = height;
    }
    state.tiles.previews.push(preview);
    state.tiles.inkBitmaps.push(inkBitmap);
  }

  function removeTile(index: number) {
    state.tiles.previews.splice(index, 1);
    state.tiles.inkBitmaps.splice(index, 1);
    if (state.tiles.previews.length === 0) {
      state.tiles.tileWidth = 0;
      state.tiles.tileHeight = 0;
    }
  }

  async function generateCode() {
    const count = state.tiles.previews.length;
    if (count === 0) {
      setStatus("error", tp("errorNoTiles"));
      return;
    }

    const tilesModel: TilesModel = {
      type: "tiles",
      tileWidth: state.tiles.tileWidth,
      tileHeight: state.tiles.tileHeight,
      count,
      columns: count,
      previews: state.tiles.previews,
      inkBitmaps: state.tiles.inkBitmaps,
      excluded: [],
      excludedSet: new Set<number>(),
    };

    const generator = createTilesCodeGenerator(codeGenerationType.value);
    const codeFiles = generator.generate({
      name: outputName.value.trim() || "tiles",
      tiles: tilesModel,
      compressed: useZx0Compression.value,
    });

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
      downloadBlob(blob, "tiles.zip");
      setStatus("success", tp("statusDownloaded"));
    }
  }

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
    tp,
    addTile,
    removeTile,
    generateCode,
  };
}
