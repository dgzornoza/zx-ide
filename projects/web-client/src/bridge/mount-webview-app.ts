import { createApp, type App, type Component } from 'vue';

import { i18n } from 'src/i18n';

import { createVsCodeBridge, type VscodeBridge } from './vscode';

/**
 * Mounts a webview page on `#app` and then tells the extension the page is
 * ready. `mount()` runs every `onMounted` hook synchronously, so all
 * extension-message subscriptions exist before `readyFromWebview` is posted
 * and the extension's initial messages cannot be lost.
 */
export function mountWebviewApp(rootComponent: Component, bridge: VscodeBridge = createVsCodeBridge()): App {
  const app = createApp(rootComponent).use(i18n);
  app.mount('#app');
  if (bridge.isAvailable) {
    bridge.postMessage({ messageType: 'readyFromWebview' });
  }
  return app;
}
