import type { MapTilesetMetadata } from 'src/extract-map-tileset/models/mapTilesetDefinition';

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── Common Helpers ──────────────────────────────────────────────────────────

export function buildHeader(name: string, mapWidth: number, mapHeight: number): string {
  return `; Map: ${name}  (${mapWidth} x ${mapHeight} tiles)`;
}

/** Returns total binary data size (in bytes) for map tile indices. */
export function calculateMapDataByteCount(params: MapCodeGeneratorParams): number {
  const { mapWidth, mapHeight } = params.metadata;
  return mapWidth * mapHeight;
}
