import type { ZxpColorAttribute } from "src/helpers/image-utils";

/**
 * Serialisable tiles map model (persisted to `.cfg` file).
 * Backward-compatible: if `type` is absent it is treated as `"tiles"`.
 * `excluded` is optional for backward-compatibility (absent = no exclusions).
 */
export interface TilesMapModel {
  type: "tiles";
  tileWidth: number;
  tileHeight: number;
  /** Indices of tiles excluded from code generation output. */
  excluded?: number[];
}

/**
 * Tiles model used in state (not persisted — includes runtime-only fields).
 */
export interface TilesModel extends TilesMapModel {
  count: number;
  /** Number of tile columns from the source file (used to build the exported tile sheet). */
  columns: number;
  previews: string[];
  /** Runtime set of excluded tile indices (mirrors `excluded` array). */
  excludedSet: Set<number>;
  /**
   * Per-tile pixel ink bitmap.
   * `inkBitmaps[i]` is a boolean[] of length `tileWidth * tileHeight`, row-major.
   * `true` = ink pixel (light), `false` = paper pixel (dark).
   */
  inkBitmaps: boolean[][];
  /**
   * Per-tile decoded ZX Spectrum colour attributes.
   * Only present when the source was a ZX-Paintbrush `.zxp` file.
   * `attributes[i]` corresponds to `inkBitmaps[i]`.
   */
  attributes?: ZxpColorAttribute[];
}
