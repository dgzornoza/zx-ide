import type { GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';
import { TilesMapModel, TilesModel } from 'src/shared/models/tilesDefinition';

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParameters {
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

/** Builds the serialisable `.cfg` model from tiles parameters. */
function buildTilesMap(parameters: TilesCodeGeneratorParameters): TilesMapModel {
  const { tiles } = parameters;
  return {
    type: 'tiles',
    tileWidth: tiles.tileWidth,
    tileHeight: tiles.tileHeight,
    excluded: tiles.excluded ? [...tiles.excluded] : [],
  };
}

/** Returns tile indices excluding those in `tiles.excludedSet`. */
export function getIncludedTileIndices(parameters: TilesCodeGeneratorParameters): number[] {
  const { tiles } = parameters;
  const excludedSet = tiles.excludedSet ?? new Set<number>();
  return Array.from({ length: tiles.count }, (_, tileIndex) => tileIndex).filter((tileIndex) => !excludedSet.has(tileIndex));
}

/** Returns total binary data size (in bytes) for included tiles. */
export function calculateTilesDataByteCount(parameters: TilesCodeGeneratorParameters, includedIndices: number[]): number {
  return calculateTilesBitmapByteCount(parameters, includedIndices) + calculateTilesAttributeByteCount(parameters, includedIndices);
}

/**
 * Returns bitmap-only data size (in bytes) for included tiles. Each tile
 * occupies `ceil(tileWidth / 8) * tileHeight` bytes regardless of whether
 * attributes are present.
 */
export function calculateTilesBitmapByteCount(parameters: TilesCodeGeneratorParameters, includedIndices: number[]): number {
  const bytesPerTileRow = Math.ceil(parameters.tiles.tileWidth / 8);
  const bitmapBytesPerTile = bytesPerTileRow * parameters.tiles.tileHeight;
  return includedIndices.length * bitmapBytesPerTile;
}

/**
 * Returns attribute-only data size (in bytes) for included tiles. On the ZX
 * Spectrum each tile carries exactly one attribute byte, so the result is
 * either `includedTileCount` or `0` depending on whether the source carried
 * decoded attributes (ZX-Paintbrush `.zxp` sources only).
 */
export function calculateTilesAttributeByteCount(parameters: TilesCodeGeneratorParameters, includedIndices: number[]): number {
  const hasAttributes = Boolean(parameters.tiles.attributes && parameters.tiles.attributes.length > 0);
  return hasAttributes ? includedIndices.length : 0;
}

/** Creates the `.cfg` {@link GeneratedFile} entry. */
export function buildMapFile(parameters: TilesCodeGeneratorParameters): GeneratedFile {
  return {
    fileType: 'map',
    fileName: `${parameters.name}.cfg`,
    content: JSON.stringify(buildTilesMap(parameters), null, 2),
  };
}
