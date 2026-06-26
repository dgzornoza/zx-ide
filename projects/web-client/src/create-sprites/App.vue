<script setup lang="ts">
import BinaryInputPanel from "src/shared/components/BinaryInputPanel.vue";
import CodeGenerationSelector from "src/shared/components/CodeGenerationSelector.vue";
import SpritesEditorSection from "src/shared/components/SpritesEditorSection.vue";
import { ref } from "vue";
import { useCreateSprites } from "./composables/useCreateSprites";

const {
  state,
  status,
  binaryText,
  outputName,
  codeGenerationType,
  isCodeGenerationTypeReadOnly,
  spriteFlags,
  activeSpriteIndex,
  tp,
  addSprite,
  removeSprite,
  removeFrame,
  addSpriteFrame,
  addFrame,
  generateCode,
} = useCreateSprites();

/** Template ref to the BinaryInputPanel so we can focus its textarea when the user clicks "Add frame" on a sprite card. */
const binaryInputPanel = ref<InstanceType<typeof BinaryInputPanel> | null>(
  null,
);

function handleAddFrame(spriteIndex: number) {
  addSpriteFrame(spriteIndex);
  binaryInputPanel.value?.focusTextarea();
}
</script>

<template>
  <div class="min-h-screen px-6 py-8">
    <header class="w-full">
      <div class="text-2xl font-semibold">
        {{ tp("title") }}
      </div>
      <p class="mt-2 max-w-2xl text-sm text-[color:var(--ink-soft)]">
        {{ tp("subtitle") }}
      </p>
    </header>

    <main class="mt-6 flex w-full flex-col gap-4">
      <!-- Binary input panel: each "Add" click adds a frame to the active sprite -->
      <BinaryInputPanel
        ref="binaryInputPanel"
        v-model:binary-text="binaryText"
        translation-namespace="create-sprites"
        @add="addFrame"
      />

      <!-- Code generation type selector -->
      <section
        class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
      >
        <CodeGenerationSelector
          v-model:code-generation-type="codeGenerationType"
          translation-namespace="create-sprites"
          :read-only="isCodeGenerationTypeReadOnly"
        />
      </section>

      <!-- Sprites collection -->
      <SpritesEditorSection
        v-model:sprite-flags="spriteFlags"
        :sprites="state.sprites"
        :source-image="null"
        :show-frame-coords="false"
        :active-sprite-index="activeSpriteIndex"
        translation-namespace="create-sprites"
        @add-sprite="addSprite"
        @remove-sprite="removeSprite"
        @add-frame="handleAddFrame"
        @remove-frame="removeFrame"
      />
    </main>

    <footer class="mt-6 w-full">
      <div
        class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div
          v-if="status"
          class="text-xs font-semibold"
          :class="
            status.type === 'success'
              ? 'text-[color:var(--success-ink)]'
              : 'text-[color:var(--error-ink)]'
          "
        >
          {{ status.text }}
        </div>
        <div class="ml-auto flex items-center gap-3">
          <label for="output-name" class="text-xs font-semibold">
            {{ tp("outputNameLabel") }}
          </label>
          <input
            id="output-name"
            v-model="outputName"
            type="text"
            class="w-36 border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)] focus:outline-none"
            :placeholder="tp('outputNamePlaceholder')"
          />
          <button
            class="inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="state.sprites.length === 0"
            @click="generateCode"
          >
            {{ tp("create") }}
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>