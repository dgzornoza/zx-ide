<script setup lang="ts">
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import SpriteAnimationPanel from "src/shared/components/SpriteAnimationPanel.vue";
import SpriteFrameThumbnail from "src/shared/components/SpriteFrameThumbnail.vue";
import { useSpriteAnimation } from "src/shared/composables/useSpriteAnimation";
import { CreateSpriteDefinition } from "src/shared/models/createSpriteDefinition";

const tp = createTranslationPrefixFn("create-sprites");

const props = defineProps<{
  sprite: CreateSpriteDefinition;
  spriteIndex: number;
}>();

const emit = defineEmits<{
  remove: [];
  "remove-frame": [frameIndex: number];
}>();

// ─── Animation ────────────────────────────────────────────────────────────────

const { currentFrameIndex, isPlaying, play, stop } = useSpriteAnimation(
  () => props.sprite.frames.length,
);
</script>

<template>
  <div
    class="border border-[color:var(--border)] bg-[color:var(--surface)] p-3 overflow-x-auto"
  >
    <!-- Header: name | width | height | remove button | animation panel -->
    <div
      class="grid items-end gap-x-4 gap-y-3"
      style="grid-template-columns: 1.4fr 0.2fr 0.2fr auto 10rem"
    >
      <!-- col1: Name -->
      <div class="flex flex-col gap-1">
        <label
          :for="`sprite-name-${spriteIndex}`"
          class="text-xs font-semibold"
        >
          {{ tp("spriteNameLabel") }}
        </label>
        <input
          :id="`sprite-name-${spriteIndex}`"
          v-model="sprite.name"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
        />
      </div>

      <!-- col2: Width (read-only after first frame) -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold">{{ tp("spriteWidthLabel") }}</span>
        <span
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
        >
          {{ sprite.width > 0 ? sprite.width : "—" }}
        </span>
      </div>

      <!-- col3: Height (read-only after first frame) -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold">{{ tp("spriteHeightLabel") }}</span>
        <span
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
        >
          {{ sprite.height > 0 ? sprite.height : "—" }}
        </span>
      </div>

      <!-- col4: Remove sprite -->
      <button
        class="h-[34px] bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
        type="button"
        @click="emit('remove')"
      >
        {{ tp("remove") }}
      </button>

      <!-- col5: Animation panel -->
      <SpriteAnimationPanel
        :preview-src="sprite.frames[currentFrameIndex]?.preview"
        :frame-count="sprite.frames.length"
        :current-frame-index="currentFrameIndex"
        :is-playing="isPlaying"
        :play-title="tp('playAnimation')"
        :stop-title="tp('stopAnimation')"
        @play="play"
        @stop="stop"
      />

      <!-- Frame rows -->
      <template
        v-for="(frame, frameIndex) in sprite.frames"
        :key="`sprite-${spriteIndex}-frame-${frameIndex}`"
      >
        <!-- col1: Frame label -->
        <div
          class="self-start pr-2 text-right text-xs font-bold text-[color:var(--ink-soft)]"
        >
          {{ tp("frameLabel") }} {{ frameIndex + 1 }}
        </div>

        <!-- col2 + col3: empty spacers -->
        <div />
        <div />

        <!-- col4: Remove frame -->
        <button
          class="h-[34px] bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
          type="button"
          @click="emit('remove-frame', frameIndex)"
        >
          {{ tp("remove") }}
        </button>

        <!-- col5: Frame thumbnail -->
        <SpriteFrameThumbnail
          :src="frame.preview"
          :alt="`Frame ${frameIndex + 1}`"
          :is-active="isPlaying && currentFrameIndex === frameIndex"
        />
      </template>
    </div>
  </div>
</template>
