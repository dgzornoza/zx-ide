<script setup lang="ts">
import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
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
  </div>
</template>
