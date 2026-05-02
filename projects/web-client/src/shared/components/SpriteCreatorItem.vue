<script setup lang="ts">
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { CreateSpriteDefinition } from "src/shared/models/createSpriteDefinition";
import { onBeforeUnmount, ref, watch } from "vue";

const tp = createTranslationPrefixFn("create-sprites");

const props = defineProps<{
  sprite: CreateSpriteDefinition;
  spriteIndex: number;
}>();

const emit = defineEmits<{
  remove: [];
  "remove-frame": [frameIndex: number];
}>();

const ANIMATION_FPS = 8;

// ─── Animation ────────────────────────────────────────────────────────────────

const currentFrameIndex = ref(0);
const isPlaying = ref(false);
let intervalId: ReturnType<typeof setInterval> | null = null;

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

// Reset animation when frames change
watch(
  () => props.sprite.frames.length,
  (len) => {
    if (currentFrameIndex.value >= len) {
      currentFrameIndex.value = Math.max(0, len - 1);
    }
    if (len <= 1) stop();
  },
);

onBeforeUnmount(() => stop());
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
      <div class="ml-4 flex flex-row items-end gap-2">
        <div
          class="flex items-center justify-center border border-[color:var(--border)] p-1"
        >
          <img
            v-if="sprite.frames[currentFrameIndex]?.preview"
            :src="sprite.frames[currentFrameIndex].preview"
            :alt="`Frame ${currentFrameIndex + 1} preview`"
            style="
              width: 40px;
              height: 40px;
              object-fit: contain;
              image-rendering: pixelated;
            "
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
        <div class="ml-4 flex">
          <div
            class="justify-left border p-1"
            :class="
              isPlaying && currentFrameIndex === frameIndex
                ? 'border-[color:var(--focus-border,var(--success-ink))]'
                : 'border-[color:var(--border)]'
            "
          >
            <img
              v-if="frame.preview"
              :src="frame.preview"
              :alt="`Frame ${frameIndex + 1}`"
              style="
                width: 40px;
                height: 40px;
                object-fit: contain;
                image-rendering: pixelated;
              "
            />
            <div
              v-else
              class="bg-[color:var(--border)]"
              style="width: 40px; height: 40px"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
