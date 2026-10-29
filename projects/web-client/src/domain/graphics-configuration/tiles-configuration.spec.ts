import { describe, expect, it } from 'vitest';
import { DomainError } from 'src/domain/domain-error';
import { parseTilesConfiguration } from 'src/domain/graphics-configuration/tiles-configuration';

describe('parseTilesConfiguration', () => {
  it('reads a tiles configuration', () => {
    const content = JSON.stringify({ type: 'tiles', tileWidth: 16, tileHeight: 8, excluded: [0, 3] });

    expect(parseTilesConfiguration(content)).toEqual({ tileWidth: 16, tileHeight: 8, excluded: [0, 3] });
  });

  it('accepts legacy files without type, tile size or excluded list', () => {
    expect(parseTilesConfiguration('{}')).toEqual({ tileWidth: undefined, tileHeight: undefined, excluded: [] });
  });

  it.each([
    ['invalid JSON', '{ not-json'],
    ['a value that is not an object', '[1, 2]'],
    ['null', 'null'],
    ['a sprites configuration', JSON.stringify({ type: 'sprites', sprites: [] })],
    ['an unknown type', JSON.stringify({ type: 'map' })],
    ['a tile width that is not a positive integer', JSON.stringify({ tileWidth: '8' })],
    ['a zero tile height', JSON.stringify({ tileHeight: 0 })],
    ['an excluded list that is not an array', JSON.stringify({ excluded: '1,2' })],
    ['an excluded index that is not a non-negative integer', JSON.stringify({ excluded: [1, -2] })],
  ])('rejects %s with errorMapLoadFailed', (_case, content) => {
    expect(() => parseTilesConfiguration(content)).toThrow(DomainError);
    expect(() => parseTilesConfiguration(content)).toThrow('errorMapLoadFailed');
  });
});
