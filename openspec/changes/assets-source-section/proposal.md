# Assets source section — replace file pickers with workspace directory listing

## Intent

`extract-sprites` and `extract-tiles` webviews ask users to pick a source image and a `.cfg` map file. The map path is derivable (same folder, same basename). Replace both pickers with a single dropdown listing every image under `assets/`, derive `.cfg` from the chosen image, and keep `SourceSection.vue` for `extract-map-tileset` so it can adopt the same shape later without a rewrite.

Affected sub-projects: `[web-client]` (new shared component, two App.vue swaps, two composables, DTO additions, locale strings, tests) and `[vscode-extension]` (one bridge handler in `ExtractWebviewCommand`).

## Scope

### In scope

- New `projects/web-client/src/shared/components/AssetsSourceSection.vue` listing images under `assets/` in a `<select>`, with the derived `.cfg` as a read-only label.
- Swap `SourceSection.vue` for `AssetsSourceSection.vue` in `extract-sprites/App.vue` and `extract-tiles/App.vue`.
- Rework `useExtractSprites.ts` and `useExtractTiles.ts` to consume the new image contract (path + decoded bytes) instead of `File` objects.
- Add `AssetsListMessage` to `projects/shared/extract-graphics/extract-graphics-dtos.ts` and emit it from `ExtractWebviewCommand.execute()`. When `assets/` is missing, call `vscode.window.showErrorMessage("Project requires the assets/ directory at the workspace root")` and post an empty list.
- Add `assetsSourceSection.*` keys to `en` and `es` blocks in `i18n.ts`.
- Add Vitest specs for `AssetsSourceSection.vue`: populated list, empty list, missing-assets blocked UI.

### Non-goals

- `extract-map-tileset` stays on `SourceSection.vue`. No edits to its App.vue, composable, or `SaveMapMessage` flow.
- No thumbnails, no manual refresh button, no focus auto-refresh — the list is fetched once on panel open.
- No change to `WriteFilesMessage` semantics or the workspace-root save destination.
- No `.cfg` overwrite confirmation; collisions overwrite silently.
- No migration tooling for projects that lack `assets/`; users see the VS Code error and a blocked UI.

## Affected areas

| Area | File(s) |
| --- | --- |
| Shared component | `projects/web-client/src/shared/components/AssetsSourceSection.vue` (new) |
| Webview consumers | `projects/web-client/src/extract-sprites/App.vue`, `projects/web-client/src/extract-tiles/App.vue` |
| Composables | `projects/web-client/src/extract-sprites/composables/useExtractSprites.ts`, `projects/web-client/src/extract-tiles/composables/useExtractTiles.ts` |
| Bridge DTO | `projects/shared/extract-graphics/extract-graphics-dtos.ts` (new `AssetsListMessage`) |
| Extension handler | `projects/vscode-extension/src/commands/extract-webview.cmd.ts` (post list, handle missing `assets/`) |
| i18n | `projects/web-client/src/i18n.ts` (new `assetsSourceSection` block in `en` + `es`) |
| Tests | `projects/web-client/src/shared/components/AssetsSourceSection.spec.ts` (new) |

`SourceSection.vue` is unchanged — `extract-map-tileset` still imports it.

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| a | Bridge contract drift: bad `AssetsListMessage` schema or `messageType` discriminator breaks the webview before it boots. | Spec pins the DTO; spec adds a happy-path + missing-assets Vitest for both App.vue consumers. |
| b | Extraction pipeline regression when bytes arrive base64-decoded instead of as a `File` blob. | Composables pass `Uint8Array` to `extractTiles` / sprite generator; design re-uses the existing `convertZxpFileToImageFile` decode path. |
| c | Workspaces without `assets/` show a broken UI before the error toast is visible. | Extension posts `assets: []` alongside the error; webview disables the select and Create button. |
| d | Hundreds of images under `assets/` slow the panel. | Dropdown is text-only, no thumbnails, list fetched once. The original 500-entry cap was removed (see apply-progress Scope change note); a workspace with thousands of files would warrant revisiting this risk. |

## Rollback

Revert the single commit that introduces `AssetsSourceSection.vue` and `AssetsListMessage`. Both App.vue files revert to `SourceSection.vue`; composables revert to `File`-based setters. `SourceSection.vue` and `extract-map-tileset` are untouched, so they keep working through the rollback. New locale keys can stay (unused) or revert in the same commit.

## Success criteria

- [ ] `extract-sprites` and `extract-tiles` show a dropdown populated from `<workspace>/assets/**/*.{png,zxp}` on first open.
- [ ] Dropdown options show workspace-relative paths (e.g. `characters/player.png`); no thumbnails.
- [ ] Selecting an image updates the `.cfg` read-only label to `<basename>.cfg` in the same folder.
- [ ] A workspace without `assets/` triggers `vscode.window.showErrorMessage` and an empty, disabled select in both webviews.
- [ ] Switching the selected image preserves existing tile/sprite definitions.
- [ ] `extract-map-tileset` keeps `SourceSection.vue` and its `SaveMapMessage` flow with zero behavioural change.
- [ ] `npm run typecheck` and `npm run test` pass in `projects/web-client`; `npm run build` succeeds in both sub-projects.

## Next step

Run `sdd-spec` to lock `AssetsListMessage`, the composable contracts, and the empty-assets blocked-UI behaviour into Given/When/Then scenarios before any code is written.
