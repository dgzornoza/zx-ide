import { TypeEnumFlagValue } from "src/helpers/type-utils";

/**
 * Bit-flag options that can be combined with the bitwise OR operator.
 *
 * ```ts
 * const flags = SpriteFlags.Sp1Padding | SpriteFlags.UseMask;
 * ```
 */
export const SpriteFlags = {
  /** No options selected. */
  None: 0,
  /** Adds 7 zero-bytes before and 8 zero-bytes after each sprite column (SP1 library). */
  Sp1Padding: 1,
  /** Each sprite frame includes a mask plane interleaved with the pixel data. */
  UseMask: 2,
} as const;

/** Union type of all valid {@link SpriteFlags} values. */
export type SpriteFlagValue = TypeEnumFlagValue<typeof SpriteFlags>;

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
  sprites: Omit<SpriteDefinition, "_id">[];
}
