import type { ZxpColorAttribute } from "src/utils/image-utils";

/**
 * Serialisable tiles map model (persisted to `.tiles.map` file).
 * Backward-compatible: if `type` is absent it is treated as `"tiles"`.
 */
export interface TilesMapModel {
  type: "tiles";
  tileWidth: number;
  tileHeight: number;
  names: string[];
}

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
  /**
   * Per-tile decoded ZX Spectrum colour attributes.
   * Only present when the source was a ZX-Paintbrush `.zxp` file.
   * `attributes[i]` corresponds to `inkBitmaps[i]`.
   */
  attributes?: ZxpColorAttribute[];
}
