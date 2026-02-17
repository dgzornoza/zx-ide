/**
 * message sent from the webview to the extension after validation,
 * ready to be used for attaching graphics.
 */
export interface CreateGraphicsMapMessage {
  messageType: "create";
  data: GraphicsMapPayload;
}

/**
 * Payload with data structure used for attaching graphics
 * (webview form data)
 */
export interface GraphicsMapPayload {
  source: string;
  graphicsData: string;
  tileDefinitions?: TileDefinition | null;
  spriteDefinitions?: SpriteDefinition[];
}

export interface SpriteFrame {
  column: number;
  row: number;
}

export interface SpriteDefinition {
  name: string;
  width: number;
  height: number;
  frames: SpriteFrame[];
}

export interface TileDefinition {
  count: number;
  names: string[];
}

export interface StatusMessage {
  ok: boolean;
  text: string;
}
