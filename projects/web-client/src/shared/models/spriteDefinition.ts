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

/**
 * Row-major ink bitmap plus pixelated preview associated with a
 * {@link SpriteFrame} authored manually from the binary input panel
 * (create-sprites flow). Absent on frames produced by extract-sprites,
 * whose pixel data is recomputed from the source image and the
 * {@link SpriteFrame.x} / {@link SpriteFrame.y} coordinates.
 */
export interface SpriteFrameBitmap {
  /** Row-major ink bitmap of length `width × height`. `true` = ink pixel. */
  inkBitmap: boolean[];
  /** Data-URL of the pixelated miniature preview (PNG). */
  preview: string;
}

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
  /**
   * Optional bitmap payload. Populated only by the create-sprites flow when
   * the user authors a frame from the binary input panel; left undefined for
   * frames produced by extract-sprites, which store pixel coordinates instead.
   */
  bitmap?: SpriteFrameBitmap;
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