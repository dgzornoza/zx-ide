<script setup lang="ts">
import SourceSection from "src/shared/components/SourceSection.vue";
import ResultsSection from "./components/ResultsSection.vue";
import TilesSection from "./components/TilesSection.vue";
import { useExtractTiles } from "./composables/useExtractTiles";

const {
  state,
  status,
  codeGenerationType,
  isCodeGenerationTypeReadOnly,
  useZx0Compression,
  tp,
  setSourceFile,
  setMapFile,
  extractResources,
  toggleTileExclusion,
} = useExtractTiles();
</script>

<template>
  <div class="min-h-screen px-6 py-8">
    <header class="w-full">
      <div class="text-2xl font-semibold">
        {{ tp("title") }}
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[color:var(--ink-soft)]">
        {{ tp("subtitle") }}
      </p>
    </header>

    <main class="mt-6 flex w-full flex-col gap-4">
      <SourceSection
        v-model:source="state.source"
        v-model:map-source="state.mapSource"
        v-model:code-generation-type="codeGenerationType"
        v-model:use-zx0-compression="useZx0Compression"
        :read-only="isCodeGenerationTypeReadOnly"
        translation-namespace="extract-tiles"
        accept-source-formats=".png,.zxp"
        accept-map-formats=".cfg"
        @file-selected="setSourceFile"
        @map-file-selected="setMapFile"
      />

      <TilesSection
        v-if="state.source"
        :tiles="state.tiles"
        v-model:tile-width="state.tiles.tileWidth"
        v-model:tile-height="state.tiles.tileHeight"
        @toggle-tile-exclusion="toggleTileExclusion"
      />

      <ResultsSection
        v-if="state.tiles.count > 0"
        :total-tiles="state.tiles.count - state.tiles.excludedSet.size"
        :total-bytes="
          ((state.tiles.count - state.tiles.excludedSet.size) *
            state.tiles.tileWidth *
            state.tiles.tileHeight) /
          8
        "
      />
    </main>

    <footer class="mt-6 w-full">
      <div
        class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div
          v-if="status"
          class="text-xs font-semibold"
          :class="
            status.type === 'success'
              ? 'text-[color:var(--success-ink)]'
              : 'text-[color:var(--error-ink)]'
          "
        >
          {{ status.text }}
        </div>
        <button
          class="ml-auto inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!state.source"
          @click="extractResources"
        >
          {{ tp("create") }}
        </button>
      </div>
    </footer>
  </div>
</template>
