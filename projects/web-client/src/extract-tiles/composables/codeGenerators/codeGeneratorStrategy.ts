import { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import {
  TilesMapModel,
  TilesModel,
} from "src/extract-tiles/models/tilesDefinition";

// ─── Public types ─────────────────────────────────────────────────────────────

/** Generated file entry for generators */
export type GeneratedFile = FileEntry;

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"mainTiles"`). */
  name: string;
  /** Full tiles model containing dimensions, names, bitmasks and count. */
  tiles: TilesModel;
}

// ─── Strategy interface ───────────────────────────────────────────────────────

/** Strategy that produces all output files (map + source) from tile data. */
export interface CodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}

// ─── Common Utils ───────────────────────────────────────────────────────

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

/** Creates the `.cfg` {@link GeneratedFile} entry. */
export function buildMapFile(params: TilesCodeGeneratorParams): GeneratedFile {
  return {
    fileType: "map",
    fileName: `${params.name}.cfg`,
    content: JSON.stringify(buildTilesMap(params), null, 2),
  };
}
