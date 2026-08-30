# Assets Source Section Specification

## Purpose

The `assets-source-section` capability replaces the per-page file pickers used by the
`extract-sprites` and `extract-tiles` webviews with a shared component that lists every
image under `<workspace>/assets/` in a single dropdown. The component derives the
expected `.cfg` from the selected image, surfaces its existence on disk, and disables
itself cleanly when `assets/` is missing or empty. The `extract-map-tileset` webview
remains on the legacy `SourceSection.vue` and is intentionally out of scope.

Scope:

- Applies to: `extract-sprites`, `extract-tiles`.
- Does **not** apply to: `extract-map-tileset` (keeps `SourceSection.vue`).

## Requirements

### Requirement: AssetsListMessage payload from extension to webview

The extension MUST post an `AssetsListMessage` (extension → webview) when the
`extract-sprites` or `extract-tiles` webview panel opens. The payload MUST carry the
workspace-relative path of every `*.png` and `*.zxp` file under `<workspace>/assets/`,
discovered recursively, sorted lexicographically by path. For each entry, the payload
MUST also indicate whether a sibling `.cfg` file (same folder, same basename, `.cfg`
extension) already exists on disk.

The message MUST conform to the following DTO, added to
`projects/shared/extract-graphics/extract-graphics-dtos.ts`:

```ts
export interface AssetsEntry {
  /** Workspace-relative path of the image, e.g. "characters/player.png". */
  path: string;
  /**
   * True when `<dirname(path)>/<basename(path)>.cfg` exists on disk at the time
   * of the scan.
   */
  configurationExists: boolean;
}

export interface AssetsListMessage extends VsCodeBridgeMessage {
  messageType: "assetsListFromExtension";
  assets: AssetsEntry[];
  /** True when <workspace>/assets/ does not exist; `assets` MUST then be empty. */
  missing?: boolean;
}
```

#### Scenario: Populated assets directory on panel open

- **GIVEN** `<workspace>/assets/characters/player.png`, `<workspace>/assets/enemies/slime.png`, and `<workspace>/assets/tileset.zxp` exist
- **AND** `<workspace>/assets/characters/player.cfg` exists
- **AND** `<workspace>/assets/enemies/slime.cfg` does not exist
- **WHEN** `ExtractWebviewCommand.execute()` runs for the `extract-sprites` or `extract-tiles` webview
- **THEN** the extension posts an `AssetsListMessage` whose `assets` array equals `[{ path: "characters/player.png", configurationExists: true }, { path: "enemies/slime.png", configurationExists: false }, { path: "tileset.zxp", configurationExists: false }]`
- **AND** `missing` is absent or `false`

### Requirement: Missing assets directory blocks the webview

When `<workspace>/assets/` does not exist, the extension MUST invoke
`vscode.window.showErrorMessage("Project requires the assets/ directory at the workspace root")`
AND post an `AssetsListMessage` with `assets: []`, `missing: true`. The
`AssetsSourceSection.vue` component MUST render the `<select>` element with the
`disabled` attribute while `missing` is `true`, and the host page MUST disable any
action that depends on a source image (e.g. the page's Create button) in the same
condition.

#### Scenario: Extension surfaces the missing-directory error

- **GIVEN** `<workspace>/assets/` does not exist
- **WHEN** `ExtractWebviewCommand.execute()` runs for the `extract-sprites` or `extract-tiles` webview
- **THEN** the extension invokes `vscode.window.showErrorMessage` with the exact text `Project requires the assets/ directory at the workspace root`
- **AND** the extension posts an `AssetsListMessage` with `assets: []` and `missing: true`

#### Scenario: Webview select is disabled while assets directory is missing

- **GIVEN** the webview has received an `AssetsListMessage` with `missing: true`
- **WHEN** `AssetsSourceSection.vue` renders
- **THEN** the `<select>` element is rendered with the `disabled` attribute
- **AND** the page's Create action is rendered disabled until the user resolves the missing directory in a future session

### Requirement: Dropdown shows workspace-relative paths

The dropdown rendered by `AssetsSourceSection.vue` MUST display one `<option>` per
entry in the `AssetsListMessage`, with the option label equal to the entry's
workspace-relative `path` (e.g. `characters/player.png`). The first option MUST be a
placeholder with an empty `value` and a localised prompt label so the user can opt
out of a selection. The component MUST NOT render thumbnails.

#### Scenario: Placeholder option and relative paths are shown

- **GIVEN** the webview has received an `AssetsListMessage` with `assets = [{ path: "characters/player.png", configurationExists: true }, { path: "tileset.zxp", configurationExists: false }]`
- **WHEN** `AssetsSourceSection.vue` renders the dropdown
- **THEN** the first `<option>` has `value=""` and a localised prompt label resolved through the `assetsSourceSection.*` i18n keys
- **AND** subsequent `<option>` elements carry `value="characters/player.png"` with text `characters/player.png` and `value="tileset.zxp"` with text `tileset.zxp`

### Requirement: Configuration label reflects expected .cfg path and existence

When an image is selected, `AssetsSourceSection.vue` MUST display a read-only label
showing the expected `.cfg` path: same folder, same basename, `.cfg` extension
(e.g. selecting `characters/player.png` shows `characters/player.cfg`). The label MUST
indicate existence when the configuration file is on disk and "not yet created"
otherwise.

#### Scenario: Existing configuration file is shown

- **GIVEN** the user selects the option for `characters/player.png`
- **AND** the `AssetsListMessage` reports `configurationExists: true` for that entry
- **WHEN** `AssetsSourceSection.vue` renders the configuration label
- **THEN** the label text is `characters/player.cfg`
- **AND** the label includes a localised "already exists" indicator

#### Scenario: Missing configuration file is shown

- **GIVEN** the user selects the option for `enemies/slime.png`
- **AND** the `AssetsListMessage` reports `configurationExists: false` for that entry
- **WHEN** `AssetsSourceSection.vue` renders the configuration label
- **THEN** the label text is `enemies/slime.cfg`
- **AND** the label includes a localised "not yet created" indicator

### Requirement: Existing tile and sprite definitions survive image switch

Changing the selected image in `AssetsSourceSection.vue` MUST NOT clear, reset, or
re-initialise the tile or sprite definitions owned by the host composable
(`useExtractSprites` for `extract-sprites`, `useExtractTiles` for `extract-tiles`).
The composable MUST expose a setter that accepts the workspace-relative `path` and
the decoded bytes (`Uint8Array`) of the new image, leaving all other state untouched.

#### Scenario: Tile definitions persist when switching images

- **GIVEN** the user has configured three tiles with names `hero`, `enemy`, `coin` in `extract-tiles`
- **AND** the currently selected image is `enemies/slime.png`
- **WHEN** the user changes the dropdown selection to `characters/player.png`
- **THEN** the host composable continues to expose three tiles with names `hero`, `enemy`, `coin`
- **AND** only the source image (`path` + decoded `Uint8Array`) is updated

#### Scenario: Sprite definitions persist when switching images

- **GIVEN** the user has defined two sprites in `extract-sprites`
- **AND** the currently selected image is `tileset.zxp`
- **WHEN** the user changes the dropdown selection to `characters/player.png`
- **THEN** the host composable continues to expose the same two sprites with their original frames and dimensions

### Requirement: Asset list is fetched exactly once

The extension MUST emit `AssetsListMessage` exactly once per webview panel open. The
webview MUST NOT request a refresh on focus gain, on user action, or on a timer.
`AssetsSourceSection.vue` MUST NOT expose a manual refresh control.

#### Scenario: No re-fetch on focus or timer

- **GIVEN** the `extract-tiles` webview panel is open
- **AND** an `AssetsListMessage` has already been received and rendered
- **WHEN** the webview regains focus, the user clicks elsewhere, or any timer elapses
- **THEN** the extension does NOT post another `AssetsListMessage`
- **AND** the webview does NOT re-request the asset list

### Requirement: Generated files are written to the workspace root

When the user clicks the page's Create action, the host composable MUST build a
`WriteFilesMessage` whose entries (`.h`, `.asm`, `.cfg`, and the tile-sheet `.png` for
`extract-tiles`) use the basename of the currently selected image and are addressed at
the workspace root. The semantics of `WriteFilesMessage` MUST NOT change: same shape,
same `messageType: 'writeFilesFromWebview'`, same `codeFiles: FileEntry[]`.

#### Scenario: WriteFilesMessage uses image basename at workspace root

- **GIVEN** the user has selected `characters/player.png` in `extract-sprites`
- **WHEN** the user clicks Create and the composable dispatches a `WriteFilesMessage`
- **THEN** every `FileEntry.fileName` is rooted at the workspace and uses the basename `player` (for example `player.h`, `player.asm`, `player.cfg`)
- **AND** no entry is placed inside an `assets/` subdirectory

### Requirement: Existing configuration file is overwritten without confirmation

When the generated `WriteFilesMessage` contains a `.cfg` entry whose destination
already exists on disk, the extension MUST overwrite it without prompting the user.
No confirmation dialog, no backup, no diff review.

#### Scenario: Silent overwrite on configuration collision

- **GIVEN** `<workspace>/player.cfg` already exists with prior content
- **AND** the user selects `player.png` and clicks Create
- **WHEN** the extension writes the `WriteFilesMessage` payload
- **THEN** `<workspace>/player.cfg` is overwritten with the new content
- **AND** no dialog or prompt is shown to the user

### Requirement: extract-map-tileset is out of scope

`AssetsSourceSection.vue` MUST NOT be imported or rendered by
`extract-map-tileset/App.vue`. `extract-map-tileset` continues to use
`SourceSection.vue` with its existing file pickers and `SaveMapMessage` flow, with
zero behavioural change.

#### Scenario: Map tileset webview keeps legacy picker

- **GIVEN** this change ships `AssetsSourceSection.vue` and the `AssetsListMessage` DTO
- **WHEN** `extract-map-tileset/App.vue` is inspected
- **THEN** it imports `SourceSection.vue` (not `AssetsSourceSection.vue`)
- **AND** the file pickers, `SaveMapMessage` shape, and save flow are unchanged from before this change
