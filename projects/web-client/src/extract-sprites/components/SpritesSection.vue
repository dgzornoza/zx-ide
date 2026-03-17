<script setup lang="ts">
import {
  SpriteDefinition,
  SpriteFlags,
} from "src/extract-sprites/models/spriteDefinition";
import { TypeEnumHelpers } from "src/utils/type-utils";
import { createTranslationPrefixFn } from "src/utils/vue-utils";
import { computed } from "vue";
import SpriteItemDefinition from "./SpriteItemDefinition.vue";

const tp = createTranslationPrefixFn("extract-sprites");

defineProps<{
  sprites: SpriteDefinition[];
  sourceImage: File | null;
}>();

const spriteFlags = defineModel<number>("spriteFlags", {
  required: true,
});

/**
 * Checkbox active-state for each sprite flag.
 * Each property maps to a {@link SpriteFlags} bit.
 */
interface ISpriteCheckBoxState {
  sp1Padding: boolean;
  useMask: boolean;
}

/** Whether the SP1 padding flag is active. */
const sp1Padding = computed<ISpriteCheckBoxState["sp1Padding"]>({
  get: () => TypeEnumHelpers.hasFlag(SpriteFlags.Sp1Padding, spriteFlags.value),
  set: (newValue) => {
    spriteFlags.value = TypeEnumHelpers.setFlag(
      SpriteFlags.Sp1Padding,
      spriteFlags.value,
      newValue,
    );
  },
});

/** Whether the use-mask flag is active. */
const useMask = computed<ISpriteCheckBoxState["useMask"]>({
  get: () => TypeEnumHelpers.hasFlag(SpriteFlags.UseMask, spriteFlags.value),
  set: (newValue) => {
    spriteFlags.value = TypeEnumHelpers.setFlag(
      SpriteFlags.UseMask,
      spriteFlags.value,
      newValue,
    );
  },
});

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

    <!-- Sprite flags -->
    <div class="mt-4 flex flex-wrap gap-4">
      <label
        class="inline-flex cursor-pointer items-center gap-2 text-xs"
        :title="tp('spriteSp1PaddingTooltip')"
      >
        <input
          v-model="sp1Padding"
          type="checkbox"
          class="accent-[color:var(--button-bg)]"
        />
        <span class="select-none">{{ tp("spriteSp1PaddingLabel") }}</span>
      </label>
      <label
        class="inline-flex cursor-pointer items-center gap-2 text-xs"
        :title="tp('spriteUseMaskTooltip')"
      >
        <input
          v-model="useMask"
          type="checkbox"
          class="accent-[color:var(--button-bg)]"
        />
        <span class="select-none">{{ tp("spriteUseMaskLabel") }}</span>
      </label>
    </div>

    <div class="mt-4 space-y-3">
      <SpriteItemDefinition
        v-for="(sprite, index) in sprites"
        :key="sprite._id ?? `sprite-${index}`"
        :sprite="sprite"
        :sprite-index="index"
        :source-image="sourceImage"
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
