/**
 * Content structure of the .map.json file written to the workspace.
 */
// export interface GraphicsMapData {
//   /** Path to the source image file. */
//   imageSourcePath: string;
//   /** Path to the target graphics (source code) data file. */
//   graphicsTargetData: string;
//   /* Tile definitions (only ). */
//   tiles?: TileDefinition;
//   /* Sprite definitions, if type is "sprites". */
//   sprites?: SpriteDefinition[];
// }

export type StatusMessageType = "success" | "error";

export interface StatusMessage {
  type: StatusMessageType;
  text: string;
}
