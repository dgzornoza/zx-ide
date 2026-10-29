<script setup lang="ts">
import StatusBanner from 'src/shared/components/StatusBanner.vue';
import AssetsSourceSection from 'src/shared/components/AssetsSourceSection.vue';
import { useAssetsBridge } from 'src/shared/composables/useAssetsBridge';
import ResultsSection from './components/ResultsSection.vue';
import TilesSection from './components/TilesSection.vue';
import { useExtractTiles } from './composables/useExtractTiles';

const { state, status, memoryUsage, translate, setSourceImage, extractResources, toggleTileExclusion } = useExtractTiles();

const { assets, missing, requestAssetBytes } = useAssetsBridge();

async function onImageChanged(path: string) {
  try {
    await setSourceImage(path, await requestAssetBytes(path));
  } catch (error) {
    console.error('Failed to load source image:', error);
  }
}
</script>

<template>
  <div class="min-h-screen px-6 py-8">
    <header class="w-full">
      <div class="text-2xl font-semibold">
        {{ translate('title') }}
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[color:var(--ink-soft)]">
        {{ translate('subtitle') }}
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
        v-model:tile-width="state.tiles.tileWidth"
        v-model:tile-height="state.tiles.tileHeight"
        :tiles="state.tiles"
        @toggle-tile-exclusion="toggleTileExclusion"
      />

      <ResultsSection
        v-if="state.tiles.count > 0"
        :tile-count="memoryUsage.tileCount"
        :bitmap-bytes="memoryUsage.bitmapBytes"
        :attribute-bytes="memoryUsage.attributeBytes"
      />
    </main>

    <footer class="mt-6 w-full">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <StatusBanner :status="status" />
        <button
          class="ml-auto inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!state.source || missing"
          @click="extractResources"
        >
          {{ translate('create') }}
        </button>
      </div>
    </footer>
  </div>
</template>
