# Copilot instructions — Web-client

Uso: aplicar estas instrucciones cuando trabajes en el proyecto `projects/web-client`. Incluye arquitectura Vue 3, composables, bridge con VS Code y convenciones de i18n y estilado.

---

# Copilot instructions for zx-ide web-client

## Big picture

- This is a **Vue 3 + TypeScript** frontend built with Vite. It produces webview pages that are embedded inside the VS Code extension.
- Entry HTML page: [extract-graphics.html](extract-graphics.html) → mounts [src/extract-graphics/main.ts](src/extract-graphics/main.ts) → renders [App.vue](src/extract-graphics/App.vue).
- The build output (`dist/`) is copied into the extension's `media/` folder by [scripts/sync-web-client.cjs](../vscode-extension/scripts/sync-web-client.cjs).

## Skills

Los siguientes skills de Copilot están disponibles para este proyecto (se encuentran en `.github/skills`). Cárgalos antes de trabajar en los temas relacionados:

- **vue-best-practices**: MUST be used for Vue.js tasks. Recomienda usar Composition API con `<script setup>` y TypeScript. Cargar para `.vue` files, composables, Vue Router, Pinia o trabajo con Vite + Vue. Ver [.github/skills/vue-best-practices/SKILL.md](.github/skills/vue-best-practices/SKILL.md) para detalles y referencias.

Si aparecen nuevos skills relacionados aplicables a este proyecto, añádelos a la carpeta `.github/skills` y actualiza esta sección.

## Architecture

### Component tree (extract-graphics)

```
App.vue
├── SourceSection.vue     — PNG + .map file inputs, code generation type radio
├── TypeSelector.vue      — tiles / sprites toggle
├── TilesSection.vue      — tile grid config
└── SpritesSection.vue    — sprite definitions
```

### Composables

| File                                                                                  | Responsibility                                                                                               |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [useExtractGraphics.ts](src/extract-graphics/composables/useExtractGraphics.ts)       | Main state machine: source files, tile extraction, sprite actions, VS Code bridge messaging, file generation |
| [codeGenerators.ts](src/extract-graphics/composables/codeGenerators.ts)               | Pure functions that produce C header (`.h`) and Z88DK assembly (`.asm`) source code from tile bitmask data   |
| [graphicsMapValidation.ts](src/extract-graphics/composables/graphicsMapValidation.ts) | Validation logic for graphics map data                                                                       |

### VS Code bridge

[src/bridge/vscode.ts](src/bridge/vscode.ts) creates a `VscodeBridge` that wraps `acquireVsCodeApi()`. When running outside VS Code (standalone browser), it falls back to console logging.

Messages exchanged with the extension are defined in the **shared** DTOs at [../../shared/extract-graphics/extract-graphics-dtos.ts](../../shared/extract-graphics/extract-graphics-dtos.ts):

| Message             | Direction           | Purpose                                                                            |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `InitMessage`       | Extension → Webview | Sends project type so the webview can pre-select and lock code generation language |
| `WriteFilesMessage` | Webview → Extension | Generated source files to write into the workspace                                 |
| `SaveMapMessage`    | Webview → Extension | `.map` file to save                                                                |

### Internationalisation

All user-facing text uses `vue-i18n` configured in [src/i18n.ts](src/i18n.ts). Supported locales: `en`, `es`. The VS Code extension passes the editor locale via `window.__WEBVIEW_LOCALE__`.

Translation keys are namespaced by page (e.g. `extract-graphics.sourceLabel`). Use the `createTranslationPrefixFn()` helper from [src/utils/vue-utils.ts](src/utils/vue-utils.ts) to avoid repeating the prefix.

## Conventions

- **Composition API with `<script setup>`** and TypeScript — always. No Options API.
- Source code (identifiers, inline comments, doc comments, and developer-facing messages) must be written in English.
- No abbreviations in variable/property names (e.g. `codeGenerationType`, not `codeGenType`). For loop/iteration variables, `item` is acceptable as a generic loop variable name.
- Never use single-letter or shortened parameter names (e.g. `newValue` not `v`, `spriteIndex` not `i` unless it is a generic `item` iteration).
- Styling via **Tailwind CSS** with CSS custom properties for theming (`var(--button-bg)`, `var(--ink-soft)`, etc.). These map to VS Code's webview theme tokens.
- Models use `defineModel()` (Vue 3.4+). Props use `defineProps<T>()`.
- Files generated for the user go through `codeGenerators.ts`; do not inline generation logic in components.

## Developer workflows

- Dev server: `npm run dev` (Vite dev server, standalone browser mode)
- Build: `npm run build` (production Vite build → `dist/`)
- Watch: `npm run build:watch`
- Type-check: `npm run typecheck` (`vue-tsc --noEmit`)

## Utilities

| File                                                 | Purpose                                         |
| ---------------------------------------------------- | ----------------------------------------------- |
| [src/utils/html-utils.ts](src/utils/html-utils.ts)   | `downloadBlob()` for browser-mode ZIP downloads |
| [src/utils/image-utils.ts](src/utils/image-utils.ts) | PNG tile extraction (canvas-based)              |
| [src/utils/vue-utils.ts](src/utils/vue-utils.ts)     | `createTranslationPrefixFn()` i18n helper       |
