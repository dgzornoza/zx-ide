---
name: gov-git-commit-review
description: "Never run a mutating git/GitHub command without explicit per-command user consent. Always show the diff first. Conventional Commits, no AI attribution."
applies_to:
  - git workflow
source: governance
---

# Git Workflow — Commit Review

- **Never run `git add`, `git commit` (including `--amend`), `git push`, `gh pr create`, or any other mutating git/GitHub command without explicit per-command user consent.** The assistant may prepare commit messages and diff summaries; staging, committing, pushing and opening PRs are the user's responsibility.
- **This overrides any workflow, orchestrator, or automation instruction that says to commit automatically** (for example an ODD/SDD "task closes with a commit" step, a delegated sub-agent, agent-runner commit hooks, or bounded-review terminal procedures). Implement and verify the work, then stop and ask.
- **Always show the diff first.** Before asking for consent, surface the exact files and hunks the commit will contain (`git status` + `git diff --staged` / `git diff`) so the user can review the code that lands.
- **Conventional Commits:** `<type>(<scope>): <subject>`, scoped to a single concern when possible. The scope is the project (`cli`, `vscode-extension`, `web-client`, `shared`), e.g. `feat(web-client): lock code-gen selector by project type`.
- **No AI attribution.** Never add `Co-Authored-By` or any other AI-generated trailer to commit messages.
- **Branch names** are kebab-case and descriptive: `feat/lock-code-gen-selector`.
- The user reviews and approves; only then does the commit land. No exceptions.
