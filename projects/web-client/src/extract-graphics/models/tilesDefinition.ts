/**
 * Tiles definition model.
 */
export interface TilesDefinitionModel {
  tileWidth: number;
  tileHeight: number;
  names: string[];
}

/**
 * Tiles model used in state.
 */
export interface TilesModel extends TilesDefinitionModel {
  count: number;
  previews: string[];
  /**
   * Per-tile pixel bitmask (not persisted to .map file).
   * `bitmasks[i]` is a boolean[] of length `tileWidth * tileHeight`, row-major.
   * `true` = ink pixel (dark), `false` = paper pixel (light).
   */
  bitmasks: boolean[][];
}
