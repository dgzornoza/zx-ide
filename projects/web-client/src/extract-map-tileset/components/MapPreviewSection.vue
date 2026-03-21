<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { TmxMapMetadata } from "../models/mapTilesetDefinition";

const props = defineProps<{
  metadata: TmxMapMetadata | null;
  tileIndices: number[];
  renderPreview: (canvas: HTMLCanvasElement) => void;
}>();

const emit = defineEmits<{
  "file-selected": [file: File];
}>();

const { t } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit("file-selected", file);
  }
}

function triggerRender(): void {
  if (canvasRef.value) {
    props.renderPreview(canvasRef.value);
  }
}

watch(() => [props.tileIndices, props.metadata] as const, triggerRender, {
  deep: true,
});

onMounted(triggerRender);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-1">
      <span
        class="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]"
      >
        {{ t("extract-map-tileset.imageLabel") }}
      </span>
      <p class="text-xs text-[color:var(--ink-soft)]">
        {{ t("extract-map-tileset.imageHint") }}
      </p>
      <label
        class="inline-flex cursor-pointer items-center gap-2 bg-[color:var(--button-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] w-fit"
      >
        {{ t("extract-map-tileset.browseButton") }}
        <input
          type="file"
          accept="image/png"
          class="hidden"
          @change="onFileChange"
        />
      </label>
    </div>

    <div v-if="metadata" class="mt-2">
      <canvas
        ref="canvasRef"
        class="border border-[color:var(--separator)] bg-black"
        style="
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          max-width: 100%;
        "
      />
    </div>
  </div>
</template>
