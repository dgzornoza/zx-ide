import type { GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import { TilesMapModel, TilesModel } from 'src/shared/models/tilesDefinition';

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"mainTiles"`). */
  name: string;
  /** Full tiles model containing dimensions, names, bitmasks and count. */
  tiles: TilesModel;
  /**
   * When `true` and the language is C, the generator emits a single
   * compressed blob instead of per-tile labels.
   */
  compressed?: boolean;
}

/** Builds the serialisable `.cfg` model from tiles params. */
function buildTilesMap(params: TilesCodeGeneratorParams): TilesMapModel {
  const { tiles } = params;
  return {
    type: 'tiles',
    tileWidth: tiles.tileWidth,
    tileHeight: tiles.tileHeight,
    excluded: tiles.excluded ? [...tiles.excluded] : [],
  };
}

/** Returns tile indices excluding those in `tiles.excludedSet`. */
export function getIncludedTileIndices(params: TilesCodeGeneratorParams): number[] {
  const { tiles } = params;
  const excludedSet = tiles.excludedSet ?? new Set<number>();
  return Array.from({ length: tiles.count }, (_, i) => i).filter((i) => !excludedSet.has(i));
}

/** Returns total binary data size (in bytes) for included tiles. */
export function calculateTilesDataByteCount(params: TilesCodeGeneratorParams, includedIndices: number[]): number {
  return calculateTilesBitmapByteCount(params, includedIndices) + calculateTilesAttributeByteCount(params, includedIndices);
}

/**
 * Returns bitmap-only data size (in bytes) for included tiles. Each tile
 * occupies `ceil(tileWidth / 8) * tileHeight` bytes regardless of whether
 * attributes are present.
 */
export function calculateTilesBitmapByteCount(params: TilesCodeGeneratorParams, includedIndices: number[]): number {
  const bytesPerTileRow = Math.ceil(params.tiles.tileWidth / 8);
  const bitmapBytesPerTile = bytesPerTileRow * params.tiles.tileHeight;
  return includedIndices.length * bitmapBytesPerTile;
}

/**
 * Returns attribute-only data size (in bytes) for included tiles. On the ZX
 * Spectrum each tile carries exactly one attribute byte, so the result is
 * either `includedTileCount` or `0` depending on whether the source carried
 * decoded attributes (ZX-Paintbrush `.zxp` sources only).
 */
export function calculateTilesAttributeByteCount(params: TilesCodeGeneratorParams, includedIndices: number[]): number {
  const hasAttributes = Boolean(params.tiles.attributes && params.tiles.attributes.length > 0);
  return hasAttributes ? includedIndices.length : 0;
}

/** Creates the `.cfg` {@link GeneratedFile} entry. */
export function buildMapFile(params: TilesCodeGeneratorParams): GeneratedFile {
  return {
    fileType: 'map',
    fileName: `${params.name}.cfg`,
    content: JSON.stringify(buildTilesMap(params), null, 2),
  };
}
