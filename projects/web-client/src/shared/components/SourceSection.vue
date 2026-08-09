<script setup lang="ts">
import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import CodeGenerationSelector from "src/shared/components/CodeGenerationSelector.vue";

const props = defineProps<{
  readOnly?: boolean;
  translationNamespace: string;
  acceptMapFormats?: string;
  /** When true, hides the .map file input entirely. */
  hideMapInput?: boolean;
  /** Override the accepted file formats for the source input (default: '.png,.zxp'). */
  acceptSourceFormats: string;
  /** When true, allows selecting multiple files at once. */
  multipleSource?: boolean;
}>();

const tp = createTranslationPrefixFn(props.translationNamespace);

const source = defineModel<string>("source", { required: true });
const mapSource = defineModel<string>("mapSource", { default: "" });
const codeGenerationType = defineModel<CodeGenerationType>(
  "codeGenerationType",
  { default: "c" },
);
const useZx0Compression = defineModel<boolean>("useZx0Compression", {
  default: true,
});

const emit = defineEmits<{
  fileSelected: [file: File];
  filesSelected: [files: File[]];
  mapFileSelected: [file: File];
}>();

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length === 0) return;
  // When multipleSource, show the primary (non-PNG) file as the source label
  const primary = props.multipleSource
    ? (files.find((f) => !/\.png$/i.test(f.name)) ?? files[0])
    : files[0];
  source.value = primary.name;
  emit("fileSelected", primary);
  emit("filesSelected", files);
}

function onMapFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    mapSource.value = file.name;
    emit("mapFileSelected", file);
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
      <!-- PNG image input -->
      <div>
        <label for="source-input" class="text-xs font-semibold">{{
          tp("sourceLabel")
        }}</label>
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
            id="source-input"
            :accept="props.acceptSourceFormats"
            :multiple="props.multipleSource"
            class="sr-only"
            type="file"
            @change="onFileChange"
          />
        </label>
        <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
          {{ tp("sourceHint") }}
        </p>
      </div>

      <!-- .map file input -->
      <div v-if="!props.hideMapInput">
        <label for="map-source-input" class="text-xs font-semibold">{{
          tp("mapSourceLabel")
        }}</label>
        <label
          class="mt-2 flex w-full cursor-pointer items-center gap-3 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
        >
          <span
            class="shrink-0 bg-[color:var(--button-secondary-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
          >
            {{ tp("browseButton") }}
          </span>
          <span class="truncate font-mono text-[color:var(--input-ink)]">
            {{ mapSource || tp("noFileSelected") }}
          </span>
          <input
            id="map-source-input"
            :accept="acceptMapFormats ?? '.map'"
            class="sr-only"
            type="file"
            @change="onMapFileChange"
          />
        </label>
        <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
          {{ tp("mapSourceHint") }}
        </p>
      </div>

      <!-- Code generation type -->
      <CodeGenerationSelector
        v-model:code-generation-type="codeGenerationType"
        v-model:use-zx0-compression="useZx0Compression"
        :translation-namespace="translationNamespace"
        :read-only="readOnly"
      />
    </div>
  </section>
</template>
