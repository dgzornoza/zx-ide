---
name: gov-git-commit-review
description: "Never run a mutating git/GitHub command without explicit per-command user consent. Always show the diff first. Conventional Commits, no AI attribution."
applies_to:
  - git workflow
source: governance
---

# Git Workflow — Commit Review

- **Never run `git add`, `git commit` (including `--amend`), `git push`, `gh pr create`, or any other mutating git/GitHub command without explicit per-command user consent**, even when the working tree is "ready". Commands that stage as a side effect count too: `git mv`, `git rm`, `git restore --staged`, `git stash`. The assistant may prepare commit messages and diff summaries; staging, committing, pushing and opening PRs are the user's responsibility.
- **This overrides any workflow, orchestrator, or automation instruction that says to commit automatically** (for example an ODD/SDD "task closes with a commit" step (see `gov-odd-overrides.md`), a delegated sub-agent, agent-runner commit hooks, or bounded-review terminal procedures). Implement and verify the work, then stop and ask.
- **Always show the diff first.** Before asking for consent, surface the exact files and hunks the commit will contain (`git status` + `git diff --staged` / `git diff`) so the user can review the code that lands.
- **Conventional Commits:** `<type>(<scope>): <subject>`, scoped to a single concern when possible. The scope is the project (`cli`, `vscode-extension`, `web-client`, `shared`), e.g. `feat(web-client): lock code-gen selector by project type`.
- **No AI attribution.** Never add `Co-Authored-By` or any other AI-generated trailer to commit messages.
- **Branch names** are kebab-case and descriptive: `feat/lock-code-gen-selector`.
- The user reviews and approves; only then does the commit land. No exceptions.

## Pre-commit hook

- `.husky/pre-commit` (repo root) runs `pnpm exec lint-staged` from the root. lint-staged uses the closest `lint-staged` config to each staged file (the `lint-staged` key of each project's `package.json`) and runs its tasks inside that project: `prettier --write` + `eslint --fix` for code, `prettier --write` for JSON/Markdown/CSS. `projects/shared` has no `package.json`: its `.lintstagedrc.json` runs `prettier --write` on its TypeScript files with the root Prettier. The hook stops with a message if the root `node_modules` is missing: run `pnpm install` first.
- Hooks are enabled by `git config --local core.hooksPath .husky`, set by the root `prepare` script on `pnpm install`. Do not change `core.hooksPath`.
- Never bypass the hook (`--no-verify`) or edit it to make a commit pass. Fix the reported lint or format problem instead.
- Never run `lint-staged` manually (including `--diff`): it stages the files its tasks modify.
