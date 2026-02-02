# Copilot instructions for zx-ide CLI

## Big picture

- Entry point is [src/index.ts](src/index.ts): CLI parses args with `commander`, prints title with `figlet`, then runs either `NewProjectWizard` (interactive) or `NewProjectModel` (args-based) and finally `NewProjectGenerator`.
- Project creation flow: `NewProjectWizard` ➜ `WizardStrategyFactory` chooses per-compiler prompt strategy ➜ `NewProjectGenerator` selects a `GeneratorBuilder` (sjasmplus/z88dk) ➜ builder creates .zxide.json, copies templates, and replaces placeholders. See [src/new-project/new-project-wizard.ts](src/new-project/new-project-wizard.ts) and [src/new-project/new-project-generator.ts](src/new-project/new-project-generator.ts).
- Generators use template ZIPs under [templates/](templates/) and rely on placeholder tokens like `{ZX-IDE_PROJECT_NAME}` etc. Replacement is centralized in `FileHelpers.replaceValueInFile()` in [src/helpers/file.helpers.ts](src/helpers/file.helpers.ts).

## Template conventions

- Template naming follows `{compiler}_base.zip` and `{compiler}_{system}_sample.zip` per [templates/readme.md](templates/readme.md).
- Placeholder tokens are defined by `ProjectReplacementConstants` in [src/infrastructure.ts](src/infrastructure.ts) and are replaced in specific files:
  - sjasmplus: `src/_sjasmplus.asm`, `.vscode/launch.json`, `.vscode/tasks.json`, `.devcontainer/devcontainer.json` in [src/new-project/generator-strategies/sjasmplus-generator-builder.ts](src/new-project/generator-strategies/sjasmplus-generator-builder.ts)
  - z88dk: `Makefile`, `.vscode/launch.json`, `.devcontainer/devcontainer.json`, `src/z88dk_headers.h`, `.vscode/settings.json`, `.vscode/tasks.json` in [src/new-project/generator-strategies/z88dk-generator-builder.ts](src/new-project/generator-strategies/z88dk-generator-builder.ts)

## Project-type strategies

- Wizard strategies live in [src/new-project/wizard-strategies/](src/new-project/wizard-strategies/) and must implement `IWizardStrategy` (machine + configuration selection).
- Generator strategies live in [src/new-project/generator-strategies/](src/new-project/generator-strategies/) and must extend `GeneratorBuilder`.
- z88dk configuration variants map to include paths, compiler args, and header includes inside `Z88dkGeneratorBuilder` strategy classes.

## Developer workflows

- Build: `npm run build` (webpack production) per [package.json](package.json).
- Dev run: `npm run start` (webpack dev then `node --inspect=9229 dist/zx-ide-cli.js`) for debugging.
- Lint: `npm run lint`.

## Patterns to follow

- Keep CLI options in `setupCommander()` in [src/index.ts](src/index.ts) synchronized with `NewProjectModel` fields.
- Use `FileHelpers.getAbsolutePath()` for template paths (it is based on `__dirname`) and `FileHelpers.getRealSystemPath()` for user-supplied target paths.
- Update version constants in [src/infrastructure.ts](src/infrastructure.ts) when bumping CLI version.
