<script setup lang="ts">
import { rotateBinaryGrid } from "src/helpers/binary-grid-utils";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps<{
  translationNamespace: string;
}>();

/** Ref to the underlying <textarea>, exposed via defineExpose for parent focus(). */
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const tp = createTranslationPrefixFn(props.translationNamespace);

const binaryText = defineModel<string>("binaryText", { default: "" });

const emit = defineEmits<{
  add: [inkBitmap: boolean[], width: number, height: number, preview: string];
}>();

const CELL_SIZE = 10;

// --- Rotation state ---
const degX = ref<number>(0);
const degY = ref<number>(0);
const degZ = ref<number>(0);

// Original binary text — always rotate from this, not from the (already rotated) model.
const sourceBinaryText = ref<string>("");
let applyingRotation = false;

// Track user edits: update the source only when the change comes from the user,
// not when applyRotation writes back the result.
watch(binaryText, (newVal) => {
  if (!applyingRotation) {
    sourceBinaryText.value = newVal;
  }
});

const validationError = computed<string | undefined>(() => {
  const text = binaryText.value.trim();
  if (!text) return undefined;

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);

  if (lines.some((line) => /[^01]/.test(line))) {
    return tp("errorInvalidCharacters");
  }

  const lengths = lines.map((l) => l.length);
  if (lengths.some((l) => l !== lengths[0])) {
    return tp("errorUnequalRowLengths");
  }

  return undefined;
});

const parsedBitmap = computed<boolean[][] | undefined>(() => {
  const text = binaryText.value.trim();
  if (!text || validationError.value !== undefined) return undefined;

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((line) => line.split("").map((c) => c === "1"));
});

const previewUrl = ref<string>("");

watch(
  parsedBitmap,
  (bitmap) => {
    if (!bitmap || bitmap.length === 0) {
      previewUrl.value = "";
      return;
    }
    const rows = bitmap.length;
    const cols = bitmap[0].length;
    const canvas = document.createElement("canvas");
    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;
    const ctx = canvas.getContext("2d")!;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = bitmap[r][c] ? "#000000" : "#ffffff";
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    previewUrl.value = canvas.toDataURL("image/png");
  },
  { immediate: true },
);

function onAdd() {
  const bitmap = parsedBitmap.value;
  if (!bitmap || !previewUrl.value) return;
  const width = bitmap[0].length;
  const height = bitmap.length;
  emit("add", bitmap.flat(), width, height, previewUrl.value);
}

function applyRotation(): void {
  const source = sourceBinaryText.value.trim();
  if (!source) return;

  const lines = source.split(/\r?\n/).filter((l) => l.length > 0);
  const bitmap = lines.map((line) => line.split("").map((c) => c === "1"));

  applyingRotation = true;

  if (degX.value === 0 && degY.value === 0 && degZ.value === 0) {
    // Identity: restore the original text exactly.
    binaryText.value = source;
  } else {
    const result = rotateBinaryGrid(bitmap, degX.value, degY.value, degZ.value);
    binaryText.value = result
      .map((row) => row.map((bit) => (bit ? "1" : "0")).join(""))
      .join("\n");
  }

  nextTick(() => {
    applyingRotation = false;
  });
}

/**
 * Public imperative API exposed to parent components.
 * `focusTextarea` is used by create-sprites to move focus to the binary input
 * after the user clicks the per-sprite "Add frame" button, so the next keystroke
 * lands in the textarea.
 */
defineExpose({
  focusTextarea: () => textareaRef.value?.focus(),
});
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ tp("sectionInput") }}
    </h2>

    <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
      <!-- Binary text input -->
      <div class="flex flex-1 flex-col gap-1">
        <label for="binary-input" class="text-xs font-semibold">
          {{ tp("binaryInputLabel") }}
        </label>
        <textarea
          id="binary-input"
          ref="textareaRef"
          v-model="binaryText"
          rows="10"
          spellcheck="false"
          autocomplete="off"
          class="w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)] focus:outline-none"
          :class="{ 'border-[color:var(--error-ink)]': validationError }"
          :placeholder="tp('binaryInputPlaceholder')"
        />
        <p
          v-if="validationError"
          class="text-xs font-semibold text-[color:var(--error-ink)]"
        >
          {{ validationError }}
        </p>
        <p v-else class="text-xs text-[color:var(--ink-soft)]">
          {{ tp("binaryInputHint") }}
        </p>
      </div>

      <!-- Live preview -->
      <div class="flex flex-col gap-1">
        <span class="text-xs font-semibold">{{ tp("previewLabel") }}</span>
        <div
          class="flex h-[256px] w-[256px] items-center justify-center border border-[color:var(--input-border)] bg-[color:var(--input-bg)]"
        >
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="Tile preview"
            class="max-h-full max-w-full"
            style="image-rendering: pixelated"
          />
          <span v-else class="text-xs text-[color:var(--ink-soft)]">–</span>
        </div>
      </div>
    </div>

    <!-- Add button aligned to the right -->
    <div class="mt-4 flex justify-end">
      <button
        class="inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-2 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="!parsedBitmap || !previewUrl"
        @click="onAdd"
      >
        {{ tp("addButton") }}
      </button>
    </div>

    <!-- Rotation controls -->
    <div class="mt-6 border-t border-[color:var(--border)] pt-4">
      <h3 class="text-xs font-semibold text-[color:var(--ink-soft)]">
        {{ tp("rotationLabel") }}
      </h3>
      <div class="mt-3 flex flex-wrap items-end gap-4">
        <!-- X -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold">{{ tp("rotationXLabel") }}</label>
          <input
            v-model.number="degX"
            type="number"
            step="1"
            class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-2 py-1 text-sm text-[color:var(--input-ink)] focus:outline-none"
          />
        </div>
        <!-- Y -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold">{{ tp("rotationYLabel") }}</label>
          <input
            v-model.number="degY"
            type="number"
            step="1"
            class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-2 py-1 text-sm text-[color:var(--input-ink)] focus:outline-none"
          />
        </div>
        <!-- Z -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold">{{ tp("rotationZLabel") }}</label>
          <input
            v-model.number="degZ"
            type="number"
            step="1"
            class="w-24 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-2 py-1 text-sm text-[color:var(--input-ink)] focus:outline-none"
          />
        </div>
        <!-- Apply button -->
        <button
          class="inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-4 py-1.5 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="!parsedBitmap"
          @click="applyRotation"
        >
          {{ tp("applyRotationButton") }}
        </button>
      </div>
    </div>
  </section>
</template>
