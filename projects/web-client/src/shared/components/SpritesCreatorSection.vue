<script setup lang="ts">
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { CreateSpriteDefinition } from "src/shared/models/createSpriteDefinition";
import SpriteCreatorItem from "./SpriteCreatorItem.vue";

const tp = createTranslationPrefixFn("create-sprites");

defineProps<{
  sprites: CreateSpriteDefinition[];
}>();

const emit = defineEmits<{
  "add-sprite": [];
  "remove-sprite": [spriteIndex: number];
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

    <div class="mt-4 space-y-3">
      <SpriteCreatorItem
        v-for="(sprite, spriteIndex) in sprites"
        :key="sprite._id"
        :sprite="sprite"
        :sprite-index="spriteIndex"
        @remove="emit('remove-sprite', spriteIndex)"
        @remove-frame="
          (frameIndex) => emit('remove-frame', spriteIndex, frameIndex)
        "
      />
    </div>

    <button
      class="mt-4 inline-flex items-center gap-2 border border-[color:var(--border)] bg-[color:var(--button-secondary-bg)] px-4 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
      type="button"
      @click="emit('add-sprite')"
    >
      {{ tp("addSprite") }}
    </button>
  </section>
</template>
