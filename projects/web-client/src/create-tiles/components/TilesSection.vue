<script setup lang="ts">
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import TileGallery from "src/shared/components/TileGallery.vue";

const tp = createTranslationPrefixFn("create-tiles");

defineProps<{
  previews: string[];
}>();

const emit = defineEmits<{
  removeTile: [index: number];
}>();
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

    <TileGallery
      :previews="previews"
      :action-tooltip="tp('tileRemoveTooltip')"
      @tile-action="emit('removeTile', $event)"
    />

    <p
      v-if="previews.length === 0"
      class="mt-4 text-xs text-[color:var(--ink-soft)]"
    >
      {{ tp("noTilesYet") }}
    </p>
  </section>
</template>
