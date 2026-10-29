import {
  invalidConfiguration,
  isNonNegativeInteger,
  isPositiveInteger,
  isRecord,
  parseConfigurationObject,
} from 'src/domain/graphics-configuration/configuration-values';
import type { SpritesMapModel } from 'src/shared/models/spriteDefinition';

function isSpriteFrameBitmap(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.inkBitmap) &&
    value.inkBitmap.every((pixel) => typeof pixel === 'boolean') &&
    typeof value.preview === 'string'
  );
}

function isSpriteFrame(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.x) &&
    isNonNegativeInteger(value.y) &&
    (value.bitmap === undefined || isSpriteFrameBitmap(value.bitmap))
  );
}

function isSprite(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    isPositiveInteger(value.width) &&
    isPositiveInteger(value.height) &&
    Array.isArray(value.frames) &&
    value.frames.every(isSpriteFrame)
  );
}

/**
 * Validates the content of a sprites `.cfg` file ({@link SpritesMapModel}).
 * Throws `DomainError('errorMapLoadFailed')` when it is not a valid sprites configuration.
 */
export function parseSpritesConfiguration(content: string): SpritesMapModel {
  const configuration = parseConfigurationObject(content);
  const { type, spriteFlags, sprites } = configuration;

  if (type !== 'sprites' || (spriteFlags !== undefined && !isNonNegativeInteger(spriteFlags))) {
    throw invalidConfiguration();
  }
  if (!Array.isArray(sprites) || !sprites.every(isSprite)) {
    throw invalidConfiguration();
  }

  return configuration as unknown as SpritesMapModel;
}
