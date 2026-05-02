<script setup lang="ts">
defineProps<{
  src?: string;
  alt?: string;
  isActive?: boolean;
}>();
</script>

<template>
  <div class="ml-4 flex">
    <div
      class="justify-left border p-1"
      :class="
        isActive
          ? 'border-[color:var(--focus-border,var(--success-ink))]'
          : 'border-[color:var(--border)]'
      "
    >
      <img
        v-if="src"
        :src="src"
        :alt="alt"
        style="
          width: 40px;
          height: 40px;
          object-fit: contain;
          image-rendering: pixelated;
        "
      />
      <div
        v-else
        class="bg-[color:var(--border)]"
        style="width: 40px; height: 40px"
      />
    </div>
  </div>
</template>
