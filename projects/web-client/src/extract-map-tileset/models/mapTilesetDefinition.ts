/** Normalized map metadata used for code generation and preview rendering. */
export interface MapTilesetMetadata {
  /** Map width in tiles (from the selected layer). */
  mapWidth: number;
  /** Map height in tiles (from the selected layer). */
  mapHeight: number;
  /** Width of each tile in pixels. */
  tileWidth: number;
  /** Height of each tile in pixels. */
  tileHeight: number;
  /** Tileset name derived from the source image filename. */
  tilesetName: string;
  /** Total number of tiles in the tileset. Maximum 255; values above throw an error. */
  tileCount: number;
  /** Number of tileset columns (used to compute tile position in the PNG). */
  columns: number;
  /** Relative path of the tileset source image. */
  sourceImage: string;
}

export interface TiledJsonTileset {
  image: string;
  tileWidth: number;
  tileHeight: number;
  tileCount: number;
  columns: number;
}

export interface TiledJsonLayer {
  name: string;
  width: number;
  height: number;
  data: number[];
}

export interface TiledJsonMapSource {
  tileset: TiledJsonTileset;
  layers: TiledJsonLayer[];
}
