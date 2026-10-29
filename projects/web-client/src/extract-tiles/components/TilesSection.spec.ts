// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { i18n } from 'src/i18n';
import type { TilesModel } from 'src/shared/models/tilesDefinition';
import { describe, expect, it } from 'vitest';

import TilesSection from './TilesSection.vue';

function createTiles(): TilesModel {
  return {
    type: 'tiles',
    tileWidth: 8,
    tileHeight: 8,
    excluded: [],
    count: 0,
    columns: 0,
    previews: [],
    excludedSet: new Set<number>(),
    inkBitmaps: [],
  };
}

function mountSection() {
  return mount(TilesSection, {
    props: { tiles: createTiles(), tileWidth: 8, tileHeight: 8 },
    global: { plugins: [i18n] },
  });
}

describe('TilesSection', () => {
  it('updates the tile size with integers of at least 1', async () => {
    const wrapper = mountSection();

    await wrapper.find('#tileWidth').setValue('16');
    await wrapper.find('#tileWidth').setValue('0');
    await wrapper.find('#tileHeight').setValue('9.6');

    expect(wrapper.emitted('update:tileWidth')).toEqual([[16], [1]]);
    expect(wrapper.emitted('update:tileHeight')).toEqual([[10]]);
  });

  it('keeps the last valid size when the field is emptied and shows it again when the field is left', async () => {
    const wrapper = mountSection();
    const widthInput = wrapper.find('#tileWidth');

    await widthInput.setValue('');
    expect(wrapper.emitted('update:tileWidth')).toBeUndefined();

    await widthInput.trigger('change');
    expect((widthInput.element as HTMLInputElement).value).toBe('8');
  });
});
