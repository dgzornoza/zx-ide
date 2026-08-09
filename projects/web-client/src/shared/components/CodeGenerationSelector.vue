<script setup lang="ts">
import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { computed } from "vue";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";

const props = defineProps<{
  translationNamespace: string;
  readOnly?: boolean;
}>();

const tp = createTranslationPrefixFn(props.translationNamespace);

const codeGenerationType = defineModel<CodeGenerationType>(
  "codeGenerationType",
  {
    default: "c",
  },
);

const useZx0Compression = defineModel<boolean>("useZx0Compression", {
  default: true,
});

/** Compression is only meaningful for the C (z88dk) target. */
const isCompressionApplicable = computed(
  () => codeGenerationType.value === "c",
);
</script>

<template>
  <div>
    <span class="text-xs font-semibold">{{
      tp("codeGenerationTypeLabel")
    }}</span>
    <div class="mt-2 flex items-center gap-6">
      <label
        class="flex cursor-pointer items-center gap-2 text-sm"
        :class="{ 'cursor-default opacity-75': readOnly }"
      >
        <input
          type="radio"
          name="codeGenerationType"
          value="c"
          v-model="codeGenerationType"
          :disabled="readOnly"
          class="accent-[color:var(--button-bg)]"
        />
        {{ tp("codeGenerationTypeC") }}
      </label>
      <label
        class="flex cursor-pointer items-center gap-2 text-sm"
        :class="{ 'cursor-default opacity-75': readOnly }"
      >
        <input
          type="radio"
          name="codeGenerationType"
          value="asm"
          v-model="codeGenerationType"
          :disabled="readOnly"
          class="accent-[color:var(--button-bg)]"
        />
        {{ tp("codeGenerationTypeAsm") }}
      </label>
    </div>
    <p v-if="readOnly" class="mt-1 text-xs text-[color:var(--ink-soft)]">
      {{ tp("codeGenerationTypeReadOnlyHint") }}
    </p>

    <!-- ZX0 compression option (C mode only) -->
    <div class="mt-3">
      <label
        class="flex cursor-pointer items-center gap-2 text-sm"
        :class="{ 'cursor-default opacity-60': !isCompressionApplicable }"
      >
        <input
          type="checkbox"
          name="useZx0Compression"
          v-model="useZx0Compression"
          :disabled="!isCompressionApplicable"
          class="accent-[color:var(--button-bg)]"
        />
        {{ tp("useZx0CompressionLabel") }}
      </label>
      <p
        v-if="!isCompressionApplicable"
        class="mt-1 text-xs text-[color:var(--ink-soft)]"
      >
        {{ tp("useZx0CompressionAsmHint") }}
      </p>
    </div>
  </div>
</template>
