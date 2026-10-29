// ─── useGeneratedFilesWriter ────────────────────────────────────────────────
//
// Sends generated files to the extension and owns the page status banner.
// `writeFiles` posts a `writeFilesFromWebview` request; the banner shows
// success or error only when the extension answers with
// `writeFilesResultFromExtension`, never when the request is posted.
//
// `status` is read-only: pages change it through `setStatus` / `clearStatus`.
// The reply subscription is registered in `onMounted` and removed in
// `onBeforeUnmount`.

import type { FileEntry } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';

import { subscribeToExtensionMessage } from 'src/bridge/extension-messages';
import { createVsCodeBridge } from 'src/bridge/vscode';
import type { StatusMessage, StatusMessageType } from 'src/shared/models/statusMessage';

/**
 * @param translate Page translation function; it must resolve the page's
 * `statusSent` and `errorVsCodeRequired` keys.
 */
export function useGeneratedFilesWriter(translate: (key: string) => string) {
  const bridge = createVsCodeBridge();
  const status = ref<StatusMessage | undefined>(undefined);
  let unsubscribe: (() => void) | undefined;

  /** Updates the status banner with a success or error message. */
  const setStatus = (type: StatusMessageType, text: string) => {
    status.value = { type, text };
  };

  /** Hides the status banner. */
  const clearStatus = () => {
    status.value = undefined;
  };

  /** Posts the generated files to the extension, or reports an error outside VS Code. */
  const writeFiles = (codeFiles: FileEntry[]) => {
    if (!bridge.isAvailable) {
      setStatus('error', translate('errorVsCodeRequired'));
      return;
    }

    bridge.postMessage({ messageType: 'writeFilesFromWebview', codeFiles });
  };

  onMounted(() => {
    unsubscribe = subscribeToExtensionMessage('writeFilesResultFromExtension', (result) => {
      if (result.success) {
        setStatus('success', translate('statusSent'));
      } else {
        setStatus('error', result.error ?? '');
      }
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return {
    status: readonly(status),
    setStatus,
    clearStatus,
    writeFiles,
  };
}
