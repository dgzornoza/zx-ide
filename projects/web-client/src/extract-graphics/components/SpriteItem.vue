<script setup lang="ts">
import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import { createTranslationPrefixFn } from "src/utils/vue-utils";

const tp = createTranslationPrefixFn("extract-graphics");

defineProps<{
  sprite: SpriteDefinition;
  spriteIndex: number;
}>();

const emit = defineEmits<{
  remove: [];
  "add-frame": [];
  "remove-frame": [frameIndex: number];
}>();
</script>

<template>
  <div
    class="space-y-3 border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
  >
    <!-- Sprite header: name / width / height / remove -->
    <div class="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_0.6fr_0.6fr_auto]">
      <div class="flex flex-col gap-1">
        <label for="sprite-name" class="text-xs font-semibold">{{
          tp("spriteNameLabel")
        }}</label>
        <input
          id="sprite-name"
          v-model="sprite.name"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="name"
          type="text"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="sprite-width" class="text-xs font-semibold">{{
          tp("spriteWidthLabel")
        }}</label>
        <input
          id="sprite-width"
          v-model.number="sprite.width"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="width"
          type="number"
          min="1"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label for="sprite-height" class="text-xs font-semibold">{{
          tp("spriteHeightLabel")
        }}</label>
        <input
          id="sprite-height"
          v-model.number="sprite.height"
          class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
          placeholder="height"
          type="number"
          min="1"
        />
      </div>
      <button
        class="h-[34px] self-end bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
        type="button"
        @click="emit('remove')"
      >
        {{ tp("remove") }}
      </button>
    </div>

    <!-- Frames list -->
    <div class="ml-6 space-y-2">
      <fieldset
        v-for="(frame, frameIndex) in sprite.frames"
        :key="`sprite-${spriteIndex}-frame-${frameIndex}`"
        class="space-y-2 border border-[color:var(--border)] px-2 pb-2"
      >
        <legend class="px-2 text-xs font-semibold text-[color:var(--ink-soft)]">
          {{ tp("frameLabel") }} {{ frameIndex + 1 }}
        </legend>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1.4fr_auto]">
          <div class="flex flex-col gap-1">
            <label for="frame-column" class="text-xs font-semibold">{{
              tp("columnLabel")
            }}</label>
            <input
              id="frame-column"
              v-model.number="frame.column"
              class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
              placeholder="column"
              type="number"
              min="0"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="frame-row" class="text-xs font-semibold">{{
              tp("rowLabel")
            }}</label>
            <input
              id="frame-row"
              v-model.number="frame.row"
              class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
              placeholder="row"
              type="number"
              min="0"
            />
          </div>
          <button
            class="h-[34px] self-end bg-[color:var(--danger-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--danger-ink)]"
            type="button"
            @click="emit('remove-frame', frameIndex)"
          >
            {{ tp("remove") }}
          </button>
        </div>
      </fieldset>
    </div>

    <button
      class="inline-flex items-center gap-2 bg-[color:var(--button-secondary-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
      type="button"
      @click="emit('add-frame')"
    >
      {{ tp("addFrame") }}
    </button>
  </div>
</template>
