export type VsCodeBridgeMessageType = "init" | "writeFiles" | "saveMap";

export type ProjectType = "sjasmplus" | "z88dk";

export interface VsCodeBridgeMessage {
  messageType: VsCodeBridgeMessageType;
}
