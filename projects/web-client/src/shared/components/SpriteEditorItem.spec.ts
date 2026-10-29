// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { i18n } from 'src/i18n';
import type { SpriteDefinition } from 'src/shared/models/spriteDefinition';
import { describe, expect, it } from 'vitest';

import SpriteEditorItem from './SpriteEditorItem.vue';

function createSprite(): SpriteDefinition {
  return { _id: 'sprite-1', name: 'hero', width: 8, height: 8, frames: [{ x: 0, y: 0 }] };
}

function mountItem(sprite: SpriteDefinition) {
  return mount(SpriteEditorItem, {
    props: {
      sprite,
      spriteIndex: 0,
      sourceImage: undefined,
      showFrameCoords: true,
      translationNamespace: 'extract-sprites',
    },
    global: { plugins: [i18n] },
  });
}

describe('SpriteEditorItem', () => {
  it('emits update-sprite with the edited fields without mutating the sprite prop', async () => {
    const sprite = createSprite();
    const wrapper = mountItem(sprite);

    await wrapper.find('#sprite-name-0').setValue('enemy');
    await wrapper.find('#sprite-width-0').setValue('16');
    await wrapper.find('#sprite-height-0').setValue('24');

    expect(wrapper.emitted('update-sprite')).toEqual([[{ name: 'enemy' }], [{ width: 16 }], [{ height: 24 }]]);
    expect(sprite).toEqual(createSprite());
  });

  it('emits update-frame with the frame index and the edited coordinate without mutating the frame', async () => {
    const sprite = createSprite();
    const wrapper = mountItem(sprite);

    await wrapper.find('#frame-x-0-0').setValue('4');
    await wrapper.find('#frame-y-0-0').setValue('12');

    expect(wrapper.emitted('update-frame')).toEqual([
      [0, { x: 4 }],
      [0, { y: 12 }],
    ]);
    expect(sprite).toEqual(createSprite());
  });
});
