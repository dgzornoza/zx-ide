<script setup lang="ts">
import { parseIntegerInput, showInputValue } from 'src/helpers/integer-input';
import { createTranslationPrefixFn } from 'src/helpers/vue-utils';
import TileGallery from 'src/shared/components/TileGallery.vue';
import { TilesModel } from 'src/shared/models/tilesDefinition';

const translate = createTranslationPrefixFn('extract-tiles');

defineProps<{
  tiles: TilesModel;
}>();

const emit = defineEmits<{
  toggleTileExclusion: [tileIndex: number];
}>();

const tileWidth = defineModel<number>('tileWidth', { required: true });
const tileHeight = defineModel<number>('tileHeight', { required: true });

// tile sizes are integers of at least 1; text that is not a number yet keeps the last size
const TILE_SIZE_MINIMUM = 1;

const updateTileSize = (event: Event, setTileSize: (value: number) => void) => {
  const value = parseIntegerInput((event.target as HTMLInputElement).value, TILE_SIZE_MINIMUM);
  if (value !== undefined) setTileSize(value);
};
</script>

<template>
  <section class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4">
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ translate('sectionTiles') }}
    </h2>
    <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
      {{ translate('tilesHint') }}
    </p>

    <!-- tile size inputs + count indicator -->
    <div class="mt-4 flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tileWidth">{{ translate('tileWidthLabel') }}</label>
        <input
          id="tileWidth"
          :value="tileWidth"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          step="1"
          type="number"
          @input="updateTileSize($event, (value) => (tileWidth = value))"
          @change="showInputValue($event, tileWidth)"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tileHeight">{{ translate('tileHeightLabel') }}</label>
        <input
          id="tileHeight"
          :value="tileHeight"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          step="1"
          type="number"
          @input="updateTileSize($event, (value) => (tileHeight = value))"
          @change="showInputValue($event, tileHeight)"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tilesCount">{{ translate('tilesCountLabel') }}</label>
        <span
          id="tilesCount"
          class="inline-flex items-center border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
        >
          {{ tiles.count }}
        </span>
      </div>
    </div>

    <!-- tile previews (only show if tiles were extracted) -->
    <TileGallery
      v-if="tiles.count > 0"
      :previews="tiles.previews"
      :excluded-indices="tiles.excludedSet"
      :action-tooltip="translate('tileExcludeTooltip')"
      :undo-tooltip="translate('tileIncludeTooltip')"
      @tile-action="emit('toggleTileExclusion', $event)"
    />
  </section>
</template>
