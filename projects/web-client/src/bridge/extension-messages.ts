import { isBridgeMessage, type ExtensionToWebviewMessage, type MessageOfType } from 'externalShared/bridge-messages';

type ExtensionMessageType = ExtensionToWebviewMessage['messageType'];
type ExtensionMessageHandler = (message: ExtensionToWebviewMessage) => void;

// Single dispatcher for every message the extension posts to the webview:
// one `window` listener routes each message to the handlers subscribed to its
// `messageType`. The listener is attached while at least one handler exists.
const handlersByType = new Map<string, Set<ExtensionMessageHandler>>();

function onWindowMessage(event: MessageEvent): void {
  const message: unknown = event.data;
  if (!isBridgeMessage(message)) return;
  const handlers = handlersByType.get(message.messageType);
  // Copy so a handler that unsubscribes does not alter the iteration.
  [...(handlers ?? [])].forEach((handler) => handler(message as ExtensionToWebviewMessage));
}

/**
 * Calls `handler` for every message of `messageType` posted by the extension.
 * Returns the function that removes the subscription.
 */
export function subscribeToExtensionMessage<TMessageType extends ExtensionMessageType>(
  messageType: TMessageType,
  handler: (message: MessageOfType<ExtensionToWebviewMessage, TMessageType>) => void
): () => void {
  if (handlersByType.size === 0) {
    window.addEventListener('message', onWindowMessage);
  }
  const handlers = handlersByType.get(messageType) ?? new Set<ExtensionMessageHandler>();
  const registeredHandler = handler as ExtensionMessageHandler;
  handlers.add(registeredHandler);
  handlersByType.set(messageType, handlers);

  return () => {
    handlers.delete(registeredHandler);
    if (handlers.size === 0 && handlersByType.get(messageType) === handlers) {
      handlersByType.delete(messageType);
    }
    if (handlersByType.size === 0) {
      window.removeEventListener('message', onWindowMessage);
    }
  };
}
