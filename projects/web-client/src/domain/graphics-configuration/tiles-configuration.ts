import {
  invalidConfiguration,
  isNonNegativeInteger,
  isPositiveInteger,
  parseConfigurationObject,
} from 'src/domain/graphics-configuration/configuration-values';

/** Tiles configuration read from a `.cfg` file; a missing tile size keeps the current one. */
export interface TilesConfiguration {
  tileWidth: number | undefined;
  tileHeight: number | undefined;
  excluded: number[];
}

/**
 * Validates the content of a tiles `.cfg` file (`TilesMapModel` in `src/shared/models/tilesDefinition.ts`).
 * Files without `type`, tile size or `excluded` are accepted for backward compatibility.
 * Throws `DomainError('errorMapLoadFailed')` for anything else.
 */
export function parseTilesConfiguration(content: string): TilesConfiguration {
  const configuration = parseConfigurationObject(content);
  const { type, tileWidth, tileHeight, excluded } = configuration;

  if (type !== undefined && type !== 'tiles') {
    throw invalidConfiguration();
  }
  if ((tileWidth !== undefined && !isPositiveInteger(tileWidth)) || (tileHeight !== undefined && !isPositiveInteger(tileHeight))) {
    throw invalidConfiguration();
  }
  if (excluded !== undefined && !(Array.isArray(excluded) && excluded.every(isNonNegativeInteger))) {
    throw invalidConfiguration();
  }

  return {
    tileWidth: tileWidth as number | undefined,
    tileHeight: tileHeight as number | undefined,
    excluded: (excluded as number[] | undefined) ?? [],
  };
}
