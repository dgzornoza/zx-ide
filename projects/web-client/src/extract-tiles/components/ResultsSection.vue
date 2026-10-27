<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  tileCount: number;
  bitmapBytes: number;
  attributeBytes: number;
}>();

const { t } = useI18n();

const formattedBitmapBytes = computed(
  () => props.bitmapBytes.toLocaleString() + " bytes",
);

const formattedAttributeBytes = computed(
  () => props.attributeBytes.toLocaleString() + " bytes",
);

const hasAttributes = computed(() => props.attributeBytes > 0);
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold">
      {{ t("extract-tiles.resultsSectionTitle", "Resultados") }}
    </h2>
    <div class="mt-2 flex flex-col gap-2">
      <div>
        <span class="font-semibold">{{
          t("extract-tiles.totalTiles", "Total de tiles:")
        }}</span>
        <span class="ml-2">{{ tileCount }}</span>
      </div>
      <div>
        <span class="font-semibold">{{
          t("extract-tiles.memoryBitmap", "Memoria de tiles:")
        }}</span>
        <span class="ml-2">{{ formattedBitmapBytes }}</span>
      </div>
      <div v-if="hasAttributes" data-test="memory-attributes">
        <span class="font-semibold">{{
          t("extract-tiles.memoryAttributes", "Memoria de atributos:")
        }}</span>
        <span class="ml-2">{{ formattedAttributeBytes }}</span>
      </div>
    </div>
  </section>
</template>
