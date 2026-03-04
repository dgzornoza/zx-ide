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
  /**
   * Numeric combination of {@link SpriteFlags} bits.
   * Omitted (or `0`) means no flags are set.
   */
  spriteFlags?: number;
  /** @legacy Read-only: kept for loading old `.map` files that used `spriteSp1Padding`. Use `spriteFlags` for all new writes. */
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
   * Per-tile pixel ink bitmap.
   * `inkBitmaps[i]` is a boolean[] of length `tileWidth * tileHeight`, row-major.
   * `true` = ink pixel (light), `false` = paper pixel (dark).
   */
  inkBitmaps: boolean[][];
}
