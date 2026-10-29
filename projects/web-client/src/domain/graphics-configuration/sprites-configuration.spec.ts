import { describe, expect, it } from 'vitest';
import { DomainError } from 'src/domain/domain-error';
import { parseSpritesConfiguration } from 'src/domain/graphics-configuration/sprites-configuration';

const validConfiguration = {
  type: 'sprites',
  spriteFlags: 3,
  sprites: [
    { name: 'player', width: 16, height: 16, frames: [{ x: 0, y: 0 }] },
    {
      name: 'enemy',
      width: 8,
      height: 8,
      frames: [{ x: 16, y: 0, bitmap: { inkBitmap: [true, false], preview: 'data:image/png;base64,AAAA' } }],
    },
  ],
};

describe('parseSpritesConfiguration', () => {
  it('reads a sprites configuration', () => {
    expect(parseSpritesConfiguration(JSON.stringify(validConfiguration))).toEqual(validConfiguration);
  });

  it('accepts a configuration without sprite flags', () => {
    const { spriteFlags: _spriteFlags, ...withoutFlags } = validConfiguration;

    expect(parseSpritesConfiguration(JSON.stringify(withoutFlags))).toEqual(withoutFlags);
  });

  const withSprite = (sprite: unknown) => JSON.stringify({ type: 'sprites', sprites: [sprite] });

  it.each([
    ['invalid JSON', '{ not-json'],
    ['null', 'null'],
    ['a tiles configuration', JSON.stringify({ type: 'tiles', tileWidth: 8, tileHeight: 8 })],
    ['a missing sprite list', JSON.stringify({ type: 'sprites' })],
    ['sprite flags that are not a non-negative integer', JSON.stringify({ type: 'sprites', spriteFlags: 'x', sprites: [] })],
    ['a sprite without name', withSprite({ width: 8, height: 8, frames: [] })],
    ['a sprite with a zero width', withSprite({ name: 'a', width: 0, height: 8, frames: [] })],
    ['a sprite without frames', withSprite({ name: 'a', width: 8, height: 8 })],
    ['a frame with a negative coordinate', withSprite({ name: 'a', width: 8, height: 8, frames: [{ x: -1, y: 0 }] })],
    [
      'a frame with an invalid bitmap',
      withSprite({ name: 'a', width: 8, height: 8, frames: [{ x: 0, y: 0, bitmap: { inkBitmap: 'x', preview: '' } }] }),
    ],
  ])('rejects %s with errorMapLoadFailed', (_case, content) => {
    expect(() => parseSpritesConfiguration(content)).toThrow(DomainError);
    expect(() => parseSpritesConfiguration(content)).toThrow('errorMapLoadFailed');
  });
});
