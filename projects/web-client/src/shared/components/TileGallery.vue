<script setup lang="ts">
defineProps<{
  previews: string[];
  excludedIndices?: Set<number>;
  /** Tooltip when the tile is active (button shows −). */
  actionTooltip: string;
  /** Tooltip when the tile is excluded (button shows +). Only relevant in exclude mode. */
  undoTooltip?: string;
}>();

const emit = defineEmits<{
  tileAction: [index: number];
}>();
</script>

<template>
  <div v-if="previews.length > 0" class="mt-4 flex flex-wrap gap-2">
    <div
      v-for="(preview, index) in previews"
      :key="`tile-${index}`"
      class="relative"
      style="width: 40px; height: 40px"
    >
      <img
        v-if="preview"
        :src="preview"
        :alt="`Tile ${index} preview`"
        class="border border-[color:var(--input-border)]"
        :class="{ 'opacity-30': excludedIndices?.has(index) }"
        style="width: 40px; height: 40px; image-rendering: pixelated"
      />
      <div
        v-else
        class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)]"
        :class="{ 'opacity-30': excludedIndices?.has(index) }"
        style="width: 40px; height: 40px"
      />
      <!-- Exclusion overlay icon -->
      <div
        v-if="excludedIndices?.has(index)"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span class="text-lg font-bold text-[color:var(--error-ink)]">✕</span>
      </div>
      <!-- Action button -->
      <button
        class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border text-xs font-bold leading-none"
        :class="
          excludedIndices?.has(index)
            ? 'border-[color:var(--error-ink)] bg-[color:var(--card)] text-[color:var(--error-ink)]'
            : 'border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--ink-soft)] hover:border-[color:var(--error-ink)] hover:text-[color:var(--error-ink)]'
        "
        :title="
          excludedIndices?.has(index)
            ? (undoTooltip ?? actionTooltip)
            : actionTooltip
        "
        type="button"
        @click="emit('tileAction', index)"
      >
        {{ excludedIndices?.has(index) ? "+" : "−" }}
      </button>
    </div>
  </div>
</template>
