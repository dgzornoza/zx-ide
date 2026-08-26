<script setup lang="ts">
import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";
import { createTranslationPrefixFn } from "src/helpers/vue-utils";

const props = defineProps<{
  translationNamespace: string;
  codeGenerationType: CodeGenerationType;
}>();

const tp = createTranslationPrefixFn(props.translationNamespace);

/** ZX0 compression only applies to C (z88dk) projects. */
const showCompression = props.codeGenerationType === "c";
</script>

<template>
  <div>
    <dl class="space-y-1 text-sm">
      <div class="flex items-baseline gap-3">
        <dt class="w-32 shrink-0 text-xs font-semibold">
          {{ tp("projectTypeLabel") }}
        </dt>
        <dd class="font-mono">
          {{
            codeGenerationType === "c"
              ? tp("projectTypeC")
              : tp("projectTypeAsm")
          }}
        </dd>
      </div>
      <div v-if="showCompression" class="flex items-baseline gap-3">
        <dt class="w-32 shrink-0 text-xs font-semibold">
          {{ tp("compressionLabel") }}
        </dt>
        <dd class="font-mono">ZX0</dd>
      </div>
    </dl>
    <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
      {{ tp("projectTypeReadOnlyHint") }}
    </p>
  </div>
</template>
