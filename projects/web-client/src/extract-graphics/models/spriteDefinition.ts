export interface SpriteDefinition {
  /** Internal runtime ID used as a stable v-for key. Not included in serialized output. */
  _id?: string;
  name: string;
  /** Sprite width in pixels. */
  width: number;
  /** Sprite height in pixels. */
  height: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  /** X pixel coordinate (0-based) of the top-left corner in the source image. */
  x: number;
  /** Y pixel coordinate (0-based) of the top-left corner in the source image. */
  y: number;
}
