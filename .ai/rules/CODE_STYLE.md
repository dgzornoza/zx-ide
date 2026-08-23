# Code Style — zx-ide

This document is the **single source of truth** for code style rules that apply
across every project in this workspace (`projects/cli`, `projects/vscode-extension`,
`projects/web-client`, shared DTOs, and any future project).

Project-specific instructions (architecture, workflows, file layout) live in
[`.ai/rules/`](.) and the per-project `README.md`. **When a
rule in a project instruction contradicts this file, this file wins.** If you
spot a contradiction, fix it in the project instruction — do not fork the rule.

---

## 1. Language

- **All identifiers, comments, and developer-facing strings must be written in English.**
- Public/contextual user-facing copy (UI labels, button text, error messages,
  GitHub PR descriptions, GitHub issue/PR comments) follows the target context
  language and is governed by the project's i18n setup.
- Code artifacts (commit messages, branch names, code comments, doc-comments)
  default to English even when the surrounding conversation is in another
  language.

---

## 2. File layout and naming

| Kind | Convention | Example |
| --- | --- | --- |
| TypeScript source | kebab-case | `use-project-type-lock.ts` |
| Vue SFC component file | PascalCase | `CodeGenerationSelector.vue` |
| Shared Vue components folder | `src/shared/components/` | `src/shared/components/CodeGenerationSelector.vue` |
| Commands (VS Code extension) | `<verb>-<subject>.cmd.ts` | `attach-project-tiles.cmd.ts` |
| Services | `*.service.ts` | `output-channel.service.ts` |
| Helpers | `*.helpers.ts` | `workspace-helpers.ts` |
| Decorators | `*.decorator.ts` | `injectable.decorator.ts` |
| Strategies | `*.strategy.ts` | `z88dk-asm-breakpoints-language.strategy.ts` |
| Tests | mirror the source path + `.spec.ts` | `src/shared/composables/useProjectTypeLock.spec.ts` |

Never use generic suffixes like `-command` or `-component`. Always follow the
naming pattern of existing files in the same folder before inventing a new one.

---

## 3. TypeScript style

### 3.1 Identifiers and naming

| Element | Convention | Example |
| --- | --- | --- |
| Variables, parameters, properties | camelCase | `codeGenerationType`, `projectType` |
| Types, interfaces, classes, enums | PascalCase | `ProjectType`, `VscodeBridge` |
| Compile-time constants | UPPER_SNAKE_CASE | `MAX_TILE_COUNT` |
| Boolean variables and props | affirmative predicate or `is/has/should` prefix | `isCompressionApplicable`, `hasFrame` |
| Union types for code-gen target | lowercase literal strings | `"asm" \| "c"` |

### 3.2 No abbreviations

Use full words everywhere. **No abbreviations** in variable, parameter, or
property names. Examples of forbidden abbreviations:

| ❌ Forbidden | ✅ Use |
| --- | --- |
| `projType` | `projectType` |
| `codeGenType` | `codeGenerationType` |
| `cfg` (variable) | `configuration` |
| `cb` (variable) | `checkbox` / `callback` (whichever fits) |
| `idx` | `index` (or `itemIndex`) |
| `len` | `length` / `count` |
| `arr` | `<domainName>` (`tiles`, `sprites`, `frameList`) |
| `dict` | `<domainName>Map` / `<domainName>Record` |
| `tmp` | rename or inline |
| `comp` (component) | `<Domain>Section` / `<Domain>Panel` |

The only exceptions are:

- **Domain acronyms that are part of the public API** and used as a single
  token: `zx0`, `zxide`, `zxSpectrum`, `vscode`. Use them as-is — do not spell
  them out.
- **Trivial iteration variables**: `item` is acceptable as a generic loop
  variable name when the loop body has no domain meaning.
- **Standard library / framework identifiers**: `i`, `j`, `k` for indices,
  `e` for `event`, `el` for `element` when matching the framework's own
  convention. Prefer descriptive names anyway.

### 3.3 No single-letter or shortened parameter names

Single-letter or shortened parameter names are forbidden:

| ❌ Forbidden | ✅ Use |
| --- | --- |
| `(v: string)` | `(newValue: string)` |
| `(i: number)` | `(index: number)` (or `itemIndex`) |
| `(r: Ref<…>)` | `(ref: Ref<…>)` (or `<domain>Ref`) |
| `const w = factory()` | `const wrapper = factory()` |
| `const r = findAll(…)` | `const radios = findAll(…)` |
| `const cb = find(…)` | `const checkbox = find(…)` |

Tests are **not** exempt. Mounted wrappers, found inputs, and captured spies
all need descriptive names.

### 3.4 Member variables

No underscore prefix on member variables (`panel`, not `_panel`).

The only exception is a private backing field when a public property with the
same name exists on the same class (e.g. `private _foo` backing `get foo()`).
Inherited members from base classes (e.g. `_subscriptions`, `_isEnabled`) are
also exempt — do not rename them.

### 3.5 Null vs undefined

- **Never use `null`.** Use `undefined` and the optional `?` modifier.

  ```ts
  // ❌ Wrong
  let source: string | null = null;
  function find(id: string): Item | null;

  // ✅ Correct
  let source?: string;
  function find(id: string): Item | undefined;
  ```

- Optional parameters and variables follow the same pattern:
  `function foo(bar?: string)` instead of `function foo(bar: string | null)`.

### 3.6 Imports and path aliases

- Always use the project-defined path aliases (e.g. `src/shared/...`,
  `externalShared/...`, `@core/...`, `@z88dk/...`). Never use relative paths
  (`../../`) to reach outside the current folder.
- Group imports: external deps first, then alias imports, then relative imports
  within the same folder. Blank line between groups.

---

## 4. Vue 3 (web-client only)

### 4.1 Component shape

- **Always Composition API with `<script setup lang="ts">`**. No Options API.
- Props: `defineProps<T>()`.
- Emits: `defineEmits<T>()` with explicit payload types.
- v-model: `defineModel<T>('name', { default: ... })`. Use `required: true`
  when the model is mandatory.
- Avoid `ref()` of large external objects — use `shallowRef()` and call
  `markRaw()` for library instances.
- Prefer `computed()` over `watchEffect()` for derived state.

### 4.2 Read-only state from composables

When a composable returns reactive state that callers should not mutate,
expose it as `readonly()` and provide explicit setter functions. Inside the
composable, mutations go through the setter so the lock logic (e.g.
project-type restriction) can run.

### 4.3 Templating

- Tailwind utility classes are the default. Theme tokens map to CSS custom
  properties: `var(--button-bg)`, `var(--ink-soft)`, etc.
- For dynamic Tailwind classes, see the
  [Tailwind dynamic class generation rule](web-client.md).
- `<template>` uses 2-space indentation. `<script>` uses 2-space indentation.
- Component file names use PascalCase; tag names in templates use kebab-case
  for cross-folder imports (`<binary-input-panel>`) and PascalCase when
  imported explicitly.

### 4.4 Accessibility

- Form controls must have an associated `<label>` (use `for=`/`id=` or wrap the
  control).
- Decorative icons must have `aria-hidden="true"`.
- Interactive non-button elements (`<div role="button">`) need keyboard
  handlers.

---

## 5. Tests

- **Framework**: Vitest. Component tests use `@vue/test-utils` with `jsdom`
  environment (declared via `// @vitest-environment jsdom` at the top of the
  spec).
- **TDD mode**: strict TDD is enforced in projects that opt in (see
  [`rules/`](.) per project). When in doubt, write the
  test first.
- **Test naming**: describe the unit, then `it("does X when Y")` with prose.
- **Variable naming in tests**: full words. `wrapper`, `radio`, `checkbox`,
  `handler` — never `w`, `r`, `cb`, `h`.
- **Assertions**: prefer `toBe`, `toEqual`, `toContain`, `toHaveBeenCalledWith`
  over truthy checks. One logical assertion per `it` is the rule of thumb.

---

## 6. Comments

- Comments explain **why**, not what. The code already shows what it does.
- Public/exported APIs should have a short doc-comment with the contract.
- No decorative comment banners (`// ─── Foo ────`) inside short files. Use
  them only to anchor large sections in files longer than ~200 lines.
- Inline comments are in English, terse, and never decorative.

---

## 7. Git

- **No AI attribution in commits.** No `Co-Authored-By: …` lines for AI tools.
  No "Generated by …" trailers.
- **Conventional commits**: `<type>(<scope>): <subject>` — e.g.
  `feat(web-client): lock code-gen selector by project type`.
- Branch names are kebab-case and descriptive: `feat/lock-code-gen-selector`.

---

## 8. What to do when a rule is unclear or missing

1. Check the per-project instruction in `.ai/rules/<project>.md`.
2. Check the closest existing file in the codebase and mirror its style.
3. If still unclear, ask in the PR before merging.

This document is meant to evolve. When you add a new rule, link the source
(PR, discussion) at the bottom of the relevant section.
