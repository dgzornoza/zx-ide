<script setup lang="ts">
import { extractSpriteFramePreview } from "src/helpers/image-utils";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { SpriteDefinition } from "src/shared/models/spriteDefinition";
import SpriteAnimationPanel from "src/shared/components/SpriteAnimationPanel.vue";
import SpriteFrameThumbnail from "src/shared/components/SpriteFrameThumbnail.vue";
import { useSpriteAnimation } from "src/shared/composables/useSpriteAnimation";
import { onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  sprite: SpriteDefinition;
  spriteIndex: number;
  /**
   * Source image used to extract frame previews. When `null`, the component
   * falls back to the pre-computed bitmap stored on each frame (create-sprites).
   */
  sourceImage: File | null;
  /**
   * Whether the per-frame X/Y coordinate inputs are rendered. When `false`
   * (create-sprites), the X/Y columns are replaced by empty placeholder
   * cells so the grid stays aligned.
   */
  showFrameCoords: boolean;
  /** i18n namespace used to look up labels (e.g. `extract-sprites`). */
  translationNamespace: string;
  /** Highlights this card as the active sprite (used by create-sprites). */
  isActive?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
  "add-frame": [];
  "remove-frame": [frameIndex: number];
}>();

const tp = createTranslationPrefixFn(props.translationNamespace);

// ─── Frame preview thumbnails ─────────────────────────────────────────────

const framePreviews = ref<string[]>([]);
let updateTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Rebuilds the previews array. When a source image is available, the preview
 * is extracted asynchronously from the image at the frame's coordinates. When
 * no source image is set (create-sprites), the pre-rendered bitmap preview
 * attached to the frame is used directly.
 */
const updatePreviews = async () => {
  const frames = props.sprite.frames;

  if (props.sourceImage) {
    framePreviews.value = await Promise.all(
      frames.map((frame) =>
        extractSpriteFramePreview(props.sourceImage, {
          x: frame.x,
          y: frame.y,
          width: props.sprite.width,
          height: props.sprite.height,
        }),
      ),
    );
  } else {
    framePreviews.value = frames.map(
      (frame) => frame.bitmap?.preview ?? "",
    );
  }

  if (currentFrameIndex.value >= frames.length) {
    currentFrameIndex.value = Math.max(0, frames.length - 1);
  }
};

const scheduleUpdatePreviews = () => {
  if (updateTimer !== null) clearTimeout(updateTimer);
  updateTimer = setTimeout(updatePreviews, 150);
};

watch(
  () => ({
    sourceImage: props.sourceImage,
    width: props.sprite.width,
    height: props.sprite.height,
    frames: props.sprite.frames,
  }),
  scheduleUpdatePreviews,
  { deep: true, immediate: true },
);

// ─── Animation ────────────────────────────────────────────────────────────────

const { currentFrameIndex, isPlaying, play, stop } = useSpriteAnimation(
  () => props.sprite.frames.length,
);

onBeforeUnmount(() => {
  if (updateTimer !== null) clearTimeout(updateTimer);
});
</script>

<template>
  <div
    class="border bg-[color:var(--surface)] p-3 overflow-x-auto"
    :class="
      isActive
        ? 'border-[color:var(--button-bg)]'
        : 'border-[color:var(--border)]'
    "
  >
    <!--
      Single 5-column grid: col1=name/label | col2=width/x | col3=height/y | col4=remove | col5=anim/thumb
      This guarantees Width and X share col2, Height and Y share col3 → identical widths.
    -->
    <div
      class="grid items-end gap-x-4 gap-y-3"
      style="grid-template-columns: 1.4fr 0.2fr 0.2fr auto 10rem"
    >
      <!-- ── Header row ── -->

      <!-- col1: Name + optional active badge -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <label
            :for="`sprite-name-${spriteIndex}`"
            class="text-xs font-semibold"
            >{{ tp("spriteNameLabel") }}</label
          >
          <span
            v-if="isActive"
            class="bg-[color:var(--button-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--button-ink)]"
          >
            {{ tp("activeSpriteBadge") }}
          </span>
        </div>
        <input
          :id="`sprite-name-${spriteIndex}`"
          v-model="sprite.name"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
        />
      </div>

      <!-- col2: Width -->
      <div class="flex flex-col gap-1">
        <label
          :for="`sprite-width-${spriteIndex}`"
          class="text-xs font-semibold"
          >{{ tp("spriteWidthLabel") }}</label
        >
        <input
          :id="`sprite-width-${spriteIndex}`"
          v-model.number="sprite.width"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="width"
          type="number"
          min="1"
        />
      </div>

      <!-- col3: Height -->
      <div class="flex flex-col gap-1">
        <label
          :for="`sprite-height-${spriteIndex}`"
          class="text-xs font-semibold"
          >{{ tp("spriteHeightLabel") }}</label
        >
        <input
          :id="`sprite-height-${spriteIndex}`"
          v-model.number="sprite.height"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="height"
          type="number"
          min="1"
        />
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
        :preview-src="framePreviews[currentFrameIndex]"
        :frame-count="sprite.frames.length"
        :current-frame-index="currentFrameIndex"
        :is-playing="isPlaying"
        :play-title="tp('playAnimation')"
        :stop-title="tp('stopAnimation')"
        @play="play"
        @stop="stop"
      />

      <!-- ── Frame rows ── -->
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

        <!-- col2: X (or empty placeholder when showFrameCoords=false) -->
        <div v-if="showFrameCoords" class="flex flex-col gap-1">
          <label
            :for="`frame-x-${spriteIndex}-${frameIndex}`"
            class="text-xs font-semibold"
            >{{ tp("xLabel") }}</label
          >
          <input
            :id="`frame-x-${spriteIndex}-${frameIndex}`"
            v-model.number="frame.x"
            class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
            placeholder="x"
            type="number"
            min="0"
          />
        </div>
        <div v-else />

        <!-- col3: Y (or empty placeholder when showFrameCoords=false) -->
        <div v-if="showFrameCoords" class="flex flex-col gap-1">
          <label
            :for="`frame-y-${spriteIndex}-${frameIndex}`"
            class="text-xs font-semibold"
            >{{ tp("yLabel") }}</label
          >
          <input
            :id="`frame-y-${spriteIndex}-${frameIndex}`"
            v-model.number="frame.y"
            class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
            placeholder="y"
            type="number"
            min="0"
          />
        </div>
        <div v-else />

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
          :src="framePreviews[frameIndex]"
          :alt="`Frame ${frameIndex + 1}`"
          :is-active="isPlaying && currentFrameIndex === frameIndex"
        />
      </template>

      <!-- ── Add frame button (spans cols 1–4) ── -->
      <button
        class="col-span-4 justify-self-start inline-flex items-center gap-2 bg-[color:var(--button-secondary-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
        type="button"
        @click="emit('add-frame')"
      >
        {{ tp("addFrame") }}
      </button>
    </div>
  </div>
</template>