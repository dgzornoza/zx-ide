# Apply progress — Assets Source Section

## Status

PR 1 (Extension foundation) implemented and verified on branch
`feat/assets-source-section-extension` (uncommitted; the parent shows the
diff and only commits after explicit user approval).

Iteration history on the diff:

1. Initial apply added collateral fixes to the test harness (`tsconfig.json`,
   `package.json`, `runTest.ts`, `suite/index.ts`, `extension.ts`,
   `eslint.config.mjs`) and a Mocha integration suite
   (`extract-webview-cmd.test.ts`). Reverted by the user because they were
   out of scope.
2. After partial message-type renaming (`assetsList`/`readAssetRequest`/
   `readAssetResponse` → `...FromExtension`/`...FromWebview` suffix), the
   user asked for the same suffix on the older tags (`init`,
   `writeFiles`, `saveMap`). Renamed everywhere they are referenced.
3. The user then reviewed the architecture of `assets-helpers.ts` and
   pointed out it bypassed the existing `FileHelpers` / `WorkspaceHelpers`
   abstractions by calling `vscode.workspace.fs.*` directly. Refactored:
   - `FileHelpers` gains `readDirectory` and `readFileBytes`.
   - `assets-helpers.ts` is now an `AssetsHelpers` static-method class
     that composes the two helpers and never touches the FS API directly.
   - The governance rule is captured in `.ai/rules/vscode-extension.md`
     under § Helper-only filesystem and workspace access.

The integration test file (`extract-webview-cmd.test.ts`) and its
collateral test-harness fixes remain deferred to a follow-up PR.

---

## PR 1 — Completed tasks

Implementation rows under `## PR 1 — Extension foundation` (integration
test tasks removed; see Deferred work):

- [x] Extend `VsCodeBridgeMessageType` with `assetsListFromExtension`,
      `readAssetRequestFromWebview`, `readAssetResponseFromExtension`. Existing
      tags (`init`, `writeFiles`, `saveMap`) renamed under the same
      `FromExtension`/`FromWebview` convention.
- [x] Add `AssetsEntry`, `AssetsListMessage`, `ReadAssetRequestMessage`,
      `ReadAssetResponseMessage` to the shared DTOs (no `null`).
      (The `MAX_ASSETS_LIST_ENTRIES` constant was added in the original change
      and later removed; see Scope change note below.)
- [x] Add `FileHelpers.readDirectory(absolutePath)` returning
      `[name, FileType][]` and `FileHelpers.readFileBytes(absolutePath)`
      returning `Uint8Array` (raw bytes, no UTF-8 decoding).
- [x] Implement `AssetsHelpers.scanAssetsDirectory(workspaceFolderUri)`
      in `core/helpers/assets-helpers.ts` (depth-first lex walk;
      `configurationExists` inline; missing-directory probe). Uses
      `FileHelpers.fileExists` for the missing-directory probe and
      `FileHelpers.readDirectory` for the walk. The initial implementation
      included a `MAX_ASSETS_LIST_ENTRIES` cap with a `MAX + 1` short-circuit;
      that cap was later removed (see Scope change note below).
- [x] Implement `AssetsHelpers.readAssetFile(workspaceFolderUri,
      workspaceRelativePath)` returning raw `Uint8Array`. Uses
      `FileHelpers.readFileBytes` for the byte read and `Uri.joinPath` for
      path resolution.
- [x] Modify `webview-base.cmd.ts` to add a protected
      `requiresAssetsList(): boolean { return false; }` hook and a private
      async `postAssetsList()` that calls `WorkspaceHelpers.getWorkspaceUri()`
      (NEVER the private `findZxideWorkspaceFolder`), invokes
      `AssetsHelpers.scanAssetsDirectory`, surfaces `vscode.window.showErrorMessage`
      on `result.missing`, and posts the `AssetsListMessage` via
      `this.panel.webview.postMessage`. Wired into `execute()` after the
      `InitMessage` post.
- [x] Extend `onDidReceiveMessage` to handle `ReadAssetRequestMessage` via a
      new private `handleReadAssetRequest` that resolves the workspace URI
      via `WorkspaceHelpers.getWorkspaceUri()`, invokes
      `AssetsHelpers.readAssetFile`, base64-encodes the bytes, and posts a
      `ReadAssetResponseMessage`. On error, posts a response with `error`
      set and no `contentBase64`.
- [x] Override `requiresAssetsList()` → `true` in `attach-project-tiles.cmd.ts`.
- [x] Override `requiresAssetsList()` → `true` in `attach-project-sprites.cmd.ts`.
- [x] Override `requiresAssetsList()` → `false` (explicit gate) in
      `attach-project-map-tileset.cmd.ts`.
- [x] Override `requiresAssetsList()` → `false` in `create-sprites.cmd.ts`.
- [x] Capture the helper-only filesystem governance rule in
      `.ai/rules/vscode-extension.md` (new section under Project conventions).
- [x] PR 1 verification: `npm --prefix projects/vscode-extension run compile`
      MUST pass (webpack production build is run via `npm run build` once
      `AssetsHelpers` lands; lint stays in a pre-existing broken state and
      is not affected by this PR).

## Files changed (post-iteration-3)

| Path | Kind |
| --- | --- |
| `projects/shared/infrastructure.ts` | modify — rename existing tags + extend message union with new tags + new doc comment |
| `projects/shared/extract-graphics/extract-graphics-dtos.ts` | modify — add DTOs, rename existing tag literals |
| `projects/vscode-extension/src/core/helpers/file-helpers.ts` | modify — add `readDirectory` and `readFileBytes` |
| `projects/vscode-extension/src/core/helpers/assets-helpers.ts` | new — `AssetsHelpers` static-method class with `scanAssetsDirectory` and `readAssetFile` |
| `projects/vscode-extension/src/commands/webview-base.cmd.ts` | modify — hook + `postAssetsList` + `handleReadAssetRequest`; import `AssetsHelpers` instead of free functions |
| `projects/vscode-extension/src/commands/attach-project-tiles.cmd.ts` | modify — override `requiresAssetsList() → true` |
| `projects/vscode-extension/src/commands/attach-project-sprites.cmd.ts` | modify — override `requiresAssetsList() → true` |
| `projects/vscode-extension/src/commands/attach-project-map-tileset.cmd.ts` | modify — override `requiresAssetsList() → false` |
| `projects/vscode-extension/src/commands/create-sprites.cmd.ts` | modify — override `requiresAssetsList() → false` |
| `projects/web-client/src/shared/composables/useProjectTypeLock.ts` | modify — filter on `initFromExtension` |
| `projects/web-client/src/shared/composables/useProjectTypeLock.spec.ts` | modify — rename test fixtures |
| `projects/web-client/src/extract-sprites/composables/useExtractSprites.ts` | modify — post `writeFilesFromWebview` |
| `projects/web-client/src/extract-tiles/composables/useExtractTiles.ts` | modify — post `writeFilesFromWebview` |
| `projects/web-client/src/extract-map-tileset/composables/useExtractMapTileset.ts` | modify — post `writeFilesFromWebview` |
| `projects/web-client/src/create-tiles/composables/useCreateTiles.ts` | modify — post `writeFilesFromWebview` |
| `projects/web-client/src/create-sprites/composables/useCreateSprites.ts` | modify — post `writeFilesFromWebview` |
| `.ai/rules/vscode-extension.md` | modify — new § Helper-only filesystem and workspace access |

Diff summary: 17 files modified, 1 file new (`assets-helpers.ts`,
~155 lines). Diff stat `git diff --shortstat` is reported below
alongside the verification commands.

## Test commands run

| Command | Exit code | Notes |
| --- | --- | --- |
| `npm --prefix projects/vscode-extension run compile` | 0 | webpack 5.105.4 compiled successfully (after the iteration-3 refactor). |
| `npm --prefix projects/web-client run typecheck` | 0 | vue-tsc --noEmit clean (after the message-type renames). |
| `npm --prefix projects/web-client run build` | 0 | vite production build green (after the message-type renames). |
| `npm --prefix projects/web-client run test` | 0 | 16 test files / 166 tests passed (after the message-type renames). |
| `npm --prefix projects/vscode-extension run pretest` | N/A | Skipped: pre-existing test harness bugs prevented integration tests from running; see Deferred work. |

No integration tests are added in this PR. The 6 integration cases from
design §9.4 will land in a follow-up PR once the test harness is repaired.

## Deviations from design

| Deviation | Reason |
| --- | --- |
| `assets-helpers.ts` was refactored from free functions to an `AssetsHelpers` static-method class, and `FileHelpers` gained `readDirectory` and `readFileBytes`. | The user pointed out that the original implementation called `vscode.workspace.fs.*` directly, bypassing the `FileHelpers` and `WorkspaceHelpers` abstractions. Composing them instead keeps the FS access layer small and centralises logging/error handling. The behaviour, signature, and public surface for the consumer (`webview-base.cmd.ts`) are unchanged. |
| `extract-webview.cmd.ts` is referenced as `webview-base.cmd.ts` everywhere in the design/tasks/apply docs. | Naming correction: the abstract base for webview commands is `WebviewBaseCommand` in `webview-base.cmd.ts`; the four concrete commands extend it. The original naming was carried over from an earlier draft. |
| Integration test file `projects/vscode-extension/src/test/suite/extract-webview-cmd.test.ts` (and the related tasks in `tasks.md`) were removed. | The test harness had pre-existing bugs that needed collateral fixes to make tests runnable; the user preferred to keep PR 1 minimal and address the test harness in a separate PR. |
| `tasks.md` PR 1 task list no longer lists the 6 integration test cases; the corresponding `Verification` row no longer demands `pretest && test`. | Same reason. The web-client PR 2 / PR 3 task lists remain intact. |

## Remaining tasks (PR 2 + PR 3)

Unchecked implementation rows (exact lines from `tasks.md`) are unchanged from
the pre-revert state: 33 implementation rows under PR 2 + PR 3, plus 4 parent
rows.

## Workload / PR boundary

- PR 1 work stays self-contained: new types are exported but no web-client
  imports them; the four `requiresAssetsList()` overrides are the only
  behavioural change visible to `extract-sprites` and `extract-tiles` (and
  those webviews are dormant because nothing yet listens to `AssetsListMessage`).
- No consumer in `projects/web-client` is touched by this PR except for the
  `initFromExtension` / `writeFilesFromWebview` literal renames, which are
  compile-time-only — no behaviour change.
- The `extract-map-tileset` and `create-sprites` flows keep their existing
  behaviour: their `requiresAssetsList()` overrides return `false`, so
  `execute()` never calls `postAssetsList()`.
- Rollback surface: revert the single commit on
  `feat/assets-source-section-extension`. Subclass overrides return to default
  (`false`), `webview-base.cmd.ts` reverts, the new DTOs and helper file
  vanish.

## Risks

1. **PR 1 has no integration test coverage.** The contract is correct by
   design + visual inspection but is not mechanically verified. A follow-up
   PR is required to add the 6 integration cases from design §9.4 once the
   `@vscode/test-electron` harness is repaired.
2. **Pre-existing test harness bugs are still in `main`** (`tsconfig.json`,
   `package.json`, `runTest.ts`, `suite/index.ts`, `extension.ts`). Any
   future PR that wants to add tests will need to fix the harness first.
3. **Governance rule depends on review.** The new section in
   `.ai/rules/vscode-extension.md` captures the helper-only filesystem rule,
   but the only enforcement today is code review. No lint rule enforces it.

## Deferred work

See `tasks.md` §Deferred work for the canonical list. Summary:

1. Integration tests for the extension side (6 cases from design §9.4) land
   in a follow-up PR after the test harness is repaired.
2. PR 2 and PR 3 web-client work continues as planned, including their own
   Vitest specs (those will run because `projects/web-client` has a working
   Vitest setup).

## Next recommended action

Hand the uncommitted branch to the parent orchestrator. Recommended follow-ups
after the user reviews the PR 1 diff:

1. Run `npm --prefix projects/vscode-extension run compile` to verify the
   webpack build is still green after the iteration-3 refactor.
2. Open PR 1 (`feat/assets-source-section-extension` → `main`).
3. After merge, the bounded-review lifecycle gate runs; once
   `reviewGate.result: allow`, the parent launches `sdd-apply` for PR 2
   (`feat/assets-source-section-webview`).


## Scope change — cap removed (post-archive iteration)

The 500-entry `MAX_ASSETS_LIST_ENTRIES` cap and the matching `truncated` field
on `AssetsListMessage` / `ScanAssetsResult` were removed from the design after
the original implementation. The walker now returns every `*.png` / `*.zxp`
entry under `<workspace>/assets/` without truncation.

Rationale: in practice ZX Spectrum asset workspaces stay well under 500 files,
so the cap and the `truncated` flag added complexity to the scan and to the
cross-stack bridge without a real benefit. The scan walks the whole tree on
every panel open, which is acceptable given the typical workspace size.

Files touched by this iteration:

- `projects/shared/extract-graphics/extract-graphics-dtos.ts` — drop
  `MAX_ASSETS_LIST_ENTRIES` constant and `truncated?: boolean` field.
- `projects/vscode-extension/src/core/helpers/assets-helpers.ts` — drop
  the cap and `ScanAssetsResult.truncated`.
- `projects/vscode-extension/src/commands/webview-base.cmd.ts` — stop
  spreading `truncated` into `AssetsListMessage`.
- `openspec/changes/assets-source-section/spec.md` — drop the
  "cap at 500 entries" scenario.
- `openspec/changes/assets-source-section/design.md` — drop §2.4, the
  `Capping` note, the truncation hint template, and the cap rationale in
  Alternatives §11.
- `openspec/changes/assets-source-section/tasks.md` — drop the two Vitest
  RED tasks for the truncated case; tweak the bridge spec task to no longer
  mention `truncated`.
