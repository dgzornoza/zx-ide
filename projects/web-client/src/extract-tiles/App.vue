<script setup lang="ts">
import AssetsSourceSection from "src/shared/components/AssetsSourceSection.vue";
import { useAssetsBridge } from "src/shared/composables/useAssetsBridge";
import ResultsSection from "./components/ResultsSection.vue";
import TilesSection from "./components/TilesSection.vue";
import { useExtractTiles } from "./composables/useExtractTiles";

const {
  state,
  status,
  codeGenerationType,
  tp,
  setSourceImage,
  setMapFile,
  extractResources,
  toggleTileExclusion,
} = useExtractTiles();

const { assets, missing, requestAssetBytes } = useAssetsBridge();

async function onImageChanged(path: string) {
  try {
    await setSourceImage(path, await requestAssetBytes(path));
  } catch (error) {
    console.error("Failed to load source image:", error);
  }
}
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
      <AssetsSourceSection
        v-model="state.source"
        :assets="assets"
        :missing="missing"
        translation-namespace="extract-tiles"
        @image-changed="onImageChanged"
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
          :disabled="!state.source || missing"
          @click="extractResources"
        >
          {{ tp("create") }}
        </button>
      </div>
    </footer>
  </div>
</template>
