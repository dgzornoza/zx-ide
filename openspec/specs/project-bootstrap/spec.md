# Project Bootstrap — zx-ide

## Purpose

This spec documents the project bootstrap context for the zx-ide monorepo, established during SDD init. It captures the detected stack, conventions, testing capabilities, and the `hybrid` artifact store policy. All SDD artifacts for this project must follow this context.

## Requirements

### Requirement: zx-ide monorepo structure is preserved

The project SHALL maintain three sub-projects under `projects/`: `cli`, `vscode-extension`, and `web-client`.

- `projects/cli` — Node.js CLI for ZX Spectrum project scaffolding (TypeScript, Webpack).
- `projects/vscode-extension` — VS Code extension (TypeScript, Webpack, Inversify DI).
- `projects/web-client` — Vue 3 webview embedded in the extension (TypeScript, Vite).

### Requirement: Artifact store policy is hybrid

The project SHALL use `hybrid` persistence for SDD artifacts:

- **OpenSpec** (`openspec/`) is the canonical, team-visible store for specs, proposals, designs, and tasks.
- **Engram** is the cross-session memory store for decisions, discoveries, and context.
- Engram observations use `topic_key: sdd-init/zx-ide` and are tagged `capture_prompt: false` for automated artifacts.
- Existing `openspec/config.yaml` is NOT to be regenerated; it was restored from HEAD and is preserved as-is.

### Requirement: TypeScript conventions are enforced across all projects

All three sub-projects SHALL follow these conventions:

- No `null` — use `undefined` for optional values. Optional properties use `?`.
- No abbreviations in variable/parameter/property names (e.g., `projectName`, not `projName`).
- Source code, identifiers, and technical comments in **English**.
- Loop iteration variables named `item` only when generic; otherwise descriptive names.
- No single-letter or shortened parameter names (e.g., `newValue`, not `v`).

### Requirement: Per-project conventions are respected

- **CLI**: Entry point `src/index.ts`. Template system with ZIP archives and placeholder tokens. No test runner detected.
- **VS Code extension**: Inversify DI, Disposable pattern, path aliases (`@core/*`, `@z88dk/*`). Commands use `.cmd.ts` suffix. Member variables without underscore prefix (exemption: inherited `_subscriptions`).
- **Web-client**: Vue 3 Composition API with `<script setup>` and TypeScript **only** — no Options API. `defineModel()` for models, `defineProps<T>()` for props. Tailwind CSS for styling.

### Requirement: Testing capabilities are documented per sub-project

| Sub-project | Test Runner | Command | Strict TDD |
|---|---|---|---|
| `projects/cli` | None | — | Not applicable |
| `projects/vscode-extension` | Mocha + `@vscode/test-electron` | `npm run test` (after `pretest`) | Disabled (no unit runner) |
| `projects/web-client` | Vitest | `npm run test` | Enabled (runner detected) |

### Requirement: Skill registry is maintained

The `.atl/skill-registry.md` exists and is current as of 2026-08-17. SDD agents MUST read the relevant skill before working in a sub-project. The `vue-best-practices` skill is mandatory for Vue/web-client work.

## Scenarios

### Scenario: New SDD change is started

- Agent loads `sdd-init` skill → reads `openspec/specs/project-bootstrap/spec.md` for context.
- Agent uses `sdd-propose` → creates `openspec/changes/{change-name}/proposal.md`.
- Artifacts are written to OpenSpec (canonical) AND Engram (memory).
- Skill registry guides agent to load project-specific skills (e.g., `vue-best-practices` for web-client).

### Scenario: Engram observation conflicts with OpenSpec

- OpenSpec is canonical. Engram memory is for cross-session context.
- If a conflict arises, prefer the OpenSpec artifact as source of truth.
- The `unify-ai-governance` change artifacts in Engram must NOT be touched.

### Scenario: Agent works on CLI sub-project

- No test runner is available. Strict TDD is not enforced.
- Agent follows CLI conventions in `.ai/instructions/cli.md`.
- Build: `npm run build`. Lint: `npm run lint`.
