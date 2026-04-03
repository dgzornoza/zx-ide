<script setup lang="ts">
import SourceSection from "shared/components/SourceSection.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MapPreviewSection from "./components/MapPreviewSection.vue";
import { useExtractMapTileset } from "./composables/useExtractMapTileset";

const { t } = useI18n();

const {
  xmlSource,
  imageSource,
  metadata,
  tileIndices,
  errors,
  warnings,
  codeGenerationType,
  isCodeGenerationTypeReadOnly,
  isReady,
  usedTileCount,
  usedTilesByteSize,
  mapByteSize,
  totalByteSize,
  statusMessage,
  setXmlFile,
  renderPreview,
  extractResources,
} = useExtractMapTileset();

const baseName = computed(() => {
  if (!xmlSource.value) {
    return "map";
  }
  return xmlSource.value.replace(/\.[^.]+$/, "");
});

function onXmlFilesSelected(files: File[]): void {
  const tmxFile = files.find((f) => /\.(tmx|xml)$/i.test(f.name));
  if (!tmxFile) return;
  setXmlFile(
    tmxFile,
    files.filter((f) => f !== tmxFile),
  );
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
  if (key === "warningDimensionsMismatch" && args.length === 2) {
    return t("extract-map-tileset.warningDimensionsMismatch", {
      actual: args[0],
      expected: args[1],
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
      <!-- Source data section (XML input + code gen type) -->
      <SourceSection
        v-model:source="xmlSource"
        v-model:code-generation-type="codeGenerationType"
        translation-namespace="extract-map-tileset"
        :read-only="isCodeGenerationTypeReadOnly"
        :hide-map-input="true"
        :multiple-source="true"
        accept-source-formats=".tmx,.xml,.png"
        @files-selected="onXmlFilesSelected"
      />

      <!-- Canvas preview + PNG status -->
      <MapPreviewSection
        :metadata="metadata"
        :tile-indices="tileIndices"
        :image-source="imageSource"
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
