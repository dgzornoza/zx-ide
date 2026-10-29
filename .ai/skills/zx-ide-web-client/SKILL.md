---
name: zx-ide-web-client
description: "Trigger: any change under projects/web-client (Vue 3 webview pages, components, composables, code generators, VS Code bridge, i18n, Tailwind, Vitest specs). Architecture, conventions and workflows of the zx-ide web-client. Load together with vue-best-practices."
metadata:
  author: "dgonzalez"
  version: "1.0"
---

# zx-ide web-client

## Activation Contract

Load when reading or editing anything under `projects/web-client/`, or when changing the message DTOs in `projects/shared/` that the web-client exchanges with the extension. Always load the `vue-best-practices` skill (`.ai/skills/vue-best-practices/SKILL.md`) together with this one.

Code style rules live in `.ai/rules/gov-typescript-code-style.md`; this skill adds the web-client architecture and the Vue-specific conventions on top of them.

## Big picture

- **Vue 3 + TypeScript** frontend built with Vite. It produces webview pages embedded inside the VS Code extension.
- The build output (`dist/`) is copied into the extension's `media/` folder by `projects/vscode-extension/scripts/sync-web-client.cjs`.
- One Vite entry per page. Each page has an HTML file at the project root and a folder under `src/` with `main.ts`, `App.vue`, `composables/` and, when needed, `components/` and `models/`:

| Page                  | Entry HTML                 | Main composable                                         |
| --------------------- | -------------------------- | ------------------------------------------------------- |
| Extract tiles         | `extract-tiles.html`       | `src/extract-tiles/composables/useExtractTiles.ts`      |
| Extract sprites       | `extract-sprites.html`     | `src/extract-sprites/composables/useExtractSprites.ts`  |
| Extract map tileset   | `extract-map-tileset.html` | `src/extract-map-tileset/composables/useExtractMapTileset.ts` |
| Create tiles          | `create-tiles.html`        | `src/create-tiles/composables/useCreateTiles.ts`        |
| Create sprites        | `create-sprites.html`      | `src/create-sprites/composables/useCreateSprites.ts`    |

## Folder layout

- `src/<page>/` — page-specific code. Never import from another page's folder; move shared code to `src/shared/` instead.
- `src/shared/components/` — components used by more than one page (`AssetsSourceSection`, `SpritesEditorSection`, `StatusBanner`, `TileGallery`, ...). `SpriteEditorItem` never writes to its `sprite` prop: it emits `update-sprite` / `update-frame` with the edited fields, `SpritesEditorSection` forwards them with the sprite index, and the page composable applies them (`updateSprite`, `updateSpriteFrame`).
- `src/shared/composables/` — shared composables: `useProjectTypeLock` (locks the code generation language to the project type; returns read-only refs plus `setCodeGenerationType` / `setUseZx0Compression`, which do nothing while locked), `useAssetsBridge` (assets list and asset bytes from the extension; `requestAssetBytes` rejects with `DomainError('errorAssetRequestTimeout', [path])` after `timeoutMilliseconds`, default 30 s, and pending requests reject with `errorAssetRequestCancelled` on unmount), `useGeneratedFilesWriter` (sends generated files and owns the status banner), `useSpriteAnimation`.
- `src/domain/code-generation/` — framework-agnostic code generation (no Vue). `code-generator-strategy.ts` holds the single `CodeGeneratorStrategy<TParams>`, `GeneratedFile` and the generic `createCodeGenerator(type, { c, asm })`; `code-formatting.ts` holds the shared text helpers (`defb` formatting, `buildDataSizeComment`). One folder per asset kind (`tiles/`, `sprites/`, `map-tileset/`), each with `<kind>-code-generation.ts` (params and helpers), `c-<kind>-code-generator.ts`, `asm-<kind>-code-generator.ts` and `<kind>-code-generator-factory.ts`. The output is pinned byte for byte by `code-generator-fixtures.spec.ts` and `code-generator-architectural-invariant.spec.ts`. Files generated for the user go through these strategies; never inline generation logic in components or composables.
- `src/domain/domain-error.ts` — `DomainError(key, args)`: errors the user can fix carry the i18n key (inside the page namespace) and its arguments; `message` keeps `key:arg1:arg2` only for logs. Throw it instead of `new Error('key:arg')` and format it from `error.key` / `error.args`, never by splitting the message (`toDomainError(error, fallbackKey)` wraps anything else).
- `src/domain/graphics-configuration/` — `.cfg` files are untrusted input: `parseTilesConfiguration` and `parseSpritesConfiguration` validate the JSON against `TilesMapModel` / `SpritesMapModel` and throw `DomainError('errorMapLoadFailed')`; the page keeps its state when a file is rejected.
- `src/shared/models/` — shared view models (`tilesDefinition`, `spriteDefinition`, `statusMessage`).
- `src/helpers/` — framework-agnostic utilities (image decoding, binary builders, ZX0 compression, string and file utilities).
- `src/test-utils/` — test builders.

## VS Code bridge

`src/bridge/vscode.ts` creates a `VscodeBridge` that wraps `acquireVsCodeApi()`. Its `postMessage` only accepts a `WebviewToExtensionMessage`. When running outside VS Code (standalone browser) `isAvailable` is `false` and `postMessage` throws.

The message contract lives in `projects/shared/bridge-messages.ts` (`ExtensionToWebviewMessage`, `WebviewToExtensionMessage`); the message DTOs live in `projects/shared/extract-graphics/extract-graphics-dtos.ts`. Import them through the `externalShared/*` alias. Every message carries a `messageType` discriminator. Add a new message to the DTOs and to the matching union first, never as an ad-hoc object literal, and add its handler on the extension side (`WebviewBaseCommand`) in the same change.

Receive extension messages only through `subscribeToExtensionMessage(messageType, handler)` from `src/bridge/extension-messages.ts`: it owns the single `window` `message` listener and routes each message by `messageType`. Never add a `window.addEventListener('message', ...)` of your own. Subscribe in `onMounted` and call the returned unsubscribe function in `onBeforeUnmount`.

Every page `main.ts` mounts through `mountWebviewApp(App)` (`src/bridge/mount-webview-app.ts`), never `createApp(...).mount(...)` directly: after `mount()` (all `onMounted` hooks have run) it posts `readyFromWebview`, and the extension sends `initFromExtension` and the assets list only after that message.

Send generated files only through `useGeneratedFilesWriter(tp)` (`src/shared/composables/useGeneratedFilesWriter.ts`): `writeFiles(files)` posts `writeFilesFromWebview` (or shows the page's `errorVsCodeRequired` outside VS Code), and the read-only `status` becomes success (`statusSent`) or the reported error only when `writeFilesResultFromExtension` arrives. Pages change the banner only through `setStatus` / `clearStatus` and render it with `<StatusBanner :status="status" />`.

## Vue conventions

- **Always Composition API with `<script setup lang="ts">`.** No Options API.
- Props: `defineProps<T>()`. Emits: `defineEmits<T>()` with explicit payload types.
- v-model: `defineModel<T>('name', { default: ... })`; use `required: true` when the model is mandatory.
- Avoid `ref()` of large external objects: use `shallowRef()` and `markRaw()` for library instances.
- Prefer `computed()` over `watchEffect()` for derived state.
- **Read-only state from composables:** when a composable returns reactive state that callers must not mutate, expose it with `readonly()` and provide explicit setter functions. Inside the composable, mutations go through the setter so the lock logic (for example the project-type restriction) can run.
- Composable files are named `useCamelCase.ts`; component files use PascalCase (`CodeGenerationInfo.vue`).
- In templates, use kebab-case tag names for cross-folder imports (`<binary-input-panel>`) and PascalCase when imported explicitly.
- `<template>` and `<script>` use 2-space indentation.

### Accessibility

- Form controls must have an associated `<label>` (`for=`/`id=` or wrapping the control).
- Decorative icons must have `aria-hidden="true"`.
- Interactive non-button elements (`<div role="button">`) need keyboard handlers.

## Styling

- **Tailwind CSS** utility classes are the default.
- Theme colors use CSS custom properties (`var(--button-bg)`, `var(--ink-soft)`, ...) that map to VS Code's webview theme tokens. Never hardcode colors.
- Never build Tailwind class names by string concatenation: Tailwind only generates classes it finds as complete literals in the source. Map each state to a full class name instead.

## Internationalization

- All user-facing text uses `vue-i18n`, configured in `src/i18n.ts`. Supported locales: `en`, `es`. The extension passes the editor locale via `window.__WEBVIEW_LOCALE__`.
- Use the runtime-only build of `vue-i18n` (aliased in `vite.config.ts`): the VS Code webview CSP forbids `unsafe-eval`, so messages must be plain strings with simple `{placeholder}` substitutions.
- Translation keys are namespaced by page (for example `extract-tiles.sourceLabel`). Use `createTranslationPrefixFn()` from `src/helpers/vue-utils.ts` to avoid repeating the prefix.
- Every new key is added to both `en` and `es`.

## Tests

- Vitest. Component tests use `@vue/test-utils` with the `jsdom` environment, declared with `// @vitest-environment jsdom` at the top of the spec.
- Specs sit next to the file they test, with the same name plus `.spec.ts`.
- Strict TDD: write the failing spec first.

## Workflows

Run every command from `projects/web-client/`:

- Dev server: `pnpm dev` (Vite, standalone browser mode).
- Build: `pnpm build` (production Vite build to `dist/`).
- Watch: `pnpm watch`.
- Type-check: `pnpm typecheck` (`vue-tsc --noEmit`).
- Tests: `pnpm test` (`vitest run`), `pnpm test:watch`.
- Lint: `pnpm lint` (ESLint with `eslint-plugin-vue`). Format: `pnpm format` / `pnpm format:check` (Prettier).
