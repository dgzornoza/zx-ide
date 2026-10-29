// useProjectTypeLock
//
// Bridges the VS Code extension's `InitMessage` (which carries the project's
// `projectType` from `.zxide.json`) into the webview's code-generation state.
//
// Contract:
// - When `projectType === "sjasmplus"`: forces `codeGenerationType` to "asm"
//   and `useZx0Compression` to `false`, both controls become read-only.
// - When `projectType === "z88dk"`: forces `codeGenerationType` to "c" and
//   keeps `useZx0Compression` at its `true` default, both controls become
//   read-only (the C target always uses ZX0 compression).
// - When `projectType` is missing (e.g. standalone browser mode), the refs
//   stay at their defaults and remain user-editable.
//
// The state is returned read-only: callers change it only through
// `setCodeGenerationType` / `setUseZx0Compression`, which do nothing while the
// project type locks the value.
//
// Non-init messages are ignored. The `initFromExtension` subscription is
// registered in `onMounted` and removed in `onBeforeUnmount`.

import type { CodeGenerationType, InitMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { onBeforeUnmount, onMounted, readonly, ref, type Ref } from 'vue';

import { subscribeToExtensionMessage } from 'src/bridge/extension-messages';

export interface ProjectTypeLock {
  codeGenerationType: Readonly<Ref<CodeGenerationType>>;
  isCodeGenerationTypeReadOnly: Readonly<Ref<boolean>>;
  useZx0Compression: Readonly<Ref<boolean>>;
  isZx0CompressionReadOnly: Readonly<Ref<boolean>>;
  /** Changes the code generation language unless the project type locks it. */
  setCodeGenerationType(type: CodeGenerationType): void;
  /** Turns ZX0 compression on or off unless the project type locks it. */
  setUseZx0Compression(enabled: boolean): void;
}

export function useProjectTypeLock(): ProjectTypeLock {
  const codeGenerationType = ref<CodeGenerationType>('c');
  const isCodeGenerationTypeReadOnly = ref(false);
  const useZx0Compression = ref<boolean>(true);
  const isZx0CompressionReadOnly = ref(false);

  const onInitMessage = (message: InitMessage) => {
    if (message.projectType === 'sjasmplus') {
      codeGenerationType.value = 'asm';
      isCodeGenerationTypeReadOnly.value = true;
      useZx0Compression.value = false;
      isZx0CompressionReadOnly.value = true;
    } else if (message.projectType === 'z88dk') {
      codeGenerationType.value = 'c';
      isCodeGenerationTypeReadOnly.value = true;
      useZx0Compression.value = true;
      isZx0CompressionReadOnly.value = true;
    }
    // Any other projectType (including undefined): leave refs at their
    // defaults so standalone / dev-mode keeps working.
  };

  const setCodeGenerationType = (type: CodeGenerationType) => {
    if (isCodeGenerationTypeReadOnly.value) return;
    codeGenerationType.value = type;
  };

  const setUseZx0Compression = (enabled: boolean) => {
    if (isZx0CompressionReadOnly.value) return;
    useZx0Compression.value = enabled;
  };

  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    unsubscribe = subscribeToExtensionMessage('initFromExtension', onInitMessage);
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return {
    codeGenerationType: readonly(codeGenerationType),
    isCodeGenerationTypeReadOnly: readonly(isCodeGenerationTypeReadOnly),
    useZx0Compression: readonly(useZx0Compression),
    isZx0CompressionReadOnly: readonly(isZx0CompressionReadOnly),
    setCodeGenerationType,
    setUseZx0Compression,
  };
}
