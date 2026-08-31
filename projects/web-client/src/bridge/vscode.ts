export type VscodeBridge = {
  isAvailable: boolean;
  postMessage: (message: unknown) => void;
};

// `acquireVsCodeApi` can only be called once per webview, calling it again
// throws. Cache the bridge so every consumer gets the same instance.
let cachedBridge: VscodeBridge | undefined;

/**
 * Creates a bridge to communicate with the VS Code extension host.
 *
 * When loaded inside a VS Code webview, `window.acquireVsCodeApi` is provided
 * by the host and `isAvailable` is `true`. When the page runs standalone
 * (e.g. via `npm run dev` in a plain browser), the bridge is created in a
 * fallback state: `isAvailable` is `false` and `postMessage` throws so any
 * attempt to save files fails loudly instead of silently disappearing.
 *
 * Composables MUST check `isAvailable` before calling `postMessage`.
 */
export const createVsCodeBridge = (): VscodeBridge => {
  if (cachedBridge !== undefined) {
    return cachedBridge;
  }
  if (
    globalThis.window !== undefined &&
    typeof globalThis.window.acquireVsCodeApi === "function"
  ) {
    const api = globalThis.window.acquireVsCodeApi();
    cachedBridge = {
      isAvailable: true,
      postMessage: api.postMessage.bind(api),
    };
    return cachedBridge;
  }

  cachedBridge = {
    isAvailable: false,
    postMessage: (message: unknown) => {
      throw new Error(
        "VS Code API is unavailable. This webview must run inside the VS Code extension to save files. " +
          "Run the command from the VS Code command palette instead of opening the page in a standalone browser.",
      );
    },
  };
  return cachedBridge;
};
