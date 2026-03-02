import type { SpriteDefinition } from "./spriteDefinition";

/**
 * Serialisable tiles map model (persisted to `.map` file).
 * Backward-compatible: if `type` is absent it is treated as `"tiles"`.
 */
export interface TilesMapModel {
  type: "tiles";
  tileWidth: number;
  tileHeight: number;
  names: string[];
}

/**
 * Serialisable sprites map model (persisted to `.map` file).
 */
export interface SpritesMapModel {
  type: "sprites";
  /** When true, 7 zero-bytes are prepended and 8 zero-bytes are appended to each sprite for SP1-style column shifting. */
  spriteSp1Padding?: boolean;
  sprites: Omit<SpriteDefinition, "_id">[];
}

/**
 * Union of all persisted `.map` file models.
 */
export type GraphicsMapModel = TilesMapModel | SpritesMapModel;

/**
 * Tiles model used in state (not persisted — includes runtime-only fields).
 */
export interface TilesModel extends TilesMapModel {
  count: number;
  previews: string[];
  /**
   * Per-tile pixel bitmask (not persisted to .map file).
   * `bitmasks[i]` is a boolean[] of length `tileWidth * tileHeight`, row-major.
   * `true` = ink pixel (dark), `false` = paper pixel (light).
   */
  bitmasks: boolean[][];
}
