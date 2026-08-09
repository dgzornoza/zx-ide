import type { FileEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import type { MapTilesetMetadata } from "../../models/mapTilesetDefinition";

// ─── Public types ─────────────────────────────────────────────────────────────

/** Generated file entry — alias for FileEntry to match existing pattern. */
export type GeneratedFile = FileEntry;

/** Parameters for map tileset code-generation strategies. */
export interface MapCodeGeneratorParams {
  /** Filename without extension (e.g. `"playerMap"`). */
  name: string;
  /** Metadata extracted from the JSON source document. */
  metadata: MapTilesetMetadata;
  /** Normalised uint8 indices, row-major (0 = empty cell). */
  tileIndices: number[];
  /**
   * When `true`, the generator emits a single compressed blob instead of
   * the per-row `defb` directives.
   */
  compressed?: boolean;
}

// ─── Strategy interface ───────────────────────────────────────────────────────

/** Strategy that produces all output files from map index data. */
export interface CodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[];
}

// ─── Common Helpers ──────────────────────────────────────────────────────────

export function buildHeader(
  name: string,
  mapWidth: number,
  mapHeight: number,
): string {
  return `; Map: ${name}  (${mapWidth} x ${mapHeight} tiles)`;
}

/** Returns total binary data size (in bytes) for map tile indices. */
export function calculateMapDataByteCount(
  params: MapCodeGeneratorParams,
): number {
  const { mapWidth, mapHeight } = params.metadata;
  return mapWidth * mapHeight;
}

export function buildDataSizeComment(dataByteCount: number): string {
  return `; Data Size: ${dataByteCount} bytes`;
}
