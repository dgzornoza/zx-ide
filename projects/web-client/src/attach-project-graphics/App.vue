<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  CreateGraphicsMapMessage,
  SpriteDefinition,
  StatusMessage,
  TileDefinition,
} from "../../../shared/attach-project-graphics/graphics-map";
import { createVsCodeBridge } from "../bridge/vscode";

const { t } = useI18n();
const vscode = createVsCodeBridge();
const tp = (key: string, params?: Record<string, unknown>) =>
  t(`attach-project-graphics.${key}`, params ?? {});

const state = reactive({
  source: "",
  graphicsData: "",
  tiles: {
    count: 0,
    names: [] as string[],
  } as TileDefinition,
  sprites: [] as SpriteDefinition[],
});

const status = ref<StatusMessage | null>(null);
const selectedType = ref<"tiles" | "sprites" | "">("");

/**
 * syncronizes the tile names array with the tile count, ensuring that there are as many names as tiles,
 * and removing excess names if the count is reduced.
 * @param count - the number of tiles to synchronize with
 */
const syncTileNames = (count: number) => {
  const normalized = Math.max(0, Math.floor(count));
  if (normalized === state.tiles.names.length) {
    return;
  }
  if (normalized > state.tiles.names.length) {
    state.tiles.names.push(
      ...Array.from(
        { length: normalized - state.tiles.names.length },
        () => "",
      ),
    );
    return;
  }
  state.tiles.names.splice(normalized);
};

/**
 * watch tile count for synchronize the tile names accordingly.
 * @param value - the new tile count value to set
 */
watch(
  () => state.tiles.count,
  (value) => {
    syncTileNames(value);
  },
);

const createSprite = (): SpriteDefinition => ({
  name: "",
  width: 1,
  height: 1,
  frames: [
    {
      column: 0,
      row: 0,
    },
  ],
});

const addSprite = () => {
  state.sprites.push(createSprite());
};

const addSpriteFrame = (spriteIndex: number) => {
  const sprite = state.sprites[spriteIndex];
  if (!sprite) {
    return;
  }
  sprite.frames.push({
    column: 0,
    row: 0,
  });
};

const removeSpriteFrame = (spriteIndex: number, frameIndex: number) => {
  const sprite = state.sprites[spriteIndex];
  if (!sprite) {
    return;
  }
  sprite.frames.splice(frameIndex, 1);
};

const removeSprite = (index: number) => {
  state.sprites.splice(index, 1);
};

const setStatus = (ok: boolean, text: string) => {
  status.value = { ok, text };
};

/**
 * sends a message to the extension to create the graphics map with the provided data.
 * The message includes the source path, graphics data path, and either tile definitions or sprite definitions
 * based on the selected type. If the VSCode API is not available, it simulates a successful status response.
 */
const createMap = () => {
  status.value = null;
  if (!selectedType.value) {
    return;
  }
  const payload: CreateGraphicsMapMessage = {
    messageType: "create",
    data: {
      source: state.source.trim(),
      graphicsData: state.graphicsData.trim(),
      tileDefinitions:
        selectedType.value === "tiles"
          ? {
              count: state.tiles.count,
              names: state.tiles.names.map((name) => name ?? ""),
            }
          : null,
      spriteDefinitions:
        selectedType.value === "sprites"
          ? state.sprites.map((sprite) => ({
              name: sprite.name ?? "",
              width: sprite.width ?? 0,
              height: sprite.height ?? 0,
              frames: sprite.frames.map((item) => ({
                column: item.column ?? 0,
                row: item.row ?? 0,
              })),
            }))
          : [],
    },
  };

  vscode.postMessage(payload);

  if (!vscode.isAvailable) {
    setStatus(true, tp("statusSent"));
  }
};

/**
 * handles incoming messages from the extension,
 * specifically looking for status messages to update the status display in the UI.
 * It checks if the message type is "status" and updates the status accordingly.
 * @param event - the message event containing the data from the extension
 */
const handleMessage = (event: MessageEvent) => {
  const message = event.data as
    | { type?: string; ok?: boolean; text?: string }
    | undefined;
  if (!message || message.type !== "status") {
    return;
  }
  setStatus(Boolean(message.ok), String(message.text ?? ""));
};

/**
 * sets up the message event listener when the component is mounted
 * and cleans it up when the component is unmounted.
 * It also checks if the VSCode API is available and sets an initial status message if it's not.
 * Additionally, it ensures that there is at least one sprite definition available when the component loads.
 */
onMounted(() => {
  window.addEventListener("message", handleMessage);
  if (!vscode.isAvailable) {
    setStatus(false, tp("statusInvalid"));
  }
  if (!state.sprites.length) {
    addSprite();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage);
});
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
      <!-- Datos origen -->
      <section
        class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
      >
        <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
          {{ tp("sectionSource") }}
        </h2>
        <div class="mt-4 space-y-4">
          <div>
            <label class="text-xs font-semibold">{{ tp("sourceLabel") }}</label>
            <input
              v-model="state.source"
              class="mt-2 w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
              placeholder="assets/graphics/my.png"
              type="text"
            />
            <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
              {{ tp("sourceHint") }}
            </p>
          </div>
          <div>
            <label class="text-xs font-semibold">{{
              tp("graphicsLabel")
            }}</label>
            <input
              v-model="state.graphicsData"
              class="mt-2 w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
              placeholder="src/data/graphics"
              type="text"
            />
            <p class="mt-1 text-xs text-[color:var(--ink-soft)]">
              {{ tp("graphicsHint") }}
            </p>
          </div>
        </div>
      </section>

      <!-- Seccion Seleccion Tiles/Sprites -->
      <section
        class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
      >
        <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
          {{ tp("sectionTiles") }} / {{ tp("sectionSprites") }}
        </h2>
        <div class="mt-3 flex flex-col gap-2 text-sm">
          <label class="inline-flex items-center gap-2">
            <input v-model="selectedType" type="radio" value="tiles" />
            <span>{{ tp("sectionTiles") }}</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="selectedType" type="radio" value="sprites" />
            <span>{{ tp("sectionSprites") }}</span>
          </label>
        </div>
      </section>

      <!-- Seccion Tiles -->
      <section
        v-if="selectedType === 'tiles'"
        class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
      >
        <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
          {{ tp("sectionTiles") }}
        </h2>
        <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
          {{ tp("tilesHint") }}
        </p>
        <div class="mt-4 space-y-3 w-1/2">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold">{{
              tp("tilesCountLabel")
            }}</label>
            <input
              v-model.number="state.tiles.count"
              class="w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
              min="0"
              type="number"
            />
          </div>

          <div class="space-y-2" v-if="state.tiles.count > 0">
            <div
              v-for="(_, index) in state.tiles.count"
              :key="`tile-name-${index}`"
              class="flex flex-col gap-1"
            >
              <label class="text-xs font-semibold">
                {{ tp("tileNameLabel", { index: index + 1 }) }}
              </label>
              <input
                v-model="state.tiles.names[index]"
                class="w-full border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-sm text-[color:var(--input-ink)]"
                placeholder="name"
                type="text"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Seccion Sprites -->
      <section
        v-if="selectedType === 'sprites'"
        class="w-full border border-[color:var(--border)] bg-[color:var(--card)] p-4"
      >
        <h2 class="text-sm font-semibold text-[color:var(--ink-soft)]">
          {{ tp("sectionSprites") }}
        </h2>
        <p class="mt-2 text-xs text-[color:var(--ink-soft)]">
          {{ tp("spritesHint") }}
        </p>
        <div class="mt-4 space-y-3 w-1/2">
          <div
            v-for="(sprite, index) in state.sprites"
            :key="`sprite-${index}`"
            class="space-y-3 border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
          >
            <!-- Sprite row -->
            <div
              class="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_0.6fr_0.6fr_auto]"
            >
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold">{{
                  tp("spriteNameLabel")
                }}</label>
                <input
                  v-model="sprite.name"
                  class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
                  placeholder="name"
                  type="text"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold">{{
                  tp("spriteWidthLabel")
                }}</label>
                <input
                  v-model.number="sprite.width"
                  class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
                  placeholder="width"
                  type="number"
                  min="1"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold">{{
                  tp("spriteHeightLabel")
                }}</label>
                <input
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
                @click="removeSprite(index)"
              >
                {{ tp("remove") }}
              </button>
            </div>

            <!-- Frame row -->
            <div class="ml-6 space-y-2">
              <fieldset
                v-for="(frame, frameIndex) in sprite.frames"
                :key="`sprite-${index}-frame-${frameIndex}`"
                class="space-y-2 border border-[color:var(--border)] px-2 pb-2"
              >
                <legend
                  class="px-2 text-xs font-semibold text-[color:var(--ink-soft)]"
                >
                  {{ tp("frameLabel") }} {{ frameIndex + 1 }}
                </legend>
                <div
                  class="grid grid-cols-1 gap-2 md:grid-cols-[1.4fr_1.4fr_auto]"
                >
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold">{{
                      tp("columnLabel")
                    }}</label>
                    <input
                      v-model.number="frame.column"
                      class="border border-[color:var(--input-border)] bg-[color:var(--input-bg)] px-3 py-2 font-mono text-xs text-[color:var(--input-ink)]"
                      placeholder="column"
                      type="number"
                      min="0"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold">{{
                      tp("rowLabel")
                    }}</label>
                    <input
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
                    @click="removeSpriteFrame(index, frameIndex)"
                  >
                    {{ tp("remove") }}
                  </button>
                </div>
              </fieldset>
            </div>

            <button
              class="inline-flex items-center gap-2 bg-[color:var(--button-secondary-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
              type="button"
              @click="addSpriteFrame(index)"
            >
              {{ tp("addFrame") }}
            </button>
          </div>
        </div>
        <button
          class="mt-4 inline-flex items-center gap-2 bg-[color:var(--button-secondary-bg)] px-4 py-2 text-xs font-semibold text-[color:var(--button-secondary-ink)] hover:bg-[color:var(--button-secondary-hover)]"
          type="button"
          @click="addSprite"
        >
          {{ tp("addSprite") }}
        </button>
      </section>
    </main>

    <footer class="mt-6 w-full">
      <div
        class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <button
          class="inline-flex items-center gap-2 bg-[color:var(--button-bg)] px-5 py-3 text-sm font-semibold text-[color:var(--button-ink)] hover:bg-[color:var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          @click="createMap"
          :disabled="!selectedType"
        >
          {{ tp("create") }}
        </button>
        <div
          v-if="status"
          class="text-xs font-semibold"
          :class="
            status.ok
              ? 'text-[color:var(--success-ink)]'
              : 'text-[color:var(--error-ink)]'
          "
        >
          {{ status.text }}
        </div>
      </div>
    </footer>
  </div>
</template>
