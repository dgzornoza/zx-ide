import { describe, expect, it } from 'vitest';

import { i18n } from './i18n';

type MessageTree = { [key: string]: string | MessageTree };

function keyPaths(tree: MessageTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keyPaths(value, `${prefix}${key}.`)
  );
}

describe('i18n messages', () => {
  it('defines the same keys in English and Spanish', () => {
    const englishKeys = keyPaths(i18n.global.getLocaleMessage('en') as MessageTree).sort();
    const spanishKeys = keyPaths(i18n.global.getLocaleMessage('es') as MessageTree).sort();

    expect(spanishKeys).toEqual(englishKeys);
  });

  it.each([
    'extract-tiles.resultsSectionTitle',
    'extract-tiles.totalTiles',
    'extract-tiles.memoryBitmap',
    'extract-tiles.memoryAttributes',
    'extract-tiles.errorSourceFileLoad',
    'extract-tiles.errorAssetRequestTimeout',
    'extract-tiles.errorAssetRequestCancelled',
    'extract-sprites.errorAssetRequestTimeout',
    'extract-sprites.errorAssetRequestCancelled',
    'extract-map-tileset.errorLayerDataLengthMismatch',
  ])('defines %s, a key the pages use', (key) => {
    expect(i18n.global.te(key, 'en')).toBe(true);
  });
});
