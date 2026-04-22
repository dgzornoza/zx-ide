<script setup lang="ts">
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import TileGallery from "src/shared/components/TileGallery.vue";
import { TilesModel } from "src/shared/models/tilesDefinition";

const tp = createTranslationPrefixFn("extract-tiles");

defineProps<{
  tiles: TilesModel;
}>();

const emit = defineEmits<{
  toggleTileExclusion: [tileIndex: number];
}>();

const tileWidth = defineModel<number>("tileWidth", { required: true });
const tileHeight = defineModel<number>("tileHeight", { required: true });
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ tp("sectionTiles") }}
    </h2>
    <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
      {{ tp("tilesHint") }}
    </p>

    <!-- tile size inputs + count indicator -->
    <div class="mt-4 flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tileWidth">{{
          tp("tileWidthLabel")
        }}</label>
        <input
          id="tileWidth"
          v-model.number="tileWidth"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          type="number"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tileHeight">{{
          tp("tileHeightLabel")
        }}</label>
        <input
          id="tileHeight"
          v-model.number="tileHeight"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          type="number"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold" for="tilesCount">{{
          tp("tilesCountLabel")
        }}</label>
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
      :action-tooltip="tp('tileExcludeTooltip')"
      :undo-tooltip="tp('tileIncludeTooltip')"
      @tile-action="emit('toggleTileExclusion', $event)"
    />
  </section>
</template>
