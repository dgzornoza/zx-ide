<script setup lang="ts">
import { TilesModel } from "src/extract-tiles/models/tilesDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-utils";

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
    <div v-if="tiles.count > 0" class="mt-4 flex flex-wrap gap-2">
      <div
        v-for="(_, index) in tiles.count"
        :key="`tile-${index}`"
        class="relative"
        style="width: 40px; height: 40px"
      >
        <img
          v-if="tiles.previews[index]"
          :src="tiles.previews[index]"
          :alt="`Tile ${index} preview`"
          class="border border-[color:var(--input-border)]"
          :class="{ 'opacity-30': tiles.excludedSet.has(index) }"
          style="width: 40px; height: 40px; image-rendering: pixelated"
        />
        <div
          v-else
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)]"
          :class="{ 'opacity-30': tiles.excludedSet.has(index) }"
          style="width: 40px; height: 40px"
        />
        <!-- exclusion overlay icon -->
        <div
          v-if="tiles.excludedSet.has(index)"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span class="text-lg font-bold text-[color:var(--error-ink)]"
            >✕</span
          >
        </div>
        <!-- toggle button -->
        <button
          class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border text-xs font-bold leading-none"
          :class="
            tiles.excludedSet.has(index)
              ? 'border-[color:var(--error-ink)] bg-[color:var(--card)] text-[color:var(--error-ink)]'
              : 'border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--ink-soft)] hover:border-[color:var(--error-ink)] hover:text-[color:var(--error-ink)]'
          "
          :title="
            tiles.excludedSet.has(index)
              ? tp('tileIncludeTooltip')
              : tp('tileExcludeTooltip')
          "
          type="button"
          @click="emit('toggleTileExclusion', index)"
        >
          {{ tiles.excludedSet.has(index) ? "+" : "−" }}
        </button>
      </div>
    </div>
  </section>
</template>
