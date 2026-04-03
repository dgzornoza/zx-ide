import type { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import type { TmxMapMetadata } from "../../models/mapTilesetDefinition";

/** Generated file entry — alias for FileEntry to match existing pattern. */
export type GeneratedFile = FileEntry;

/** Parameters for map tileset code-generation strategies. */
export interface MapCodeGeneratorParams {
  /** Filename without extension (e.g. `"playerMap"`). */
  name: string;
  /** Metadata extracted from the TMX document. */
  metadata: TmxMapMetadata;
  /** Normalised uint8 indices, row-major (0 = empty cell). */
  tileIndices: number[];
}

/** Strategy that produces all output files from map index data. */
export interface IMapCodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[];
}
