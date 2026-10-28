# Clean architecture refactor — vscode-extension + web-client

Objective: apply the clean-code / architecture improvements found in the 2026-10-27 review of `projects/vscode-extension` and `projects/web-client`, one task at a time.
Branch: to be created by the user (currently `main`; AGENTS.md forbids mutating git commands without per-command consent). Delivery: `ask-on-risk`; the user stages and commits each task after review.
Test runner: web-client `npm test` (Vitest); vscode-extension `npm test` (`@vscode/test-electron`, mocha) — no unit runner yet.

## Specs

- **S1** — Tooling works: `npm run lint` in `projects/vscode-extension` runs (today `airbnbTypescript` is referenced but never imported in `eslint.config.mjs:12`, so lint and `pretest` cannot run); web-client resolves `externalShared/*` at runtime in Vite (not only in `tsconfig`), and `tsconfig.json` includes the real HTML entries instead of the non-existent `index.html` / `extract-graphics.html`.
- **S2** — Every command declared in `projects/vscode-extension/package.json` is registered on activation. Today `zx-ide.extract-map-tileset` is bound in Inversify but never resolved in `activate()`, so it fails with "command not found". Register commands from a single list so a bound command cannot be forgotten.
- **S3** — Typed extension ⇄ webview message contract in `projects/shared`: `ExtensionToWebviewMessage` / `WebviewToExtensionMessage` discriminated unions on `messageType`; one dispatcher per side (extension `WebviewBaseCommand`, web-client bridge) with exhaustive handling; `postMessage` typed against the contract instead of `unknown`.
- **S4** — Webview ready handshake: the webview sends `readyFromWebview` once mounted and the extension sends `initFromExtension` and the assets list only after it, so no initial message is lost.
- **S5** — Real write-files result: `FileHelpers.writeFile` propagates failures; the extension answers with a typed `WriteFilesResultMessage` (`writeFilesResultFromExtension`, success/error); the web-client shows success or error only when that reply arrives.
- **S6** — One webview session per panel in `WebviewBaseCommand`: panel, message handlers and `onDidDispose` cleanup are scoped to the panel; replies go to the panel that sent the message; handlers are disposed when the panel closes.
- **S7** — z88dk services without leaks or unhandled crashes: configuration-change listener disposed; breakpoint `enable`/`disable` idempotent; task end handler tolerates tasks without `id`; missing `launch.json` / `.zxide.json` handled; `findIndex` `-1` handled in the asm breakpoint strategy; terminal output wait with timeout.
- **S8** — web-client: one `useGeneratedFilesWriter()` composable (read-only `status`, `writeFiles(files)`) and one `<StatusBanner>` component replace the copies in the five page composables / `App.vue` files.
- **S9** — web-client: `useProjectTypeLock` returns `readonly` state plus setters that respect the lock, typed with its `ProjectTypeLock` interface.
- **S10** — web-client: code generators (tiles, sprites, map tileset) move out of `composables/` to `src/domain/code-generation/{tiles,sprites,map-tileset}/`, sharing one `CodeGeneratorStrategy`, one `GeneratedFile`, common formatting helpers and one generic factory. Generated output unchanged.
- **S11** — `ZxideFile`, `MachineType`, `ProjectConfigurationType`, `NewProjectModel` defined once in `projects/shared` and used by `cli` and `vscode-extension`.
- **S12** — vscode-extension domain logic (`.map` report parsing, breakpoint mapping, generated-file routing) extracted to pure functions behind small ports, with Vitest unit tests.
- **S13** — web-client trust boundary: `.cfg` JSON validated (`parseTilesConfiguration` / `parseSpritesConfiguration`); `requestAssetBytes` with timeout and cleanup; typed `DomainError` instead of `"key:arg1:arg2"` strings.
- **S14** — Cleanup per `.ai/rules/gov-typescript-code-style.md`: dead code, `null`, abbreviations, Spanish comments, relative imports leaving the folder, `package.json` hygiene (web-client deps in the extension, husky v4 block, lint-staged glob).

Every task keeps existing user-visible behavior except the bugs it names.

## Tasks

| ID  | Specs | Project            | Route  | Status  | Evidence |
| --- | ----- | ------------------ | ------ | ------- | -------- |
| T1  | S1    | both               | inline | done (pending user review/commit) | ext lint RED (config load crash) → runs, 38 pre-existing rule errors; web-client typecheck 3 pre-existing errors (same on base), test 195/195, build OK |
| T2  | S2    | vscode-extension   | inline | pending |          |
| T3  | S3    | shared + both      | inline | pending |          |
| T4  | S4    | shared + both      | inline | pending |          |
| T5  | S5    | shared + both      | inline | pending |          |
| T6  | S6    | vscode-extension   | inline | pending |          |
| T7  | S7    | vscode-extension   | inline | pending |          |
| T8  | S8    | web-client         | inline | pending |          |
| T9  | S9    | web-client         | inline | pending |          |
| T10 | S10   | web-client         | inline | pending |          |
| T11 | S11   | shared + cli + ext | inline | pending |          |
| T12 | S12   | vscode-extension   | inline | pending |          |
| T13 | S13   | web-client         | inline | pending |          |
| T14 | S14   | both               | inline | pending |          |

Route: inline for all (one sequential unit at a time, user reviews each; no writer trigger).

## Log

- **L1** (2026-10-27, user): "quiero que hagas una revision del proyecto vscode-extension y web-client para indicarme mejoras aplicando codigo limipio y una buena arquitectura"
- **L2** (2026-10-28, user): "vale, vamos con la refactorizacion, crea las tareas y vamos una a una"
- **L3**: Specs S1–S14 come from the review findings, in the recommended order (tooling → registration bug → typed contract → lifecycle → web-client composables → domain moves → cleanup). Next: T1.
- **L4** (2026-10-28, T1): `eslint.config.mjs` — removed undefined `airbnbTypescript` (airbnb-typescript is not flat-config compatible), `globals.node` instead of `globals.browser`, ignores for `dist/out/media`, TS parser scoped to `**/*.ts`. Lint now runs and reports 38 pre-existing errors (22 no-floating-promises, 5 require-await, 3 no-return-await, 3 prefer-const, 2 no-var-requires, 1 each no-unused-vars/no-prototype-builtins/no-var); they are fixed in T7 (floating promises in z88dk) and T14 (rest), so `pretest` still fails until then. web-client: `externalShared` alias added to `vite.config.ts` (vitest inherits it), `tsconfig.json` includes `*.html` instead of missing files, trailing comma removed. Known failure: `npm run typecheck` has 3 TS2339 errors in `useExtractTiles.spec.ts:233,251,269` (`memoryUsage.value`), present on base too.
