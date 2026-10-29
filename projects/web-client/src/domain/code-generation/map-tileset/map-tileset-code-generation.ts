import type { MapTilesetMetadata } from 'src/extract-map-tileset/models/mapTilesetDefinition';

/** Parameters for map tileset code-generation strategies. */
export interface MapCodeGeneratorParameters {
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

export function buildHeader(name: string, mapWidth: number, mapHeight: number): string {
  return `; Map: ${name}  (${mapWidth} x ${mapHeight} tiles)`;
}

/** Returns total binary data size (in bytes) for map tile indices. */
export function calculateMapDataByteCount(parameters: MapCodeGeneratorParameters): number {
  const { mapWidth, mapHeight } = parameters.metadata;
  return mapWidth * mapHeight;
}
