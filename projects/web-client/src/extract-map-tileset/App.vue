<script setup lang="ts">
import SourceSection from "src/shared/components/SourceSection.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MapPreviewSection from "./components/MapPreviewSection.vue";
import { useExtractMapTileset } from "./composables/useExtractMapTileset";

const { t } = useI18n();

const {
  mapSource,
  asmSource,
  metadata,
  tileIndices,
  errors,
  warnings,
  codeGenerationType,
  isCodeGenerationTypeReadOnly,
  useZx0Compression,
  isReady,
  usedTileCount,
  usedTilesByteSize,
  mapByteSize,
  totalByteSize,
  previewRefreshKey,
  statusMessage,
  setMapFile,
  setAsmFile,
  renderPreview,
  extractResources,
} = useExtractMapTileset();

const baseName = computed(() => {
  if (!mapSource.value) {
    return "map";
  }
  return mapSource.value.replace(/\.[^.]+$/, "");
});

function onMapFileSelected(file: File): void {
  setMapFile(file);
}

function onAsmFileSelected(file: File): void {
  setAsmFile(file);
}

function onExtract(): void {
  extractResources(baseName.value);
}

function formatError(error: string): string {
  const [key, ...args] = error.split(":");
  if (key === "errorTileCountExceeds255" && args[0]) {
    return t("extract-map-tileset.errorTileCountExceeds255", {
      count: args[0],
    });
  }
  if (key === "errorJsonMissingField" && args[0]) {
    return t("extract-map-tileset.errorJsonMissingField", {
      field: args[0],
    });
  }
  if (key === "errorAsmTileCountMismatch" && args.length === 2) {
    return t("extract-map-tileset.errorAsmTileCountMismatch", {
      maxIndex: args[0],
      tileCount: args[1],
    });
  }
  const translationKey = `extract-map-tileset.${key}`;
  return t(translationKey, translationKey);
}
</script>

<template>
  <div class="min-h-screen px-6 py-8">
    <header class="w-full">
      <div class="text-2xl font-semibold">
        {{ t("extract-map-tileset.title") }}
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[color:var(--ink-soft)]">
        {{ t("extract-map-tileset.subtitle") }}
      </p>
    </header>

    <main class="mt-6 flex w-full flex-col gap-6">
      <!-- Source data section (JSON + ASM inputs + code gen type) -->
      <SourceSection
        v-model:source="mapSource"
        v-model:map-source="asmSource"
        v-model:code-generation-type="codeGenerationType"
        v-model:use-zx0-compression="useZx0Compression"
        translation-namespace="extract-map-tileset"
        :read-only="isCodeGenerationTypeReadOnly"
        accept-source-formats=".json"
        accept-map-formats=".asm"
        @file-selected="onMapFileSelected"
        @map-file-selected="onAsmFileSelected"
      />

      <!-- Canvas preview generated from ASM tile data -->
      <MapPreviewSection
        :metadata="metadata"
        :tile-indices="tileIndices"
        :preview-refresh-key="previewRefreshKey"
        :render-preview="renderPreview"
      />

      <!-- Validation errors -->
      <ul v-if="errors.length > 0" class="flex flex-col gap-1">
        <li
          v-for="(error, index) in errors"
          :key="index"
          class="text-sm text-[color:var(--error-ink)]"
        >
          {{ formatError(error) }}
        </li>
      </ul>

      <!-- Warnings (non-blocking) -->
      <ul v-if="warnings.length > 0" class="flex flex-col gap-1">
        <li
          v-for="(warning, index) in warnings"
          :key="index"
          class="text-sm text-[color:var(--warning-ink)]"
        >
          {{ formatError(warning) }}
        </li>
      </ul>

      <!-- Results section -->
      <section v-if="metadata" class="flex flex-col gap-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]"
        >
          {{ t("extract-map-tileset.sectionResults") }}
        </h2>
        <dl class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.tilesUsedLabel") }}
            </dt>
            <dd class="font-semibold">{{ usedTileCount }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.tilesBytesLabel") }}
            </dt>
            <dd class="font-semibold">{{ usedTilesByteSize }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.mapWidthLabel") }}
            </dt>
            <dd class="font-semibold">{{ metadata.mapWidth }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.mapHeightLabel") }}
            </dt>
            <dd class="font-semibold">{{ metadata.mapHeight }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.mapBytesLabel") }}
            </dt>
            <dd class="font-semibold">{{ mapByteSize }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ t("extract-map-tileset.totalBytesLabel") }}
            </dt>
            <dd class="font-semibold">{{ totalByteSize }}</dd>
          </div>
        </dl>
      </section>
    </main>

    <footer class="mt-6 w-full">
      <div
        class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div
          v-if="statusMessage"
          class="text-xs font-semibold text-[color:var(--success-ink)]"
        >
          {{ t(`extract-map-tileset.${statusMessage}`) }}
        </div>
        <button
          class="ml-auto inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!isReady"
          @click="onExtract"
        >
          {{ t("extract-map-tileset.create") }}
        </button>
      </div>
    </footer>
  </div>
</template>
