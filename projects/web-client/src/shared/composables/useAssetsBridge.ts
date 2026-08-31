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
// - A response whose `requestId` does not match any pending request is
//   ignored (no throw, refs unchanged).
// - The window `message` listener is registered in `onMounted` and removed
//   in `onBeforeUnmount`.

import type {
  AssetsEntry,
  AssetsListMessage,
  ReadAssetRequestMessage,
  ReadAssetResponseMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";
import { onBeforeUnmount, onMounted, Ref, ref } from "vue";

import { createVsCodeBridge } from "src/bridge/vscode";
import { base64ToBytes } from "src/helpers/binary-utils";

interface PendingRequest {
  resolve: (bytes: Uint8Array) => void;
  reject: (error: Error) => void;
}

export interface AssetsBridge {
  assets: Ref<AssetsEntry[]>;
  missing: Ref<boolean>;
  requestAssetBytes(path: string): Promise<Uint8Array>;
}

export function useAssetsBridge(
  vscodeBridge: ReturnType<typeof createVsCodeBridge> = createVsCodeBridge(),
): AssetsBridge {
  const assets = ref<AssetsEntry[]>([]);
  const missing = ref<boolean>(false);
  const pendingRequests = new Map<string, PendingRequest>();

  function decodeResponse(response: ReadAssetResponseMessage): void {
    const pending = pendingRequests.get(response.requestId);
    if (!pending) return; // stale or cancelled
    pendingRequests.delete(response.requestId);
    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(base64ToBytes(response.contentBase64 ?? ""));
    }
  }

  function onWindowMessage(event: MessageEvent) {
    const data = event.data as
      | AssetsListMessage
      | ReadAssetResponseMessage
      | undefined;
    if (!data || typeof data !== "object") return;

    if (data.messageType === "assetsListFromExtension") {
      assets.value = data.assets;
      missing.value = data.missing === true;
      return;
    }

    if (data.messageType === "readAssetResponseFromExtension") {
      decodeResponse(data);
    }
  }

  function requestAssetBytes(path: string): Promise<Uint8Array> {
    const requestId =
      globalThis.crypto?.randomUUID?.() ??
      `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return new Promise<Uint8Array>((resolve, reject) => {
      pendingRequests.set(requestId, { resolve, reject });
      const message: ReadAssetRequestMessage = {
        messageType: "readAssetRequestFromWebview",
        path,
        requestId,
      };
      // window.postMessage does NOT reach the VS Code host — we must use the
      // acquireVsCodeApi bridge (createVsCodeBridge) to send messages out.
      vscodeBridge.postMessage(message);
    });
  }

  onMounted(() => {
    window.addEventListener("message", onWindowMessage);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", onWindowMessage);
  });

  return { assets, missing, requestAssetBytes };
}
