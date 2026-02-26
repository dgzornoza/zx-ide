<script setup lang="ts">
import SourceSection from "./components/SourceSection.vue";
import SpritesSection from "./components/SpritesSection.vue";
import TilesSection from "./components/TilesSection.vue";
import TypeSelector from "./components/TypeSelector.vue";
import { useExtractGraphics } from "./composables/useExtractGraphics";

const {
  state,
  status,
  selectedType,
  tp,
  setSourceFile,
  setMapFile,
  addSprite,
  removeSprite,
  addSpriteFrame,
  removeSpriteFrame,
  extractResources,
} = useExtractGraphics();
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
        @file-selected="setSourceFile"
        @map-file-selected="setMapFile"
      />

      <TypeSelector v-if="state.source" v-model="selectedType" />

      <TilesSection
        v-if="selectedType === 'tiles'"
        :tiles="state.tiles"
        v-model:tile-width="state.tiles.tileWidth"
        v-model:tile-height="state.tiles.tileHeight"
      />

      <SpritesSection
        v-if="selectedType === 'sprites'"
        :sprites="state.sprites"
        @add-sprite="addSprite"
        @remove-sprite="removeSprite"
        @add-frame="addSpriteFrame"
        @remove-frame="removeSpriteFrame"
      />
    </main>

    <footer class="mt-6 w-full">
      <div
        class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <button
          class="inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!selectedType"
          @click="extractResources"
        >
          {{ tp("create") }}
        </button>
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
      </div>
    </footer>
  </div>
</template>
