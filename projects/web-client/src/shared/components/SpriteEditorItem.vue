<script setup lang="ts">
import { extractSpriteFramePreview } from 'src/helpers/image-utils';
import { parseIntegerInput, showInputValue } from 'src/helpers/integer-input';
import { createTranslationPrefixFn } from 'src/helpers/vue-utils';
import { SpriteChanges, SpriteDefinition, SpriteFrameChanges } from 'src/shared/models/spriteDefinition';
import SpriteAnimationPanel from 'src/shared/components/SpriteAnimationPanel.vue';
import SpriteFrameThumbnail from 'src/shared/components/SpriteFrameThumbnail.vue';
import { useSpriteAnimation } from 'src/shared/composables/useSpriteAnimation';
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  sprite: SpriteDefinition;
  spriteIndex: number;
  /**
   * Source image used to extract frame previews. When `undefined`, the component
   * falls back to the pre-computed bitmap stored on each frame (create-sprites).
   */
  sourceImage: File | undefined;
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
  'add-frame': [];
  'remove-frame': [frameIndex: number];
  'update-sprite': [changes: SpriteChanges];
  'update-frame': [frameIndex: number, changes: SpriteFrameChanges];
}>();

// ─── Field edits ──────────────────────────────────────────────────────────
//
// The sprite belongs to the page state: edits are emitted, never written to
// the prop. Numeric fields emit integers only (sizes at least 1, coordinates
// at least 0) and ignore text that is not a number yet (an empty field while
// typing); leaving the field shows the stored value again.

const SIZE_MINIMUM = 1;
const COORDINATE_MINIMUM = 0;

const inputText = (event: Event) => (event.target as HTMLInputElement).value;

const emitInteger = (event: Event, minimum: number, emitValue: (value: number) => void) => {
  const value = parseIntegerInput(inputText(event), minimum);
  if (value !== undefined) emitValue(value);
};

const tp = createTranslationPrefixFn(props.translationNamespace);

// ─── Frame preview thumbnails ─────────────────────────────────────────────

const framePreviews = ref<string[]>([]);
let updateTimer: ReturnType<typeof setTimeout> | undefined;

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
        })
      )
    );
  } else {
    framePreviews.value = frames.map((frame) => frame.bitmap?.preview ?? '');
  }

  if (currentFrameIndex.value >= frames.length) {
    currentFrameIndex.value = Math.max(0, frames.length - 1);
  }
};

const scheduleUpdatePreviews = () => {
  if (updateTimer !== undefined) clearTimeout(updateTimer);
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
  { deep: true, immediate: true }
);

// ─── Animation ────────────────────────────────────────────────────────────────

const { currentFrameIndex, isPlaying, play, stop } = useSpriteAnimation(() => props.sprite.frames.length);

onBeforeUnmount(() => {
  if (updateTimer !== undefined) clearTimeout(updateTimer);
});
</script>

<template>
  <div
    class="border bg-[color:var(--surface)] p-3 overflow-x-auto"
    :class="isActive ? 'border-[color:var(--button-bg)]' : 'border-[color:var(--border)]'"
  >
    <!--
      Single 5-column grid: col1=name/label | col2=width/x | col3=height/y | col4=remove | col5=anim/thumb
      This guarantees Width and X share col2, Height and Y share col3 → identical widths.
    -->
    <div class="grid items-end gap-x-4 gap-y-3" style="grid-template-columns: 1.4fr 0.2fr 0.2fr auto 10rem">
      <!-- ── Header row ── -->

      <!-- col1: Name + optional active badge -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <label :for="`sprite-name-${spriteIndex}`" class="text-xs font-semibold">{{ tp('spriteNameLabel') }}</label>
          <span
            v-if="isActive"
            class="bg-[color:var(--button-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--button-ink)]"
          >
            {{ tp('activeSpriteBadge') }}
          </span>
        </div>
        <input
          :id="`sprite-name-${spriteIndex}`"
          :value="sprite.name"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
          @input="emit('update-sprite', { name: inputText($event) })"
        />
      </div>

      <!-- col2: Width -->
      <div class="flex flex-col gap-1">
        <label :for="`sprite-width-${spriteIndex}`" class="text-xs font-semibold">{{ tp('spriteWidthLabel') }}</label>
        <input
          :id="`sprite-width-${spriteIndex}`"
          :value="sprite.width"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="width"
          type="number"
          min="1"
          @input="emitInteger($event, SIZE_MINIMUM, (width) => emit('update-sprite', { width }))"
          @change="showInputValue($event, sprite.width)"
        />
      </div>

      <!-- col3: Height -->
      <div class="flex flex-col gap-1">
        <label :for="`sprite-height-${spriteIndex}`" class="text-xs font-semibold">{{ tp('spriteHeightLabel') }}</label>
        <input
          :id="`sprite-height-${spriteIndex}`"
          :value="sprite.height"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="height"
          type="number"
          min="1"
          @input="emitInteger($event, SIZE_MINIMUM, (height) => emit('update-sprite', { height }))"
          @change="showInputValue($event, sprite.height)"
        />
      </div>

      <!-- col4: Remove sprite -->
      <button
        class="h-[34px] bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
        type="button"
        @click="emit('remove')"
      >
        {{ tp('remove') }}
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
      <template v-for="(frame, frameIndex) in sprite.frames" :key="`sprite-${spriteIndex}-frame-${frameIndex}`">
        <!-- col1: Frame label -->
        <div class="self-start pr-2 text-right text-xs font-bold text-[color:var(--ink-soft)]">
          {{ tp('frameLabel') }} {{ frameIndex + 1 }}
        </div>

        <!-- col2: X (or empty placeholder when showFrameCoords=false) -->
        <div v-if="showFrameCoords" class="flex flex-col gap-1">
          <label :for="`frame-x-${spriteIndex}-${frameIndex}`" class="text-xs font-semibold">{{ tp('xLabel') }}</label>
          <input
            :id="`frame-x-${spriteIndex}-${frameIndex}`"
            :value="frame.x"
            class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
            placeholder="x"
            type="number"
            min="0"
            @input="emitInteger($event, COORDINATE_MINIMUM, (x) => emit('update-frame', frameIndex, { x }))"
            @change="showInputValue($event, frame.x)"
          />
        </div>
        <div v-else />

        <!-- col3: Y (or empty placeholder when showFrameCoords=false) -->
        <div v-if="showFrameCoords" class="flex flex-col gap-1">
          <label :for="`frame-y-${spriteIndex}-${frameIndex}`" class="text-xs font-semibold">{{ tp('yLabel') }}</label>
          <input
            :id="`frame-y-${spriteIndex}-${frameIndex}`"
            :value="frame.y"
            class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
            placeholder="y"
            type="number"
            min="0"
            @input="emitInteger($event, COORDINATE_MINIMUM, (y) => emit('update-frame', frameIndex, { y }))"
            @change="showInputValue($event, frame.y)"
          />
        </div>
        <div v-else />

        <!-- col4: Remove frame -->
        <button
          class="h-[34px] bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
          type="button"
          @click="emit('remove-frame', frameIndex)"
        >
          {{ tp('remove') }}
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
        {{ tp('addFrame') }}
      </button>
    </div>
  </div>
</template>
