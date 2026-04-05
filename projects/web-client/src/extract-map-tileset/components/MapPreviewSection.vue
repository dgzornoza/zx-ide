<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { MapTilesetMetadata } from "../models/mapTilesetDefinition";

const props = defineProps<{
  metadata?: MapTilesetMetadata;
  tileIndices: number[];
  imageSource: string;
  renderPreview: (canvas: HTMLCanvasElement) => void;
}>();

const { t } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);

function triggerRender(): void {
  if (canvasRef.value) {
    props.renderPreview(canvasRef.value);
  }
}

watch(
  () => [props.tileIndices, props.metadata, props.imageSource] as const,
  triggerRender,
  { deep: true, flush: "post" },
);

onMounted(triggerRender);
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- PNG not auto-loaded: hint to re-select including the PNG -->
    <p
      v-if="metadata && !imageSource"
      class="text-xs text-[color:var(--warning-ink)]"
    >
      {{
        t("extract-map-tileset.imageNotLoaded", {
          filename: metadata.sourceImage,
        })
      }}
    </p>

    <!-- Preview Section -->
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
