---
name: zx-ide-cli
description: "Trigger: any change under projects/cli (commander options, new-project wizard, generator builders, project templates, placeholders, .zxide.json generation). Architecture, conventions and workflows of the zx-ide CLI."
metadata:
  author: "dgonzalez"
  version: "1.0"
---

# zx-ide CLI

## Activation Contract

Load when reading or editing anything under `projects/cli/`, or when a change in another project depends on the CLI output (for example `CreateProjectCmd` in the VS Code extension).

Code style rules live in `.ai/rules/gov-typescript-code-style.md`; this skill adds the CLI-specific architecture and conventions on top of them.

## Big picture

- Entry point is `projects/cli/src/index.ts`: the CLI parses args with `commander`, prints the title with `figlet`, then runs either `NewProjectWizard` (interactive) or `NewProjectModel` (args-based) and finally `NewProjectGenerator`.
- Project creation flow: `NewProjectWizard` → `WizardStrategyFactory` chooses the per-compiler prompt strategy → `NewProjectGenerator` selects a `GeneratorBuilder` (sjasmplus/z88dk) → the builder creates `.zxide.json`, copies templates and replaces placeholders. See `src/new-project/new-project-wizard.ts` and `src/new-project/new-project-generator.ts`.
- Generators use template ZIPs under `projects/cli/templates/` and rely on placeholder tokens like `{ZX-IDE_PROJECT_NAME}`. Replacement is centralized in `FileHelpers.replaceValueInFile()` in `src/helpers/file.helpers.ts`.

## Template conventions

- Template naming follows `{compiler}_base.zip` and `{compiler}_{system}_sample.zip` per `templates/readme.md`.
- Placeholder tokens are defined by `ProjectReplacementConstants` in `src/infrastructure.ts` and are replaced in specific files:
  - sjasmplus: `src/_sjasmplus.asm`, `.vscode/launch.json`, `.vscode/tasks.json`, `.devcontainer/devcontainer.json` in `src/new-project/generator-strategies/sjasmplus-generator-builder.ts`.
  - z88dk: `Makefile`, `.vscode/launch.json`, `.devcontainer/devcontainer.json`, `src/z88dk_headers.h`, `.vscode/settings.json`, `.vscode/tasks.json` in `src/new-project/generator-strategies/z88dk-generator-builder.ts`.

## Project-type strategies

- Wizard strategies live in `src/new-project/wizard-strategies/` and must implement `IWizardStrategy` (machine + configuration selection).
- Generator strategies live in `src/new-project/generator-strategies/` and must extend `GeneratorBuilder`.
- z88dk configuration variants map to include paths, compiler args and header includes inside the `Z88dkGeneratorBuilder` strategy classes.

## Patterns to follow

- Keep the CLI options in `setupCommander()` (`src/index.ts`) synchronized with the `NewProjectModel` fields.
- Use `FileHelpers.getAbsolutePath()` for template paths (it is based on `__dirname`) and `FileHelpers.getRealSystemPath()` for user-supplied target paths.
- `NewProjectModel` and `ZxideFile` are consumed by the VS Code extension too. Changing them is a cross-project change: update the extension (`projects/vscode-extension/src/core/infrastructure.ts`) in the same change.

## Workflows

Run every command from `projects/cli/`:

- Build: `npm run build` (webpack production).
- Dev run: `npm run start` (webpack dev, then `node --inspect=9229 dist/zx-ide-cli.js`) for debugging.
- Watch: `npm run watch` rebuilds the dev bundle on every save. Run it alongside `npm run watch` in `projects/vscode-extension/` so the extension's `CopyWebpackPlugin` re-copies the CLI bundle whenever the CLI rebuilds.
- Lint: `npm run lint`.
