import { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import { TilesMapModel, TilesModel } from "src/shared/models/tilesDefinition";

// --- Public types -----------------------------------------------------------

/** Generated file entry for generators */
export type GeneratedFile = FileEntry;

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"mainTiles"`). */
  name: string;
  /** Full tiles model containing dimensions, names, bitmasks and count. */
  tiles: TilesModel;
}

// --- Strategy interface -----------------------------------------------------

/** Strategy that produces all output files from tile data. */
export interface CodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}

// --- Common Helpers ---------------------------------------------------------

/** Builds the serialisable `.cfg` model from tiles params. */
function buildTilesMap(params: TilesCodeGeneratorParams): TilesMapModel {
  const { tiles } = params;
  return {
    type: "tiles",
    tileWidth: tiles.tileWidth,
    tileHeight: tiles.tileHeight,
    excluded: tiles.excluded ? [...tiles.excluded] : [],
  };
}

/** Returns tile indices excluding those in `tiles.excludedSet`. */
export function getIncludedTileIndices(
  params: TilesCodeGeneratorParams,
): number[] {
  const { tiles } = params;
  const excludedSet = tiles.excludedSet ?? new Set<number>();
  return Array.from({ length: tiles.count }, (_, i) => i).filter(
    (i) => !excludedSet.has(i),
  );
}

/** Returns total binary data size (in bytes) for included tiles. */
export function calculateTilesDataByteCount(
  params: TilesCodeGeneratorParams,
  includedIndices: number[],
): number {
  const bytesPerTileRow = Math.ceil(params.tiles.tileWidth / 8);
  const bitmapBytesPerTile = bytesPerTileRow * params.tiles.tileHeight;
  const includedTileCount = includedIndices.length;
  const bitmapBytes = includedTileCount * bitmapBytesPerTile;
  const hasAttributes = Boolean(
    params.tiles.attributes && params.tiles.attributes.length > 0,
  );
  const attributeBytes = hasAttributes ? includedTileCount : 0;

  return bitmapBytes + attributeBytes;
}

/** Creates the `.cfg` {@link GeneratedFile} entry. */
export function buildMapFile(params: TilesCodeGeneratorParams): GeneratedFile {
  return {
    fileType: "map",
    fileName: `${params.name}.cfg`,
    content: JSON.stringify(buildTilesMap(params), null, 2),
  };
}

export function buildDataSizeComment(dataByteCount: number): string {
  return `; Data Size: ${dataByteCount} bytes`;
}
