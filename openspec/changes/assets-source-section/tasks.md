# Tasks — Assets Source Section

This change ships in three stacked PRs. Each PR is an autonomously mergeable work
unit: it leaves the repo in a green state, has its own verification command(s),
and rolls back without touching unrelated work. The split is mandatory and the
branch names below are the agreed feature-branch names.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200–1400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (extension foundation) → PR 2 (webview core) → PR 3 (wire-up) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes (resolved by user)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Note: the orchestrator pauses for user review BEFORE each commit; commits land
only after the user has seen the per-PR diff and explicitly approves.

## Deferred work (NOT in this change)

1. **Integration tests for the extension side** — the project’s
   `@vscode/test-electron` + Mocha harness has pre-existing bugs that prevent
   tests from running (ESM vs CJS mismatch in `tsconfig.json`, missing test
   script output path, CJS-interop imports, missing `.zxide.json` setup in the
   temp workspace, `AttachProjectMapTilesetCmd` never activated). Fixing the
   harness was out of scope for this change; PR 1 ships the code without
   tests. The 6 integration test cases from design §9.4 will land in a follow-up
   PR titled `test(extension): integration tests for assets-source-section`,
   once the harness is fixed.
2. **PR 2 / PR 3 test tasks** — the `useAssetsBridge.spec.ts`,
   `AssetsSourceSection.spec.ts`, `useExtractSprites.spec.ts`, and
   `useExtractTiles.spec.ts` specs are listed as RED tasks in PR 2 / PR 3 of
   this file. Strict TDD is active for `projects/web-client`, so the web-client
   PRs will keep those spec files.

---

## PR split overview

| PR | Branch | Intent | Files | Verification | Rollback surface |
| --- | --- | --- | --- | --- | --- |
| 1 | `feat/assets-source-section-extension` | Extension foundation (DTOs + helper + command hooks + subclass flips + governance rule). Ships DORMANT — no consumer imports the new types yet. **Integration tests deferred** to a separate PR (see Deferred work below). | 1 new + 9 modified (see PR 1 table below) | `npm --prefix projects/vscode-extension run compile` | Revert the single merge commit on `feat/assets-source-section-extension`. Subclass flags return to defaults; no consumer is impacted. |
| 2 | `feat/assets-source-section-webview` | Webview core (composable + component + specs + i18n). Ships DORMANT — the new component is unused at this point. | 3 new + 1 modified (see PR 2 table below) | `npm --prefix projects/web-client run test`, plus `npm --prefix projects/web-client run typecheck` and `npm --prefix projects/web-client run build` | Revert the single merge commit on `feat/assets-source-section-webview`. `useAssetsBridge` and `AssetsSourceSection.vue` are unused; deletion is a no-op for App.vue consumers. |
| 3 | `feat/assets-source-section-wire-up` | Wire-up (composable rework + App.vue swaps + final verification). This PR activates PR 1 + PR 2 in the two consumers. | 4 new + 4 modified (see PR 3 table below) | `npm --prefix projects/web-client run typecheck && npm --prefix projects/web-client run test && npm --prefix projects/web-client run build`, plus `npm --prefix projects/vscode-extension run build` | Revert the single merge commit on `feat/assets-source-section-wire-up`. `SourceSection.vue` is restored; composables revert to `setSourceFile(file: File)`. |

Each PR depends on the previous ones being merged to `main` (stacked-to-main
strategy, subject to the `Decision needed before apply: Yes` gate resolving the
chain strategy).

---

## PR 1 — Extension foundation

Branch: `feat/assets-source-section-extension`
Depends on: `main` (no prior PR required)
Test command: `npm --prefix projects/vscode-extension run pretest && npm --prefix projects/vscode-extension run test`

### Files touched

| Path | Kind | Owner |
| --- | --- | --- |
| `projects/shared/extract-graphics/extract-graphics-dtos.ts` | modify | implementation |
| `projects/shared/infrastructure.ts` | modify | implementation |
| `projects/vscode-extension/src/core/helpers/file-helpers.ts` | modify | implementation |
| `projects/vscode-extension/src/core/helpers/assets-helpers.ts` | new | implementation |
| `projects/vscode-extension/src/commands/webview-base.cmd.ts` | modify | implementation |
| `projects/vscode-extension/src/commands/attach-project-tiles.cmd.ts` | modify | implementation |
| `projects/vscode-extension/src/commands/attach-project-sprites.cmd.ts` | modify | implementation |
| `projects/vscode-extension/src/commands/attach-project-map-tileset.cmd.ts` | modify | implementation |
| `projects/vscode-extension/src/commands/create-sprites.cmd.ts` | modify | implementation |
| `projects/vscode-extension/src/test/suite/extract-webview-cmd.test.ts` | **deferred** (see Risks) | — |
| `.ai/rules/vscode-extension.md` | modify | implementation |

### Tasks

- [x] [vscode-extension] Extend `VsCodeBridgeMessageType` in `projects/shared/infrastructure.ts` with `"assetsListFromExtension" | "readAssetRequestFromWebview" | "readAssetResponseFromExtension"`. Existing tags (`init`, `writeFiles`, `saveMap`) renamed under the same `FromExtension`/`FromWebview` convention. No consumer imports the additions yet. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] Add `AssetsEntry`, `AssetsListMessage`, `ReadAssetRequestMessage`, and `ReadAssetResponseMessage` to `projects/shared/extract-graphics/extract-graphics-dtos.ts` exactly as pinned in design §2.1 (use `?: boolean` for `missing`; no `null`). <!-- sdd-owner: implementation -->
- [x] [vscode-extension] Add `FileHelpers.readDirectory(absolutePath)` returning `[name, FileType][]` and `FileHelpers.readFileBytes(absolutePath)` returning raw `Uint8Array` (no UTF-8 decoding) to `projects/vscode-extension/src/core/helpers/file-helpers.ts`. This is the missing primitive other helpers compose. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] Implement `AssetsHelpers.scanAssetsDirectory(workspaceFolderUri)` as a `public static async` method in `projects/vscode-extension/src/core/helpers/assets-helpers.ts` (`AssetsHelpers` static-method class, modelled on `FileHelpers` / `WorkspaceHelpers`, NOT in the Inversify container): recursive walk using `FileHelpers.readDirectory` (NOT `vscode.workspace.fs.readDirectory` directly), filter by `.png` / `.zxp` (case-insensitive), compute `configurationExists` inline by inspecting the same directory listing tuple for the sibling `.cfg`, sort lexicographically by workspace-relative forward-slash path, return `{ assets, missing }`. The missing-directory probe uses `FileHelpers.fileExists(assetsUri)`. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] Implement `AssetsHelpers.readAssetFile(workspaceFolderUri, workspaceRelativePath)` as a `public static async` method on the same class: build the target URI with `vscode.Uri.joinPath(workspaceFolderUri, "assets", safePath)`, call `FileHelpers.readFileBytes(targetUri)`; throw when the entry is missing or unreadable so the caller can wrap the error into the `error` field. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] Modify `projects/vscode-extension/src/commands/webview-base.cmd.ts` to add a protected `requiresAssetsList(): boolean { return false; }` hook and a private async `postAssetsList()` that calls `WorkspaceHelpers.getWorkspaceUri()` (NEVER the private `findZxideWorkspaceFolder`), invokes `AssetsHelpers.scanAssetsDirectory`, surfaces `vscode.window.showErrorMessage` on `result.missing`, and posts the `AssetsListMessage` via `this.panel.webview.postMessage`. Wire it into `execute()` after the `InitMessage` post, guarded by `requiresAssetsList()`. Import `AssetsHelpers` from `@core/helpers/assets-helpers` (replaces the free-function import from the original draft). <!-- sdd-owner: implementation -->
- [x] [vscode-extension] In the same file, extend `onDidReceiveMessage` to handle `ReadAssetRequestMessage` by calling a new private `handleReadAssetRequest(request)` that resolves the workspace URI via `WorkspaceHelpers.getWorkspaceUri()`, invokes `AssetsHelpers.readAssetFile`, base64-encodes the bytes, and posts a `ReadAssetResponseMessage`; on error post a response with `error` set and no `contentBase64`. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] In `projects/vscode-extension/src/commands/attach-project-tiles.cmd.ts`, override `protected requiresAssetsList(): boolean { return true; }` so the panel posts the assets list on open. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] In `projects/vscode-extension/src/commands/attach-project-sprites.cmd.ts`, override `protected requiresAssetsList(): boolean { return true; }` so the panel posts the assets list on open. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] In `projects/vscode-extension/src/commands/attach-project-map-tileset.cmd.ts`, override `protected requiresAssetsList(): boolean { return false; }` explicitly so the panel NEVER scans `assets/`. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] In `projects/vscode-extension/src/commands/create-sprites.cmd.ts`, override `protected requiresAssetsList(): boolean { return false; }` so this entry point stays source-image-free. <!-- sdd-owner: implementation -->
- [x] [governance] Capture the helper-only filesystem rule in `.ai/rules/vscode-extension.md` (new § Helper-only filesystem and workspace access under Project conventions): all FS access MUST go through `FileHelpers`; all workspace URI building MUST go through `WorkspaceHelpers.getWorkspaceUri`; if a new filesystem operation is needed, add it to `FileHelpers` first. <!-- sdd-owner: implementation -->
- [x] [vscode-extension] PR 1 verification: `npm --prefix projects/vscode-extension run compile` MUST pass; `extract-map-tileset` and `create-sprites` webviews MUST keep their current behaviour — no consumer yet imports the new types. Integration tests deferred to a separate PR — see Risks. <!-- sdd-owner: implementation -->

### Parent actions (lifecycle gates only)

- [ ] Request a bounded review of the merged PR 1 commit before PR 2 begins; gate is `reviewGate.result: allow`. <!-- sdd-owner: parent -->

---

## PR 2 — Webview core

Branch: `feat/assets-source-section-webview`
Depends on: PR 1 merged to `main`
Test command: `npm --prefix projects/web-client run test`

### Files touched

| Path | Kind | Owner |
| --- | --- | --- |
| `projects/web-client/src/shared/composables/useAssetsBridge.ts` | new | implementation |
| `projects/web-client/src/shared/composables/useAssetsBridge.spec.ts` | new | implementation |
| `projects/web-client/src/shared/components/AssetsSourceSection.vue` | new | implementation |
| `projects/web-client/src/shared/components/AssetsSourceSection.spec.ts` | new | implementation |
| `projects/web-client/src/i18n.ts` | modify | implementation |

### Tasks

- [ ] [web-client] Write failing Vitest spec in `projects/web-client/src/shared/composables/useAssetsBridge.spec.ts` (RED): when `AssetsListMessage { assets: [...], missing: true }` is dispatched on `window.message`, the composable's `assets` and `missing` refs reflect the payload exactly. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED): `requestAssetBytes("characters/player.png")` calls `window.postMessage` with `{ messageType: "readAssetRequest", path: "characters/player.png", requestId }` where `requestId` is a fresh non-empty string. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED): dispatching a `readAssetResponse` whose `requestId` matches a pending request resolves the promise to the base64-decoded `Uint8Array`; dispatching a mismatched `requestId` is a no-op (no throw, refs unchanged). <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED): a `readAssetResponse` with `error: "file not found"` causes the pending promise to reject with `new Error("file not found")`. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED): on unmount, `window.removeEventListener("message", ...)` is called once and a subsequent dispatch is not observed. <!-- sdd-owner: implementation -->
- [ ] [web-client] GREEN: implement `projects/web-client/src/shared/composables/useAssetsBridge.ts` per design §5 — refs for `assets`, `missing`; `pendingRequests` map keyed by `requestId`; `requestAssetBytes` builds a UUID `requestId` and posts `readAssetRequest`; `onWindowMessage` updates refs on `assetsList` and resolves/rejects pending requests on `readAssetResponse`; `onMounted` adds the listener, `onBeforeUnmount` removes it. Use `base64ToBytes` from `src/helpers/binary-utils.ts`. <!-- sdd-owner: implementation -->
- [ ] [web-client] TRIANGULATE: extend `useAssetsBridge.spec.ts` with a concurrent-request case where two `requestAssetBytes` calls fire in parallel; each resolves only when its matching `requestId` arrives (cross-delivery rejection). <!-- sdd-owner: implementation -->
- [ ] [web-client] REFACTOR: extract `decodeResponse(response)` into a private helper inside `useAssetsBridge.ts` so the listener body stays flat; rerun the suite. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) in `projects/web-client/src/shared/components/AssetsSourceSection.spec.ts` for the populated-list case: one `<option>` per entry plus a placeholder whose `value=""`; subsequent options carry `value === entry.path` and matching text. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for the empty-list case (`assets=[]`, `missing=false`): exactly one `<option>` (the placeholder) and the select is NOT disabled. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for the missing-directory case (`missing=true`): the `<select>` carries the `disabled` attribute AND the banner paragraph contains both `assetsSourceSection.missingAssetsTitle` and `assetsSourceSection.missingAssetsHint` text. <!-- sdd-owner: implementation -->

- [ ] [web-client] Write failing Vitest spec (RED) for selection change: `wrapper.find("select").setValue("characters/player.png")` emits `image-changed` with `"characters/player.png"` and updates the `source` model. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for the configuration label: when `source.value === "characters/player.png"` and `configurationExists: true`, the label text is `characters/player.cfg` plus the `assetsSourceSection.configurationExists` indicator; when `configurationExists: false`, the label shows `assetsSourceSection.configurationMissing`. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for accessibility: a `<label for="assets-source-select">` is present in the rendered DOM. <!-- sdd-owner: implementation -->
- [ ] [web-client] GREEN: add `assetsSourceSection` block to the `en` and `es` sections of `projects/web-client/src/i18n.ts` exactly with the keys/strings pinned in design §8 (`sectionSource`, `selectImageLabel`, `selectImageHint`, `configurationLabel`, `configurationExists`, `configurationMissing`, `placeholderPrompt`, `listTruncated`, `missingAssetsTitle`, `missingAssetsHint`). <!-- sdd-owner: implementation -->
- [ ] [web-client] GREEN: create `projects/web-client/src/shared/components/AssetsSourceSection.vue` per design §4 — props `{ translationNamespace, assets, missing }`; `defineModel<string>("source", { required: true })`; emits `image-changed`; computed `selectedEntry` and `expectedConfigurationPath`; template matches design §4.2 (Tailwind via shared CSS variables `--border`, `--card`, `--ink-soft`, `--error-ink`, `--error-bg`, `--input-border`, `--input-bg`, `--input-ink`, `--success-ink`). <!-- sdd-owner: implementation -->
- [ ] [web-client] TRIANGULATE: extend `AssetsSourceSection.spec.ts` with a multilingual case — set `translationNamespace` and assert the placeholder text matches `i18n.ts[languageCode].assetsSourceSection.placeholderPrompt` for both `en` and `es`. <!-- sdd-owner: implementation -->
- [ ] [web-client] REFACTOR: factor the `<select>` block into a sub-component or `v-if` guard if the template exceeds ~80 lines; rerun the suite plus `npm --prefix projects/web-client run lint`. <!-- sdd-owner: implementation -->
- [ ] [web-client] PR 2 verification: `npm --prefix projects/web-client run typecheck && npm --prefix projects/web-client run test && npm --prefix projects/web-client run build` MUST pass. `useAssetsBridge` and `AssetsSourceSection.vue` are exported but unused; no App.vue import path changes. <!-- sdd-owner: implementation -->

### Parent actions (lifecycle gates only)

- [ ] Request a bounded review of the merged PR 2 commit before PR 3 begins; gate is `reviewGate.result: allow`. <!-- sdd-owner: parent -->

---

## PR 3 — Wire-up

Branch: `feat/assets-source-section-wire-up`
Depends on: PR 1 and PR 2 merged to `main`
Test commands: `npm --prefix projects/web-client run typecheck`, `npm --prefix projects/web-client run test`, `npm --prefix projects/web-client run build`, `npm --prefix projects/vscode-extension run build`

### Files touched

| Path | Kind | Owner |
| --- | --- | --- |
| `projects/web-client/src/extract-sprites/composables/useExtractSprites.ts` | modify | implementation |
| `projects/web-client/src/extract-sprites/composables/useExtractSprites.spec.ts` | new | implementation |
| `projects/web-client/src/extract-tiles/composables/useExtractTiles.ts` | modify | implementation |
| `projects/web-client/src/extract-tiles/composables/useExtractTiles.spec.ts` | new | implementation |
| `projects/web-client/src/extract-sprites/App.vue` | modify | implementation |
| `projects/web-client/src/extract-tiles/App.vue` | modify | implementation |

### Tasks

- [ ] [web-client] Write failing Vitest spec (RED) in `projects/web-client/src/extract-sprites/composables/useExtractSprites.spec.ts`: `setSourceImage("characters/player.png", pngBytes)` sets `state.source` to `"player.png"`, populates `currentImageFile.value` as a `File` named `player.png` with type `image/png`, and calls `extractSpritesFromFile` exactly once. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for the ZXP path: `setSourceImage("tileset.zxp", zxpBytes)` delegates to `convertZxpFileToImageFile` with a `File` whose name is `tileset.zxp` and whose content equals `zxpBytes`. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) for state preservation: after defining two sprites and calling `setSourceImage` with a second image, the sprites array is byte-identical to its pre-call snapshot. <!-- sdd-owner: implementation -->
- [ ] [web-client] GREEN: rework `projects/web-client/src/extract-sprites/composables/useExtractSprites.ts` — replace `setSourceFile(file: File)` with `setSourceImage(path: string, bytes: Uint8Array)` per design §6.1; switch `currentImageFile` from `ref<File | null>(null)` to `ref<File | undefined>(undefined)`; on error call `setStatus("error", tp("errorSourceFileLoad"))`. Do NOT touch `state.sprites` / `spriteFlags` / `tileWidth` / `tileHeight` / `excludedSet`. <!-- sdd-owner: implementation -->
- [ ] [web-client] REFACTOR: factor `setSourceImage`'s ZXP branch into a private helper `decodeZxpBytes(bytes: Uint8Array, name: string): Promise<File>`; rerun the suite. <!-- sdd-owner: implementation -->
- [ ] [web-client] Write failing Vitest spec (RED) in `projects/web-client/src/extract-tiles/composables/useExtractTiles.spec.ts` mirroring the three cases above for tiles (extraction calls `extractTiles`; tiles named `hero`, `enemy`, `coin` survive a switch; ZXP path delegates to `convertZxpFileToImageFile`). <!-- sdd-owner: implementation -->
- [ ] [web-client] GREEN: rework `projects/web-client/src/extract-tiles/composables/useExtractTiles.ts` symmetrically — `setSourceImage(path, bytes)`, `currentImageFile: File | undefined`, no mutation of `state.tiles` or related fields. <!-- sdd-owner: implementation -->
- [ ] [web-client] REFACTOR: extract `decodeZxpBytes` shared between the two composables into `projects/web-client/src/shared/helpers/image-source.ts`; rerun both spec suites. <!-- sdd-owner: implementation -->
- [ ] [web-client] Modify `projects/web-client/src/extract-sprites/App.vue`: replace the `<SourceSection>` import with `AssetsSourceSection`; instantiate `useAssetsBridge()`; bind `assets`, `missing` to the component props; subscribe to `image-changed` and call `useExtractSprites().setSourceImage(path, await requestAssetBytes(path))`; gate the page's Create button on `!missing`. <!-- sdd-owner: implementation -->
- [ ] [web-client] Modify `projects/web-client/src/extract-tiles/App.vue` symmetrically — same `<SourceSection>` → `<AssetsSourceSection>` swap, same `useAssetsBridge` wiring, same Create-button gate. <!-- sdd-owner: implementation -->
- [ ] [web-client] Run `npm --prefix projects/web-client run lint` and confirm zero new warnings introduced by the swap. <!-- sdd-owner: implementation -->
- [ ] [web-client] PR 3 webview verification: `npm --prefix projects/web-client run typecheck && npm --prefix projects/web-client run test && npm --prefix projects/web-client run build` MUST pass. `extract-sprites` and `extract-tiles` MUST render `<AssetsSourceSection>`; `extract-map-tileset` MUST still render `<SourceSection>`. <!-- sdd-owner: implementation -->
- [ ] [vscode-extension] PR 3 extension verification: `npm --prefix projects/vscode-extension run build` MUST pass; rerun `npm --prefix projects/vscode-extension run test` to confirm no integration test regressed after the wire-up landed. <!-- sdd-owner: implementation -->

### Parent actions (lifecycle gates only)

- [ ] Request a bounded review of the merged PR 3 commit; gate is `reviewGate.result: allow`. <!-- sdd-owner: parent -->
- [ ] After all three PRs are merged, run `sdd-verify` against the merged `main` to confirm every spec scenario (R1–R9, S1–S6) is satisfied end-to-end. <!-- sdd-owner: parent -->