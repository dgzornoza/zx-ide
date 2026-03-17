import { TilesModel } from "src/extract-tiles/models/tilesDefinition";
import { FileEntry } from "../../../../../shared/extract-graphics/extract-graphics-dtos";

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
export interface TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}
