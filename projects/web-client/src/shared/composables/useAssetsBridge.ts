// ─── useAssetsBridge ────────────────────────────────────────────────────────
//
// Bridges the VS Code extension's `AssetsListMessage` (which carries the
// discovered asset entries under `<workspace>/assets/`) into the webview's
// reactive state, and provides a `requestAssetBytes(path)` API that posts a
// `readAssetRequestFromWebview` to the host and resolves with the bytes from
// the matching `readAssetResponseFromExtension`.
//
// Contract:
// - When an `AssetsListMessage` arrives, `assets` and `missing` refs reflect
//   the payload exactly.
// - `requestAssetBytes(path)` returns a promise that resolves to a
//   `Uint8Array` (base64-decoded from the response) when the matching
//   response arrives, or rejects with an `Error(error)` if the response
//   carries an `error` field.
// - A request without response after `timeoutMilliseconds` (default 30 s)
//   rejects with `DomainError('errorAssetRequestTimeout', [path])`; a later
//   response for it is ignored.
// - On unmount every pending request rejects with
//   `DomainError('errorAssetRequestCancelled', [path])` and its timer is cleared.
// - A response whose `requestId` does not match any pending request is
//   ignored (no throw, refs unchanged).
// - The extension-message subscriptions are registered in `onMounted` and
//   removed in `onBeforeUnmount`.

import type { AssetsEntry, ReadAssetRequestMessage, ReadAssetResponseMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { onBeforeUnmount, onMounted, Ref, ref } from 'vue';

import { subscribeToExtensionMessage } from 'src/bridge/extension-messages';
import { createVsCodeBridge } from 'src/bridge/vscode';
import { DomainError } from 'src/domain/domain-error';
import { base64ToBytes } from 'src/helpers/binary-utils';

interface PendingRequest {
  path: string;
  resolve: (bytes: Uint8Array) => void;
  reject: (error: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

export interface AssetsBridgeOptions {
  /** Time to wait for the extension's answer to an asset request. */
  timeoutMilliseconds?: number;
}

const DEFAULT_ASSET_REQUEST_TIMEOUT_MILLISECONDS = 30_000;

export interface AssetsBridge {
  assets: Ref<AssetsEntry[]>;
  missing: Ref<boolean>;
  requestAssetBytes(path: string): Promise<Uint8Array>;
}

export function useAssetsBridge(
  vscodeBridge: ReturnType<typeof createVsCodeBridge> = createVsCodeBridge(),
  { timeoutMilliseconds = DEFAULT_ASSET_REQUEST_TIMEOUT_MILLISECONDS }: AssetsBridgeOptions = {}
): AssetsBridge {
  const assets = ref<AssetsEntry[]>([]);
  const missing = ref<boolean>(false);
  const pendingRequests = new Map<string, PendingRequest>();

  function decodeResponse(response: ReadAssetResponseMessage): void {
    const pending = pendingRequests.get(response.requestId);
    if (!pending) return; // stale, timed out or cancelled
    pendingRequests.delete(response.requestId);
    clearTimeout(pending.timeoutHandle);
    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(base64ToBytes(response.contentBase64 ?? ''));
    }
  }

  const unsubscribers: (() => void)[] = [];

  function requestAssetBytes(path: string): Promise<Uint8Array> {
    const requestId = globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return new Promise<Uint8Array>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new DomainError('errorAssetRequestTimeout', [path]));
      }, timeoutMilliseconds);
      pendingRequests.set(requestId, { path, resolve, reject, timeoutHandle });
      const message: ReadAssetRequestMessage = {
        messageType: 'readAssetRequestFromWebview',
        path,
        requestId,
      };
      // window.postMessage does NOT reach the VS Code host — we must use the
      // acquireVsCodeApi bridge (createVsCodeBridge) to send messages out.
      vscodeBridge.postMessage(message);
    });
  }

  onMounted(() => {
    unsubscribers.push(
      subscribeToExtensionMessage('assetsListFromExtension', (message) => {
        assets.value = message.assets;
        missing.value = message.missing === true;
      }),
      subscribeToExtensionMessage('readAssetResponseFromExtension', decodeResponse)
    );
  });

  onBeforeUnmount(() => {
    unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
    for (const pending of pendingRequests.values()) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new DomainError('errorAssetRequestCancelled', [pending.path]));
    }
    pendingRequests.clear();
  });

  return { assets, missing, requestAssetBytes };
}
