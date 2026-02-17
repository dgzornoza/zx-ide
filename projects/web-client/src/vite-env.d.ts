/// <reference types="vite/client" />

declare global {
  interface Window {
    acquireVsCodeApi?: () => { postMessage: (message: unknown) => void };
    __WEBVIEW_LOCALE__?: string;
  }
}

export {};
