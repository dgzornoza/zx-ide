<script setup lang="ts">
import { SpriteDefinition } from "src/extract-sprites/models/spriteDefinition";
import { extractSpriteFramePreview } from "src/utils/image-utils";
import { createTranslationPrefixFn } from "src/utils/vue-utils";
import { onBeforeUnmount, ref, watch } from "vue";

const tp = createTranslationPrefixFn("extract-sprites");

const props = defineProps<{
  sprite: SpriteDefinition;
  spriteIndex: number;
  sourceImage: File | null;
}>();

const emit = defineEmits<{
  remove: [];
  "add-frame": [];
  "remove-frame": [frameIndex: number];
}>();

const ANIMATION_FPS = 8;

// ─── Frame preview thumbnails ─────────────────────────────────────────────────

const framePreviews = ref<string[]>([]);
const currentFrameIndex = ref(0);
const isPlaying = ref(false);
let intervalId: ReturnType<typeof setInterval> | null = null;
let updateTimer: ReturnType<typeof setTimeout> | null = null;

const updatePreviews = async () => {
  framePreviews.value = await Promise.all(
    props.sprite.frames.map((frame) =>
      extractSpriteFramePreview(props.sourceImage, {
        x: frame.x,
        y: frame.y,
        width: props.sprite.width,
        height: props.sprite.height,
      }),
    ),
  );
  if (currentFrameIndex.value >= props.sprite.frames.length) {
    currentFrameIndex.value = Math.max(0, props.sprite.frames.length - 1);
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

const play = () => {
  if (isPlaying.value || props.sprite.frames.length <= 1) return;
  isPlaying.value = true;
  intervalId = setInterval(() => {
    currentFrameIndex.value =
      (currentFrameIndex.value + 1) % props.sprite.frames.length;
  }, 1000 / ANIMATION_FPS);
};

const stop = () => {
  isPlaying.value = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

onBeforeUnmount(() => {
  stop();
  if (updateTimer !== null) clearTimeout(updateTimer);
});
</script>

<template>
  <div
    class="border border-[color:var(--border)] bg-[color:var(--surface)] p-3 overflow-x-auto"
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

      <!-- col1: Name -->
      <div class="flex flex-col gap-1">
        <label for="sprite-name" class="text-xs font-semibold">{{
          tp("spriteNameLabel")
        }}</label>
        <input
          id="sprite-name"
          v-model="sprite.name"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
        />
      </div>

      <!-- col2: Width -->
      <div class="flex flex-col gap-1">
        <label for="sprite-width" class="text-xs font-semibold">{{
          tp("spriteWidthLabel")
        }}</label>
        <input
          id="sprite-width"
          v-model.number="sprite.width"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="width"
          type="number"
          min="1"
        />
      </div>

      <!-- col3: Height -->
      <div class="flex flex-col gap-1">
        <label for="sprite-height" class="text-xs font-semibold">{{
          tp("spriteHeightLabel")
        }}</label>
        <input
          id="sprite-height"
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
      <div class="flex flex-row items-end gap-2 ml-4">
        <div
          class="flex items-center justify-center border border-[color:var(--border)] p-1"
        >
          <img
            v-if="framePreviews[currentFrameIndex]"
            :src="framePreviews[currentFrameIndex]"
            :alt="`Frame ${currentFrameIndex + 1} preview`"
            style="width: 40px; height: 40px; image-rendering: pixelated"
          />
          <div
            v-else
            class="bg-[color:var(--border)]"
            style="width: 40px; height: 40px"
          />
        </div>
        <div class="flex flex-col items-center gap-1">
          <div class="flex gap-1">
            <button
              class="flex items-center justify-center bg-[color:var(--button-secondary-bg)] p-1.5 text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :title="tp('playAnimation')"
              :disabled="isPlaying || sprite.frames.length <= 1"
              @click="play"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
            </button>
            <button
              class="flex items-center justify-center bg-[color:var(--button-secondary-bg)] p-1.5 text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :title="tp('stopAnimation')"
              :disabled="!isPlaying"
              @click="stop"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="10" height="10" />
              </svg>
            </button>
          </div>
          <span class="text-[10px] text-[color:var(--ink-soft)]">
            {{ currentFrameIndex + 1 }} / {{ sprite.frames.length }}
          </span>
        </div>
      </div>

      <!-- ── Frame rows ── -->
      <template
        v-for="(frame, frameIndex) in sprite.frames"
        :key="`sprite-${spriteIndex}-frame-${frameIndex}`"
      >
        <!-- col1: Frame label -->
        <div
          class="self-start text-xs pr-2 font-bold text-right text-[color:var(--ink-soft)]"
        >
          {{ tp("frameLabel") }} {{ frameIndex + 1 }}
        </div>

        <!-- col2: X -->
        <div class="flex flex-col gap-1">
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

        <!-- col3: Y -->
        <div class="flex flex-col gap-1">
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

        <!-- col4: Remove frame -->
        <button
          class="h-[34px] bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
          type="button"
          @click="emit('remove-frame', frameIndex)"
        >
          {{ tp("remove") }}
        </button>

        <!-- col5: Frame thumbnail -->
        <div class="flex ml-4">
          <div
            class="justify-left border p-1"
            :class="
              isPlaying && currentFrameIndex === frameIndex
                ? 'border-[color:var(--focus-border,var(--success-ink))]'
                : 'border-[color:var(--border)]'
            "
          >
            <img
              v-if="framePreviews[frameIndex]"
              :src="framePreviews[frameIndex]"
              :alt="`Frame ${frameIndex + 1}`"
              style="width: 40px; height: 40px; image-rendering: pixelated"
            />
            <div
              v-else
              class="bg-[color:var(--border)]"
              style="width: 40px; height: 40px"
            />
          </div>
        </div>
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
