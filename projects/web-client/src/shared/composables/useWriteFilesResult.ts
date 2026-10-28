// ─── useWriteFilesResult ────────────────────────────────────────────────────
//
// Reports the outcome of a `writeFilesFromWebview` request. The extension
// answers every write with a `writeFilesResultFromExtension` message; pages
// show success or error only when that reply arrives, never when the request
// is posted.
//
// The subscription is registered in `onMounted` and removed in
// `onBeforeUnmount`.

import type { WriteFilesResultMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { onBeforeUnmount, onMounted } from 'vue';

import { subscribeToExtensionMessage } from 'src/bridge/extension-messages';

export function useWriteFilesResult(onResult: (result: WriteFilesResultMessage) => void): void {
  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    unsubscribe = subscribeToExtensionMessage('writeFilesResultFromExtension', onResult);
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });
}
