// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the tests define throwaway host components */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, onMounted, type App } from 'vue';

import type { WebviewToExtensionMessage } from 'externalShared/bridge-messages';

import { mountWebviewApp } from './mount-webview-app';
import type { VscodeBridge } from './vscode';

describe('mountWebviewApp', () => {
  let mountedApp: App | undefined;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    mountedApp?.unmount();
    mountedApp = undefined;
  });

  function createBridge(isAvailable: boolean, events: string[]) {
    const postMessage = vi.fn((message: WebviewToExtensionMessage) => {
      events.push(`posted:${message.messageType}`);
    });
    const bridge: VscodeBridge = { isAvailable, postMessage };
    return { bridge, postMessage };
  }

  it('posts readyFromWebview once, after every component has mounted', () => {
    const events: string[] = [];
    const Child = defineComponent({
      setup() {
        onMounted(() => events.push('mounted:child'));
        return () => h('span');
      },
    });
    const Root = defineComponent({
      setup() {
        onMounted(() => events.push('mounted:root'));
        return () => h(Child);
      },
    });
    const { bridge, postMessage } = createBridge(true, events);

    mountedApp = mountWebviewApp(Root, bridge);

    expect(postMessage).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith({ messageType: 'readyFromWebview' });
    expect(events).toEqual(['mounted:child', 'mounted:root', 'posted:readyFromWebview']);
    expect(document.querySelector('#app span')).not.toBeNull();
  });

  it('does not post when running outside VS Code', () => {
    const events: string[] = [];
    const Root = defineComponent({ setup: () => () => h('span') });
    const { bridge, postMessage } = createBridge(false, events);

    mountedApp = mountWebviewApp(Root, bridge);

    expect(postMessage).not.toHaveBeenCalled();
    expect(document.querySelector('#app span')).not.toBeNull();
  });
});
