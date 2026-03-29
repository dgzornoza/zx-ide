import type { SpriteDefinition } from "./spriteDefinition";

/**
 * Serialisable sprites map model (persisted to `.cfg` file).
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
