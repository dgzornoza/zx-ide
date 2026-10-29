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

- Entry point is `projects/cli/src/index.ts`: the CLI parses args with `commander` (`createCommandLineProgram` in `src/command-line.ts`), prints the title (`renderTitle` in `src/title.ts`, `figlet`), then uses `readNewProjectArguments` when `--project-type`, `--project-path` (the folder where the project folder is created) and `--project-name` are all given, otherwise `NewProjectWizard` (interactive), and finally `NewProjectGenerator`. In args mode the generators also need `--machine-type` (both project types) and `--project-configuration` (z88dk); without them the run fails with the generator error.
- `figlet` 1.12 is an ES module with only a default export: import it as `import figlet from 'figlet'`. A namespace import compiles with two webpack warnings ("export 'textSync' was not found") and the bundle crashes at start; `title.spec.ts` pins it. Run the built bundle (`node dist/zx-ide-cli.js ...`) after dependency changes, a successful build is not enough.
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

- Keep the CLI options in `createCommandLineProgram()` and `readNewProjectArguments()` (`src/command-line.ts`) synchronized with the `NewProjectModel` fields.
- Use `FileHelpers.getAbsolutePath()` for template paths (it is based on `__dirname`) and `FileHelpers.getRealSystemPath()` for user-supplied target paths.
- `ZxideFile`, `NewProjectModel`, `MachineType`, `ProjectConfigurationType` and the default graphics paths live in `projects/shared/zxide-project.ts` (`ProjectType` in `projects/shared/infrastructure.ts`) because the VS Code extension consumes them too: the extension reads `.zxide.json` and the `NewProjectModel` JSON written to the `--output` file. Import them through the `externalShared/...` alias (and the cli's own files as `src/...`); both aliases are configured in `tsconfig.json`, `webpack.config.js` and `vitest.config.mjs`. Changing them is a cross-project change.
- `ZX_IDE_TEMPLATE_VERSION` (`src/infrastructure.ts`) is written as `template-version` in `.zxide.json`. When a zip in `templates/` changes, increase it and update the fingerprint in `src/template-version.spec.ts`; that spec fails until you do.

## Workflows

Run every command from `projects/cli/`:

- Build: `pnpm build` (webpack production).
- Tests: `pnpm test` (Vitest, `src/**/*.spec.ts`; `vitest.config.mjs` maps the `src/...` imports).
- Dev run: `pnpm start` (webpack dev, then `node --inspect=9229 dist/zx-ide-cli.js`) for debugging.
- Watch: `pnpm watch` rebuilds the dev bundle on every save. Run it alongside `pnpm watch` in `projects/vscode-extension/` so the extension's `CopyWebpackPlugin` re-copies the CLI bundle whenever the CLI rebuilds.
- Lint: `pnpm lint`.
- Format: `pnpm format` (Prettier, writes) / `pnpm format:check`.
