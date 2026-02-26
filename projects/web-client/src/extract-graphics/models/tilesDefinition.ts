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
}
