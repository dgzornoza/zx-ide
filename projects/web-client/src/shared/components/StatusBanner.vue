<script setup lang="ts">
import type { StatusMessage } from 'src/shared/models/statusMessage';

defineProps<{
  /** Message to show; nothing is rendered when `undefined`. */
  status: Readonly<StatusMessage> | undefined;
}>();
</script>

<template>
  <div
    v-if="status"
    role="status"
    class="text-xs font-semibold"
    :class="status.type === 'success' ? 'text-[color:var(--success-ink)]' : 'text-[color:var(--error-ink)]'"
  >
    {{ status.text }}
  </div>
</template>
