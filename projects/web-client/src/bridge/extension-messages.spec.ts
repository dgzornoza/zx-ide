// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { dispatchMessage, type MessageHandlers, type WebviewToExtensionMessage } from 'externalShared/bridge-messages';
import type { InitMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';

import { subscribeToExtensionMessage } from './extension-messages';

function postFromExtension(data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data }));
}

describe('dispatchMessage', () => {
  function createHandlers(): MessageHandlers<WebviewToExtensionMessage> {
    return {
      writeFilesFromWebview: vi.fn(),
      saveMapFromWebview: vi.fn(),
      readAssetRequestFromWebview: vi.fn(),
    };
  }

  it('runs only the handler registered for the message type', async () => {
    const handlers = createHandlers();
    const message = { messageType: 'readAssetRequestFromWebview', path: 'player.png', requestId: 'request-1' };

    const handled = await dispatchMessage(message, handlers);

    expect(handled).toBe(true);
    expect(handlers.readAssetRequestFromWebview).toHaveBeenCalledWith(message);
    expect(handlers.writeFilesFromWebview).not.toHaveBeenCalled();
    expect(handlers.saveMapFromWebview).not.toHaveBeenCalled();
  });

  it.each([undefined, 'text', 42, {}, { messageType: 7 }, { messageType: 'unknownFromWebview' }, { messageType: 'toString' }])(
    'ignores %j',
    async (message) => {
      const handlers = createHandlers();

      const handled = await dispatchMessage(message, handlers);

      expect(handled).toBe(false);
      expect(handlers.readAssetRequestFromWebview).not.toHaveBeenCalled();
      expect(handlers.writeFilesFromWebview).not.toHaveBeenCalled();
      expect(handlers.saveMapFromWebview).not.toHaveBeenCalled();
    }
  );
});

describe('subscribeToExtensionMessage', () => {
  const unsubscribers: (() => void)[] = [];

  afterEach(() => {
    unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
  });

  it('delivers a message only to the handlers subscribed to its type', () => {
    const initHandler = vi.fn();
    const assetsHandler = vi.fn();
    unsubscribers.push(subscribeToExtensionMessage('initFromExtension', initHandler));
    unsubscribers.push(subscribeToExtensionMessage('assetsListFromExtension', assetsHandler));
    const message: InitMessage = { messageType: 'initFromExtension', projectType: 'z88dk' };

    postFromExtension(message);

    expect(initHandler).toHaveBeenCalledOnce();
    expect(initHandler).toHaveBeenCalledWith(message);
    expect(assetsHandler).not.toHaveBeenCalled();
  });

  it('delivers a message to every handler subscribed to its type', () => {
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    unsubscribers.push(subscribeToExtensionMessage('initFromExtension', firstHandler));
    unsubscribers.push(subscribeToExtensionMessage('initFromExtension', secondHandler));

    postFromExtension({ messageType: 'initFromExtension' });

    expect(firstHandler).toHaveBeenCalledOnce();
    expect(secondHandler).toHaveBeenCalledOnce();
  });

  it('stops delivering after unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToExtensionMessage('initFromExtension', handler);

    unsubscribe();
    postFromExtension({ messageType: 'initFromExtension' });

    expect(handler).not.toHaveBeenCalled();
  });

  it.each([undefined, 'text', { messageType: 'unknownFromExtension' }])('ignores %j', (data) => {
    const handler = vi.fn();
    unsubscribers.push(subscribeToExtensionMessage('initFromExtension', handler));

    postFromExtension(data);

    expect(handler).not.toHaveBeenCalled();
  });
});
