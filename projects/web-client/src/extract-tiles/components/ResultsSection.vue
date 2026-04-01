<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  totalTiles: number;
  totalBytes: number;
}>();

const { t } = useI18n();

const formattedBytes = computed(() => {
  return props.totalBytes.toLocaleString() + " bytes";
});
</script>

<template>
  <section
    class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
  >
    <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
      {{ t("extract-tiles.resultsSectionTitle", "Resultados") }}
    </h2>
    <div class="mt-2 flex flex-col gap-2">
      <div>
        <span class="font-semibold">{{
          t("extract-tiles.totalTiles", "Total de tiles:")
        }}</span>
        <span class="ml-2">{{ totalTiles }}</span>
      </div>
      <div>
        <span class="font-semibold">{{
          t("extract-tiles.memoryUsage", "Memoria utilizada:")
        }}</span>
        <span class="ml-2">{{ formattedBytes }}</span>
      </div>
    </div>
  </section>
</template>
