/**
 * A single frame of a manually-created sprite.
 * Contains the pre-rendered bitmap (no source image coordinates).
 */
export interface CreateSpriteFrame {
  /** Row-major ink bitmap of length `width × height`. `true` = ink pixel. */
  inkBitmap: boolean[];
  /** Data-URL of the pixelated miniature preview (PNG). */
  preview: string;
}

/**
 * A sprite built manually via binary-text input.
 * Width and height are fixed by the first frame added.
 */
export interface CreateSpriteDefinition {
  /** Stable UUID used as `v-for` key. Not included in serialised output. */
  _id: string;
  name: string;
  /** Sprite width in pixels (fixed after first frame is added). */
  width: number;
  /** Sprite height in pixels (fixed after first frame is added). */
  height: number;
  frames: CreateSpriteFrame[];
}
