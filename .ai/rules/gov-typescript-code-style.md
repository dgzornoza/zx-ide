---
name: gov-typescript-code-style
description: "TypeScript code style for every project in the workspace: English everywhere, file naming, identifier naming, no abbreviations or single-letter names, no underscore members, never null, path aliases and import grouping, tests, comments. Project-specific conventions live in the zx-ide-* skills."
applies_to:
  - "projects/**/*.ts"
  - "projects/**/*.vue"
  - "projects/**/*.mjs"
  - "projects/**/*.cjs"
source: governance
---

# TypeScript Code Style

Workspace-wide code style for `projects/cli`, `projects/vscode-extension`, `projects/web-client`, `projects/shared` and any future project. Project-specific architecture and conventions (Vue, VS Code, CLI) live in the project skills (`.ai/skills/zx-ide-*`). **When a skill contradicts this rule, this rule wins:** fix the contradiction in the skill, do not fork the rule.

---

## Rule 1 — Language

- **Identifiers, comments, doc-comments and developer-facing strings (logs, internal errors) are written in English.**
- User-facing copy (UI labels, messages) goes through each project's localization setup, never as a hardcoded literal.
- Commit messages, branch names and PR descriptions default to English.

---

## Rule 2 — File naming

| Kind                    | Convention                                  | Example                                  |
| ----------------------- | ------------------------------------------- | ---------------------------------------- |
| TypeScript source       | kebab-case, with the role suffix if any     | `output-channel.service.ts`              |
| Vue composable          | `useCamelCase.ts` (Vue convention)          | `useProjectTypeLock.ts`                  |
| Vue SFC component       | PascalCase                                  | `CodeGenerationInfo.vue`                 |
| Tests                   | same name as the source file + `.spec.ts`, next to it | `useProjectTypeLock.spec.ts`   |

- Never use generic suffixes like `-command` or `-component`.
- Always follow the naming pattern of the existing files in the same folder before inventing a new one. Project skills define their role suffixes (`.cmd.ts`, `.service.ts`, ...).

---

## Rule 3 — Identifier naming

| Element                            | Convention                                       | Example                              |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------ |
| Variables, parameters, properties  | camelCase                                        | `codeGenerationType`, `projectType`  |
| Types, interfaces, classes, enums  | PascalCase                                       | `ProjectType`, `VscodeBridge`        |
| Compile-time constants             | UPPER_SNAKE_CASE                                 | `MAX_TILE_COUNT`                     |
| Booleans                           | affirmative predicate or `is`/`has`/`should` prefix | `isCompressionApplicable`, `hasFrame` |
| String literal union members       | lowercase                                        | `"asm" \| "c"`                       |

---

## Rule 4 — No abbreviations, no single-letter or shortened names

Use full words for every variable, parameter, property and import alias. Tests are **not** exempt: mounted wrappers, found elements and spies need descriptive names too.

| ❌ Forbidden                       | ✅ Use                                     |
| ---------------------------------- | ------------------------------------------ |
| `projType`, `codeGenType`          | `projectType`, `codeGenerationType`        |
| `cfg`, `config`                    | `configuration`                            |
| `cb`                               | `callback` / `checkbox` (whichever fits)   |
| `idx`, `i` (parameter)             | `index`, `tileIndex`                       |
| `len`                              | `length` / `count`                         |
| `arr`, `dict`                      | domain name (`tiles`, `spritesMap`)        |
| `tmp`, `str`, `ctx`, `img`, `err`  | rename to the domain meaning (`context`, `image`, `error`) |
| `(v: string)`, `const w = ...`     | `(newValue: string)`, `const wrapper = ...` |

The only exceptions:

- **Domain acronyms used as a single token:** `zx0`, `zxide`, `zxSpectrum`, `vscode`, `asm`. Use them as-is.
- **`item`** as a generic loop variable when the loop body has no domain meaning.
- **Standard acronyms** such as `id`, `url`, `uri`, `json`, `html`, `css`.

---

## Rule 5 — Member variables

- No underscore prefix on members (`panel`, not `_panel`).
- Exception: a private backing field for a public accessor with the same name (`private _foo` backing `get foo()`).
- Members inherited from existing base classes (`_subscriptions`, `_isEnabled`) are exempt; do not rename them.

---

## Rule 6 — Never `null`

- **Never use `null`.** Use `undefined` and the optional `?` modifier.

  ```ts
  // ❌ Wrong
  let source: string | null = null;
  function find(id: string): Item | null;

  // ✅ Correct
  let source: string | undefined;
  function find(id: string): Item | undefined;
  function load(path?: string): void;
  ```

- Exception: third-party or DOM APIs that require or return `null` (`JSON.stringify(value, null, 2)`, `element.getAttribute(...)`). Convert to `undefined` at that boundary.

---

## Rule 7 — Imports and path aliases

- Use the project path aliases (`src/...`, `externalShared/...`, `@core/...`, `@z88dk/...`). Never use relative paths (`../../`) to reach outside the current folder.
- Code shared between projects lives in `projects/shared/` and is imported through an alias, never by a relative path that climbs out of the project.
- Group imports: external packages first, then alias imports, then relative imports within the same folder, with a blank line between groups.

---

## Rule 8 — Tests

- **Framework:** Vitest for unit tests.
- **Naming:** `describe` the unit, then `it("does X when Y")` in prose.
- **Assertions:** prefer `toBe`, `toEqual`, `toContain`, `toHaveBeenCalledWith` over truthy checks. One logical assertion per `it` as a rule of thumb.

---

## Rule 9 — Comments

- Comments explain **why**, never what. If a comment restates the next line, delete it.
- Only when truly required: a workaround, a constraint, a subtle invariant. One or two lines; if it needs a paragraph, refactor the code instead.
- **No requirement or spec references in source** (`REQ-*`, OpenSpec scenario ids, ticket numbers). The behavior contract lives in `openspec/`, not in the code.
- Exported APIs may have a short doc-comment with their contract.
- No decorative banners (`// ─── Foo ────`) except to anchor sections in files longer than ~200 lines.

---

## When a rule is unclear or missing

1. Check the skill of the project you are touching (`.ai/skills/zx-ide-*`).
2. Mirror the closest existing file in the codebase.
3. If still unclear, ask before applying the change, then record the decision in this rule or the matching skill.
