<script setup lang="ts">
import { TilesModel } from "src/extract-graphics/models/tilesDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-helpers";

const tp = createTranslationPrefixFn("extract-graphics");

defineProps<{
  tiles: TilesModel;
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
        <label class="text-xs font-semibold">{{ tp("tileWidthLabel") }}</label>
        <input
          v-model.number="tileWidth"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          type="number"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold">{{ tp("tileHeightLabel") }}</label>
        <input
          v-model.number="tileHeight"
          class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          min="1"
          type="number"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold">{{ tp("tilesCountLabel") }}</label>
        <span
          class="inline-flex items-center border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
        >
          {{ tiles.count }}
        </span>
      </div>
    </div>

    <!-- tile previews + names (only show if tiles were extracted) -->
    <div v-if="tiles.count > 0" class="mt-4 flex flex-wrap gap-2">
      <div
        v-for="(_, index) in tiles.count"
        :key="`tile-name-${index}`"
        class="flex flex-col gap-1"
        style="width: 200px"
      >
        <!-- preview -->
        <img
          v-if="tiles.previews[index]"
          :src="tiles.previews[index]"
          class="border border-[color:var(--input-border)]"
          style="width: 40px; height: 40px; image-rendering: pixelated"
        />
        <div
          v-else
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)]"
          style="width: 40px; height: 40px"
        />
        <!-- name input -->
        <input
          v-model="tiles.names[index]"
          class="w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
        />
      </div>
    </div>
  </section>
</template>
