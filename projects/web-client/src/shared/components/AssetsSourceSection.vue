<script setup lang="ts">
import type { AssetsEntry } from "externalShared/extract-graphics/extract-graphics-dtos";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const props = defineProps<{
  /** i18n namespace, e.g. "extract-sprites" — reserved for future per-page overrides. */
  translationNamespace: string;
  /** Discovered image list from the extension. Empty array when missing. */
  assets: AssetsEntry[];
  /** When true, the select is disabled and a missing-assets banner is shown. */
  missing: boolean;
}>();

/** Currently selected workspace-relative path, or "" for the placeholder. */
const source = defineModel<string>({ required: true });

const emit = defineEmits<{
  /** Fires when the user picks an image. Carries the new path. */
  "image-changed": [path: string];
}>();

const { t } = useI18n();

// The `assetsSourceSection.*` keys live at the top level of the locale so they
// are shared by every page that mounts this component; do NOT prepend the page
// namespace here.
const tp = (key: string) => t(`assetsSourceSection.${key}`);

const selectedEntry = computed<AssetsEntry | undefined>(() =>
  props.assets.find((entry) => entry.path === source.value),
);

const expectedConfigurationPath = computed<string>(() => {
  const dotIndex = source.value.lastIndexOf(".");
  const stem = dotIndex >= 0 ? source.value.slice(0, dotIndex) : source.value;
  return `${stem}.cfg`;
});

// `v-model` updates the source ref AFTER the native `change` event fires, so
// reading `source.value` inside an `@change` handler would emit the previous
// value. Read the new path from the event target explicitly, write it back
// through the model, and emit `image-changed` with the new value in one step.
function onSelectionChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const nextPath = target.value;
  source.value = nextPath;
  emit("image-changed", nextPath);
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
      <!-- Missing-assets banner (shown only when `missing === true`) -->
      <div
        v-if="missing"
        data-test="missing-assets-banner"
        class="border border-[color:var(--error-ink)] bg-[color:var(--error-bg)] p-3 text-xs text-[color:var(--error-ink)]"
      >
        <p class="font-semibold">
          {{ tp("missingAssetsTitle") }}
        </p>
        <p class="mt-1">
          {{ tp("missingAssetsHint") }}
        </p>
      </div>

      <!-- Image dropdown -->
      <div>
        <label
          for="assets-source-select"
          class="text-xs font-semibold"
        >
          {{ tp("selectImageLabel") }}
        </label>
        <select
          id="assets-source-select"
          :value="source"
          class="mt-2 w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm font-mono text-[color:var(--input-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="missing"
          @change="onSelectionChange"
        >
          <option value="" :disabled="!missing">
            {{ tp("placeholderPrompt") }}
          </option>
          <option
            v-for="entry in assets"
            :key="entry.path"
            :value="entry.path"
          >
            {{ entry.path }}
          </option>
        </select>
        <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
          {{ tp("selectImageHint") }}
        </p>
      </div>

      <!-- Configuration label (read-only) -->
      <div v-if="selectedEntry" data-test="configuration-label">
        <label class="text-xs font-semibold">
          {{ tp("configurationLabel") }}
        </label>
        <p class="mt-2 break-all font-mono text-xs text-[color:var(--input-ink)]">
          {{ expectedConfigurationPath }}
          <span
            class="ml-2"
            :class="selectedEntry.configurationExists
              ? 'text-[color:var(--success-ink)]'
              : 'text-[color:var(--ink-soft)]'"
          >
            ({{ selectedEntry.configurationExists
                ? tp("configurationExists")
                : tp("configurationMissing") }})
          </span>
        </p>
      </div>
    </div>
  </section>
</template>