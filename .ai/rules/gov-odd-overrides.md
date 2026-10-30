---
name: gov-odd-overrides
description: "Project overrides of the ODD workflow: task-document archiving, review base limited to the current branch or commit, and work-unit commits only with user consent."
applies_to:
  - odd/tasks/**
  - odd/archive/**
  - git workflow
  - gentle-ai review
source: governance
---

# ODD — Project Overrides

The ODD protocol and its native review (`gentle-ai review`) come from the global agent configuration. The rules below override it in this repository. When they conflict with ODD, these win.

## Task Document Archiving

The ODD protocol (step 7, "Close") has no archive step: a feature document created in `odd/tasks/<feature-name>.md` stays there after the feature is done, so `odd/tasks/` stops telling what is still active.

- **On close** (protocol step 7, after the outcome is reported and the feature's commits are on its parent branch): move the task document out of the active folder, with the user's consent for the git command (`gov-git-commit-review.md`).
  ```bash
  git mv odd/tasks/<feature-name>.md odd/archive/<feature-name>.md
  ```
- **Archive gate.** Never archive a task document while it has unfinished tasks, unless the user explicitly states the feature is finished. A due date, inactivity or a request to "archive everything" does not override open tasks: list them and ask.
- Before the move, add a `Status: archived on <date>` line to the header and a closing `## Log` entry.
- **`odd/tasks/`** holds only features in progress or pending. Anything there is active or interrupted work, resumable with the protocol's resume flow.
- **`odd/archive/`** holds closed features, so the history stays browsable locally, not only in `git log`.
- The Engram mirror (`odd/<feature-name>/tasks` topic) is not moved; it stays as the historical record. Only the local `.md` file moves.
- Do not delete closed task documents. The archive move is the record.

## Review Base — Only the Current Branch

A review covers only the commits of the current branch or the commits made in the current session, never every commit not yet in the default base.

- **Feature branch.** The base is the merge-base with the parent branch (`main` unless the user names another). Resolve it and pass it explicitly to every `gentle-ai review status` / `assess` / `start`:
  ```bash
  git merge-base HEAD main
  gentle-ai review status --cwd <repo> --contract gentle-ai.review-integration/v2 --agent <agent> \
    --base-ref <merge-base> --committed-only --next-transition
  ```
  If the merge-base is ambiguous, ask the user which branch the current one came from.
- **Per work-unit commit.** After each commit, the review candidate is the new commit (`--base-ref HEAD~1 --committed-only`) or the range since the last reviewed commit. Both stay inside the current branch. This also applies to work committed directly on `main`.
- **Never accept the default base.** The selectorless `gentle-ai review status` (and the stop hook that runs it) can offer a range that reaches far back, which exceeds the review context budget (`lens_context_budget_exceeded`; it happened here with a 167-file range). Run the per-commit review proactively after each commit. If the hook still offers the wide range, relay its consent prompt unchanged (the choice is the user's), state the range and its size, and offer the per-commit or per-branch review instead.

## Work-Unit Commits

ODD closes each task with an automatic work-unit commit. In this repository that step is replaced by the consent flow of `gov-git-commit-review.md`: show the diff, propose a Conventional Commit message, and stage and commit only after the user explicitly agrees.
