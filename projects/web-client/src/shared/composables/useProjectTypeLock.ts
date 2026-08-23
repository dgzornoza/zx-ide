// ─── useProjectTypeLock ────────────────────────────────────────────────────
//
// Bridges the VS Code extension's `InitMessage` (which carries the project's
// `projectType` from `.zxide.json`) into the webview's code-generation state.
//
// Contract:
// - When `projectType === "sjasmplus"`: forces `codeGenerationType` to "asm"
//   and `useZx0Compression` to `false`; both controls become read-only.
// - When `projectType === "z88dk"`: forces `codeGenerationType` to "c" and
//   keeps `useZx0Compression` at its `true` default; both controls become
//   read-only (the C target always uses ZX0 compression).
// - When `projectType` is missing (e.g. standalone browser mode), the refs
//   stay at their defaults and remain user-editable.
//
// Non-init messages are ignored. The window `message` listener is registered
// in `onMounted` and removed in `onBeforeUnmount`.

import type {
  CodeGenerationType,
  InitMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import { onBeforeUnmount, onMounted, ref } from "vue";

export interface ProjectTypeLock {
  codeGenerationType: ReturnType<typeof ref<CodeGenerationType>>;
  isCodeGenerationTypeReadOnly: ReturnType<typeof ref<boolean>>;
  useZx0Compression: ReturnType<typeof ref<boolean>>;
  isZx0CompressionReadOnly: ReturnType<typeof ref<boolean>>;
}

export function useProjectTypeLock() {
  const codeGenerationType = ref<CodeGenerationType>("c");
  const isCodeGenerationTypeReadOnly = ref(false);
  const useZx0Compression = ref<boolean>(true);
  const isZx0CompressionReadOnly = ref(false);

  const onWindowMessage = (event: MessageEvent) => {
    const message = event.data as InitMessage | undefined;
    if (!message || message.messageType !== "init") return;

    if (message.projectType === "sjasmplus") {
      codeGenerationType.value = "asm";
      isCodeGenerationTypeReadOnly.value = true;
      useZx0Compression.value = false;
      isZx0CompressionReadOnly.value = true;
    } else if (message.projectType === "z88dk") {
      codeGenerationType.value = "c";
      isCodeGenerationTypeReadOnly.value = true;
      useZx0Compression.value = true;
      isZx0CompressionReadOnly.value = true;
    }
    // Any other projectType (including undefined): leave refs at their
    // defaults so standalone / dev-mode keeps working.
  };

  onMounted(() => {
    window.addEventListener("message", onWindowMessage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", onWindowMessage);
  });

  return {
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
  };
}
