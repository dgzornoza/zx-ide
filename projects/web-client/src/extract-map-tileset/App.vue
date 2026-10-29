<script setup lang="ts">
import type { DomainError } from 'src/domain/domain-error';
import StatusBanner from 'src/shared/components/StatusBanner.vue';
import SourceSection from 'src/shared/components/SourceSection.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MapPreviewSection from './components/MapPreviewSection.vue';
import { useExtractMapTileset } from './composables/useExtractMapTileset';

const { t: translate } = useI18n();

const {
  mapSource,
  asmSource,
  metadata,
  tileIndices,
  errors,
  warnings,
  codeGenerationType,
  isReady,
  usedTileCount,
  usedTilesByteSize,
  mapByteSize,
  totalByteSize,
  previewRefreshKey,
  status,
  setMapFile,
  setAsmFile,
  renderPreview,
  extractResources,
} = useExtractMapTileset();

const baseName = computed(() => {
  if (!mapSource.value) {
    return 'map';
  }
  return mapSource.value.replace(/\.[^.]+$/, '');
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

function formatError(error: DomainError): string {
  const { key, args: errorArguments } = error;
  if (key === 'errorTileCountExceeds255' && errorArguments[0] !== undefined) {
    return translate('extract-map-tileset.errorTileCountExceeds255', {
      count: String(errorArguments[0]),
    });
  }
  if (key === 'errorJsonMissingField' && errorArguments[0] !== undefined) {
    return translate('extract-map-tileset.errorJsonMissingField', {
      field: String(errorArguments[0]),
    });
  }
  if (key === 'errorAsmTileCountMismatch' && errorArguments.length === 2) {
    return translate('extract-map-tileset.errorAsmTileCountMismatch', {
      maxIndex: String(errorArguments[0]),
      tileCount: String(errorArguments[1]),
    });
  }
  const translationKey = `extract-map-tileset.${key}`;
  return translate(translationKey, translationKey);
}
</script>

<template>
  <div class="min-h-screen px-6 py-8">
    <header class="w-full">
      <div class="text-2xl font-semibold">
        {{ translate('extract-map-tileset.title') }}
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[color:var(--ink-soft)]">
        {{ translate('extract-map-tileset.subtitle') }}
      </p>
    </header>

    <main class="mt-6 flex w-full flex-col gap-6">
      <!-- Source data section (JSON + ASM inputs + project type info) -->
      <SourceSection
        v-model:source="mapSource"
        v-model:map-source="asmSource"
        :code-generation-type="codeGenerationType"
        translation-namespace="extract-map-tileset"
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
        <li v-for="(error, index) in errors" :key="index" class="text-sm text-[color:var(--error-ink)]">
          {{ formatError(error) }}
        </li>
      </ul>

      <!-- Warnings (non-blocking) -->
      <ul v-if="warnings.length > 0" class="flex flex-col gap-1">
        <li v-for="(warning, index) in warnings" :key="index" class="text-sm text-[color:var(--warning-ink)]">
          {{ formatError(warning) }}
        </li>
      </ul>

      <!-- Results section -->
      <section v-if="metadata" class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
          {{ translate('extract-map-tileset.sectionResults') }}
        </h2>
        <dl class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.tilesUsedLabel') }}
            </dt>
            <dd class="font-semibold">{{ usedTileCount }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.tilesBytesLabel') }}
            </dt>
            <dd class="font-semibold">{{ usedTilesByteSize }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.mapWidthLabel') }}
            </dt>
            <dd class="font-semibold">{{ metadata.mapWidth }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.mapHeightLabel') }}
            </dt>
            <dd class="font-semibold">{{ metadata.mapHeight }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.mapBytesLabel') }}
            </dt>
            <dd class="font-semibold">{{ mapByteSize }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[color:var(--ink-soft)]">
              {{ translate('extract-map-tileset.totalBytesLabel') }}
            </dt>
            <dd class="font-semibold">{{ totalByteSize }}</dd>
          </div>
        </dl>
      </section>
    </main>

    <footer class="mt-6 w-full">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <StatusBanner :status="status" />
        <button
          class="ml-auto inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!isReady"
          @click="onExtract"
        >
          {{ translate('extract-map-tileset.create') }}
        </button>
      </div>
    </footer>
  </div>
</template>
