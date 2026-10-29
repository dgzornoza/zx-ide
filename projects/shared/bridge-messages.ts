import type {
  AssetsListMessage,
  InitMessage,
  ReadAssetRequestMessage,
  ReadyMessage,
  ReadAssetResponseMessage,
  WriteFilesMessage,
  WriteFilesResultMessage,
} from "./extract-graphics/extract-graphics-dtos";
import type { VsCodeBridgeMessage } from "./infrastructure";

/** Every message the extension may post to a webview. */
export type ExtensionToWebviewMessage = InitMessage | AssetsListMessage | ReadAssetResponseMessage | WriteFilesResultMessage;

/** Every message a webview may post to the extension. */
export type WebviewToExtensionMessage = ReadyMessage | WriteFilesMessage | ReadAssetRequestMessage;

/** The message of `TMessage` whose discriminator is `TMessageType`. */
export type MessageOfType<TMessage extends VsCodeBridgeMessage, TMessageType extends TMessage["messageType"]> = Extract<
  TMessage,
  { messageType: TMessageType }
>;

/**
 * One handler per message type of `TMessage`. The mapped type is exhaustive:
 * adding a message to the contract fails compilation until it gets a handler.
 */
export type MessageHandlers<TMessage extends VsCodeBridgeMessage> = {
  [TMessageType in TMessage["messageType"]]: (message: MessageOfType<TMessage, TMessageType>) => void | Promise<void>;
};

/** `true` when `value` has the shape of a bridge message (an object with a string `messageType`). */
export function isBridgeMessage(value: unknown): value is VsCodeBridgeMessage {
  return typeof value === "object" && value !== null && typeof (value as { messageType?: unknown }).messageType === "string";
}

/**
 * Routes `message` to the handler registered for its `messageType`.
 *
 * Values that are not bridge messages, or whose type has no handler, are
 * ignored. Resolves to `true` when a handler ran.
 */
export async function dispatchMessage<TMessage extends VsCodeBridgeMessage>(
  message: unknown,
  handlers: MessageHandlers<TMessage>
): Promise<boolean> {
  if (!isBridgeMessage(message) || !Object.prototype.hasOwnProperty.call(handlers, message.messageType)) {
    return false;
  }
  const handler = handlers[message.messageType as TMessage["messageType"]] as (message: TMessage) => void | Promise<void>;
  await handler(message as TMessage);
  return true;
}
