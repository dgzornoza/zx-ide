<script setup lang="ts">
import { createTranslationPrefixFn } from "src/utils/vue-helpers";

const tp = createTranslationPrefixFn("extract-graphics");

const selectedType = defineModel<"tiles" | "sprites" | "">({ required: true });
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ tp("sectionTiles") }} / {{ tp("sectionSprites") }}
    </h2>
    <div class="mt-3 flex flex-col gap-2 text-sm">
      <label class="inline-flex items-center gap-2">
        <input v-model="selectedType" type="radio" value="tiles" />
        <span>{{ tp("sectionTiles") }}</span>
      </label>
      <label class="inline-flex items-center gap-2">
        <input v-model="selectedType" type="radio" value="sprites" />
        <span>{{ tp("sectionSprites") }}</span>
      </label>
    </div>
  </section>
</template>
