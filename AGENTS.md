# AGENTS.md — Workspace (zx-ide)

This file is the entry point for AI coding assistants working in this
workspace (GitHub Copilot, Continue, Pi, or others).

## General usage

- Read the per-project instruction in [`.ai/rules/`](.ai/instructions)
  before making changes to that project.
  - CLI: [`.ai/rules/cli.md`](.ai/rules/cli.md)
  - VS Code extension: [`.ai/rules/vscode-extension.md`](.ai/rules/vscode-extension.md)
  - Web-client: [`.ai/rules/web-client.md`](.ai/rules/web-client.md)
- When working in `projects/web-client`, load the `vue-best-practices` skill
  from [`.ai/skills/vue-best-practices/`](.ai/skills/vue-best-practices/).
- For cross-project changes (e.g. a shared DTO), document the scope in the PR
  and update the relevant files in `.ai/rules/`.

## Code style

The single source of truth for code style lives in
**[`.ai/rules/CODE_STYLE.md`](.ai/rules/CODE_STYLE.md)**. That document covers naming,
TypeScript, Vue 3, tests, git, and comments across every project in this
workspace. **If a rule in a per-project instruction contradicts
`.ai/rules/CODE_STYLE.md`, the style file wins.** Fix the contradiction in the
per-project file rather than forking the rule.

Quick recap of the workspace-level rules:

- **Never use `null`** — use `undefined` and the optional `?` modifier for
  optional properties/parameters (`myVar?: string`, not `myVar: string | null`).
- **All identifiers, comments, and developer-facing strings must be in English.**
- **No abbreviations, no single-letter or shortened parameter names.** Use
  full words everywhere. The only accepted exceptions are domain acronyms
  (`zx0`, `zxide`, `vscode`) and `item` as a generic loop variable. See
  [`.ai/rules/CODE_STYLE.md`](.ai/rules/CODE_STYLE.md) for the full table.

## Agent conventions

- Before editing code in a project, read its instruction in `.ai/rules/`.
- Follow the project's existing style and conventions (TypeScript, camelCase,
  no abbreviations).
- If you spot an emerging convention that should be codified (e.g. library
  choice, recurring pattern), record the decision and add a short note to
  `.ai/rules/` or propose an update to `AGENTS.md` /
  `.ai/rules/CODE_STYLE.md`.

## Workflow guidelines for assistants

- For design or architectural decisions, propose alternatives with pros and
  cons and ask for confirmation before applying changes.
- For local tasks (e.g. fixing a bug in `projects/cli`), apply minimal changes
  focused on the root cause.
- For changes that span multiple commits or steps, create a checklist in the
  PR and update the relevant `.ai/rules/` file to record why the
  decisions were made.

## Contact

If it is unclear which instruction to follow, ask in the PR or add a comment
to the associated issue before applying changes.
