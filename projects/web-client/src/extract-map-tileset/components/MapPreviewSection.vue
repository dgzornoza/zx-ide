<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { MapTilesetMetadata } from "../models/mapTilesetDefinition";

const props = defineProps<{
  metadata?: MapTilesetMetadata;
  tileIndices: number[];
  renderPreview: (canvas: HTMLCanvasElement) => void;
}>();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const previewScaleFactor = 3;

function triggerRender(): void {
  if (canvasRef.value) {
    props.renderPreview(canvasRef.value);
    canvasRef.value.style.width = `${canvasRef.value.width * previewScaleFactor}px`;
    canvasRef.value.style.height = `${canvasRef.value.height * previewScaleFactor}px`;
  }
}

watch(() => [props.tileIndices, props.metadata] as const, triggerRender, {
  deep: true,
  flush: "post",
});

onMounted(triggerRender);
</script>

<template>
  <div class="flex flex-col gap-3">
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
