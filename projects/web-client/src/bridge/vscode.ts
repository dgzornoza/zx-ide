export type VscodeBridge = {
  isAvailable: boolean;
  postMessage: (message: unknown) => void;
};

export const createVsCodeBridge = (): VscodeBridge => {
  if (
    typeof window !== "undefined" &&
    typeof window.acquireVsCodeApi === "function"
  ) {
    const api = window.acquireVsCodeApi();
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
