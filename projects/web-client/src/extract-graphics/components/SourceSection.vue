<script setup lang="ts">
import { createTranslationPrefixFn } from "src/utils/vue-helpers";

const tp = createTranslationPrefixFn("extract-graphics");

const source = defineModel<string>("source", { required: true });

const emit = defineEmits<{ fileSelected: [file: File] }>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    source.value = file.name;
    emit("fileSelected", file);
  }
}
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ tp("sectionSource") }}
    </h2>
    <div class="mt-4 space-y-4">
      <!-- file input control -->
      <div>
        <label class="text-xs font-semibold">{{ tp("sourceLabel") }}</label>
        <label
          class="mt-2 flex w-full cursor-pointer items-center gap-3 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
        >
          <span
            class="shrink-0 bg-[color:var(--button-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)]"
          >
            {{ tp("browseButton") }}
          </span>
          <span class="truncate font-mono text-[color:var(--input-ink)]">
            {{ source || tp("noFileSelected") }}
          </span>
          <input
            accept=".png"
            class="sr-only"
            type="file"
            @change="onFileChange"
          />
        </label>
        <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
          {{ tp("sourceHint") }}
        </p>
      </div>
    </div>
  </section>
</template>
