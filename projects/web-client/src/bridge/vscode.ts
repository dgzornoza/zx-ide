export type VscodeBridge = {
  isAvailable: boolean;
  postMessage: (message: unknown) => void;
};

export const createVsCodeBridge = (): VscodeBridge => {
  if (
    globalThis.window !== undefined &&
    typeof globalThis.window.acquireVsCodeApi === "function"
  ) {
    const api = globalThis.window.acquireVsCodeApi();
    return {
      isAvailable: true,
      postMessage: api.postMessage.bind(api),
    };
  }

  return {
    isAvailable: false,
    postMessage: (message: unknown) => {
      console.info("VS Code API unavailable. Message ignored.", message);
    },
  };
};
