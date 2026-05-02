<script setup lang="ts">
defineProps<{
  previewSrc?: string;
  frameCount: number;
  currentFrameIndex: number;
  isPlaying: boolean;
  playTitle?: string;
  stopTitle?: string;
}>();

const emit = defineEmits<{
  play: [];
  stop: [];
}>();
</script>

<template>
  <div class="ml-4 flex flex-row items-end gap-2">
    <div
      class="flex items-center justify-center border border-[color:var(--border)] p-1"
    >
      <img
        v-if="previewSrc"
        :src="previewSrc"
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
          :title="playTitle"
          :disabled="isPlaying || frameCount <= 1"
          @click="emit('play')"
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
          :title="stopTitle"
          :disabled="!isPlaying"
          @click="emit('stop')"
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
        {{ currentFrameIndex + 1 }} / {{ frameCount }}
      </span>
    </div>
  </div>
</template>
