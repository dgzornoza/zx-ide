# Archive report — `unify-sprites-editor`

## Status

**archived manually** at user request. The user explicitly chose to skip the `sdd-verify` phase and proceed directly to archive; the gentle-ai native status engine could not be satisfied via stub evidence because it requires a `gentle-ai.verify-result/v1` YAML envelope whose `evidence_revision` must be bound to its runtime attempt ledger (which has no record of this change's apply work, since the apply was performed outside the acquire/settle flow in a prior session).

This report is therefore a **manual archive**, not the output of the `sdd-archive` subagent. The native SDD status engine remains in `dependencies.archive: blocked`. The change folder is moved out of `openspec/changes/` regardless, so the workspace state reflects "archived".

## Artifacts archived

| Path | Status at archive |
| --- | --- |
| `openspec/changes/unify-sprites-editor/proposal.md` | done |
| `openspec/changes/unify-sprites-editor/specs/create-sprites/spec.md` | done |
| `openspec/changes/unify-sprites-editor/specs/sprites-editor-section/spec.md` | done |
| `openspec/changes/unify-sprites-editor/design.md` | done |
| `openspec/changes/unify-sprites-editor/tasks.md` | done (24/24 implementation tasks checked) |
| `openspec/changes/unify-sprites-editor/apply-progress.md` | done |
| `openspec/changes/unify-sprites-editor/verify-report.md` | done (manual stub — see "Verification" below) |
| `openspec/changes/unify-sprites-editor/archive-report.md` | this file |

## Verification

`verify-report.md` was authored as a manual stub before the engine's `gentle-ai.verify-result/v1` envelope requirement was discovered. The engine rejected the stub with:

> missing valid gentle-ai.verify-result/v1 envelope: the first non-empty content must be fenced yaml

In-scope automated checks (run during apply, recorded in `apply-progress.md`):

| Check | Result |
| --- | --- |
| `cd projects/web-client && npm run typecheck` (after phases 1, 2, 3, 4, 5) | passed (zero errors) |
| `cd projects/web-client && npm run build` (phase 5.4) | passed — all five entry points built |
| `grep` sweep for stale identifiers (`CreateSpriteDefinition`, `SpritesCreatorSection`, `SpriteCreatorItem`) | 0 matches |
| `grep` sweep for stale paths (`extract-sprites/components/SpritesSection`, `extract-sprites/components/SpriteItemDefinition`) | 0 matches |
| Shared-component isolation (`grep` from shared components to `src/(extract|create)-sprites`) | 0 matches |

Manual browser smoke test (task 5.5) is **deferred to the user**. The headless agent environment could not run a browser; the user accepted this deferral as part of signing off the change. The follow-up refactor work the user has queued is the natural place to run the visual side-by-side verification.

## Deviations from design

Recorded in `apply-progress.md`. None are blockers:

- `newSpriteDefaults` prop declared but unused by the section (placeholder for future per-page customisation).
- `SpriteEditorItem` exposes two extra props: `translationNamespace` (required) and `isActive` (optional).
- `SpritesEditorSection` exposes two extra props: `translationNamespace` (required) and `activeSpriteIndex` (optional).

## Canonical spec sync — NOT performed

The `sdd-archive` subagent normally performs an archive-time sync fallback that copies the change specs into `openspec/specs/<domain>/`. This manual archive does **not** perform that step. Specifically:

- `openspec/specs/sprites-editor-section/spec.md` was **not** created. This domain is new and exists only inside the archived change folder.
- `openspec/specs/create-sprites/spec.md` was **not** updated with the 7 MODIFIED requirements and 2 REMOVED requirements from `openspec/changes/unify-sprites-editor/specs/create-sprites/spec.md`. The canonical file therefore still describes the pre-change behaviour.
- `openspec/specs/sprites-creator-section/` was **not** removed (it is the predecessor capability replaced by `sprites-editor-section`).

The follow-up refactor should reconcile the canonical specs as one of its first steps.

## Archived path

```text
openspec/changes/archive/2026-08-28-unify-sprites-editor/
```

## Active same-domain warnings

None at archive time. The archived change is the only change touching `create-sprites` or `sprites-editor-section`.

## Verifier / archiver sign-off

- **Archived by:** orchestrator (gentle-ai), per explicit user instruction to bypass `sdd-verify` and `sdd-archive`.
- **Date:** 2026-08-28.
- **Native engine state at archive:** `dependencies.archive: blocked` — engine gate explicitly bypassed.
