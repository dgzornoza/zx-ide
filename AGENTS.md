# zx-ide — AI Agent Guide

> **Index-only invariant.** `AGENTS.md` is a navigation index for every AI coding assistant (Claude Code, GitHub Copilot, Continue, Pi, others). Do **not** add governance rules to this file — they live as standalone files under `.ai/rules/` and are referenced from the tables below. The only rule this file carries is the structural invariant you are reading right now.

**Rules** are workspace-wide governance: load the matching rule whenever its `Applies to` scope matches the files you are about to touch. **Skills** are project-specific: load a skill only when its triggers match the current task — before reading or editing code in that project.

## Project Skills

| Skill                     | Triggers                                                                                         | Path                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `zx-ide-cli`              | anything under `projects/cli/` (wizard, generator builders, templates, placeholders)             | `.ai/skills/zx-ide-cli/SKILL.md`              |
| `zx-ide-vscode-extension` | anything under `projects/vscode-extension/` (commands, webviews, Inversify DI, disposables, z88dk) | `.ai/skills/zx-ide-vscode-extension/SKILL.md` |
| `zx-ide-web-client`       | anything under `projects/web-client/` (Vue webview pages, composables, code generators, bridge, i18n) | `.ai/skills/zx-ide-web-client/SKILL.md`  |
| `vue-best-practices`      | `.vue` files, composables, Vite + Vue — always together with `zx-ide-web-client`                 | `.ai/skills/vue-best-practices/SKILL.md`      |

Changes to the message DTOs in `projects/shared/` load both `zx-ide-vscode-extension` and `zx-ide-web-client`.

## Governance Rules

| Rule                                                                                                  | Applies to                                 | Path                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| TypeScript code style (English, file and identifier naming, no abbreviations, never `null`, imports, tests, comments) | `projects/**/*.ts`, `.vue`, `.mjs`, `.cjs` | `.ai/rules/gov-typescript-code-style.md` |
| Git commit review (per-command consent, diff first, Conventional Commits, no AI attribution)          | git workflow                               | `.ai/rules/gov-git-commit-review.md`     |

If a skill contradicts a rule, the rule wins: fix the contradiction in the skill rather than forking the rule.

## Workspace Conventions (summary)

- Monorepo with three projects under `projects/`: `cli` (webpack, Node), `vscode-extension` (webpack, Inversify) and `web-client` (Vite + Vue 3, webview pages). Message DTOs shared between the extension and the web-client live in `projects/shared/`.
- Each project has its own `package.json`; run every command from that project's folder, never from the repo root.
- Specifications and change proposals live in `openspec/` (`specs/`, `changes/`, `changes/archive/`).
- Source code, comments and developer-facing strings in English; AI governance files (`AGENTS.md`, `CLAUDE.md`, `.ai/`) in English.
- Never use `null`; no abbreviations or single-letter names — see `.ai/rules/gov-typescript-code-style.md`.
- Design or architectural decisions: propose alternatives with pros and cons and ask before applying. Local fixes: minimal change at the root cause.
- Cross-project changes (e.g. a shared DTO): document the scope in the PR and update the affected skills.
- When an emerging convention should be codified, add it to the matching project skill (project-specific) or as a rule under `.ai/rules/` (workspace-wide), and register new files in the tables above.

## Build and Check

| Project            | Build           | Check                                         |
| ------------------ | --------------- | --------------------------------------------- |
| `cli`              | `npm run build` | `npm run lint`                                |
| `vscode-extension` | `npm run compile` | `npm run lint`, `npm test`                  |
| `web-client`       | `npm run build` | `npm run typecheck`, `npm test`               |

## References

- `.ai/rules/` — Workspace-wide governance rule files (`gov-*`).
- `.ai/skills/` — Project skills (one per project, plus `vue-best-practices`).
- `README.md` — Workspace overview.
- `doc/Development.md` — Development and debug workflow (watch composition, devcontainer).
- `openspec/` — Specs and change history.

## Contact

If it is unclear which instruction to follow, ask in the PR or in the associated issue before applying changes.
