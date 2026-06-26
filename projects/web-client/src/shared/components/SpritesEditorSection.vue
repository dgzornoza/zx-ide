<script setup lang="ts">
import { TypeEnumHelpers } from "src/helpers/type-utils";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import {
  SpriteDefinition,
  SpriteFlags,
} from "src/shared/models/spriteDefinition";
import { computed } from "vue";
import SpriteEditorItem from "./SpriteEditorItem.vue";

// `showFrameCoords` defaults to `true`. Using `withDefaults` keeps the prop
// strictly boolean (the template expression `showFrameCoords ?? true` does
// not coerce reliably in all Vue 3 template compiler paths).
const props = withDefaults(
  defineProps<{
    sprites: SpriteDefinition[];
    /**
     * Source image used to extract frame previews. Pass `null` for the
     * create-sprites flow, which uses the bitmap already attached to each frame.
     */
    sourceImage: File | null;
    /**
     * Whether the per-frame X/Y coordinate inputs are rendered. Defaults to
     * `true`. Pass `false` from create-sprites where coordinates are not used.
     */
    showFrameCoords?: boolean;
    /** Optional defaults applied when a new sprite is added via the section button. */
    newSpriteDefaults?: { width?: number; height?: number };
    /** i18n namespace used to look up labels (e.g. `extract-sprites`). */
    translationNamespace: string;
    /**
     * Index of the active sprite in the collection. Used by create-sprites to
     * highlight the card that will receive the next frame from the binary
     * input panel. Leave undefined for flows that do not have an active sprite.
     */
    activeSpriteIndex?: number;
  }>(),
  { showFrameCoords: true },
);

const spriteFlags = defineModel<number>("spriteFlags", {
  required: true,
});

const tp = createTranslationPrefixFn(props.translationNamespace);

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
      <SpriteEditorItem
        v-for="(sprite, index) in sprites"
        :key="sprite._id ?? `sprite-${index}`"
        :sprite="sprite"
        :sprite-index="index"
        :source-image="sourceImage"
        :show-frame-coords="showFrameCoords"
        :translation-namespace="translationNamespace"
        :is-active="
          activeSpriteIndex !== undefined && activeSpriteIndex === index
        "
        @remove="emit('remove-sprite', index)"
        @add-frame="emit('add-frame', index)"
        @remove-frame="
          (frameIndex) => emit('remove-frame', index, frameIndex)
        "
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