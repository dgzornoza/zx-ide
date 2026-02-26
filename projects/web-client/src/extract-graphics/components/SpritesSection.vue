<script setup lang="ts">
import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-helpers";
import SpriteItem from "./SpriteItem.vue";

const tp = createTranslationPrefixFn("extract-graphics");

defineProps<{
  sprites: SpriteDefinition[];
}>();

const emit = defineEmits<{
  "add-sprite": [];
  "remove-sprite": [index: number];
  "add-frame": [spriteIndex: number];
  "remove-frame": [spriteIndex: number, frameIndex: number];
}>();
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ tp("sectionSprites") }}
    </h2>
    <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
      {{ tp("spritesHint") }}
    </p>
    <div class="mt-4 w-1/2 space-y-3">
      <SpriteItem
        v-for="(sprite, index) in sprites"
        :key="sprite._id ?? `sprite-${index}`"
        :sprite="sprite"
        :sprite-index="index"
        @remove="emit('remove-sprite', index)"
        @add-frame="emit('add-frame', index)"
        @remove-frame="(frameIndex) => emit('remove-frame', index, frameIndex)"
      />
    </div>
    <button
      class="mt-4 inline-flex items-center gap-2 bg-[color:var(--button-secondary-bg)] px-4 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
      type="button"
      @click="emit('add-sprite')"
    >
      {{ tp("addSprite") }}
    </button>
  </section>
</template>
