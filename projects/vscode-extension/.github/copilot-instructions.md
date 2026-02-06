# Copilot instructions for zx-ide VS Code extension

## Big picture

- This is a VS Code extension bundled with webpack (entry [src/extension.ts](src/extension.ts#L1)). Activation is gated by workspaceContains `.zxide.json` in [package.json](package.json#L18).
- Dependency injection is centralized in [src/inversify.config.ts](src/inversify.config.ts#L1) using Inversify; most classes are `@injectable()` and registered in the container. When you add a new command/service, bind it here.
- The extension detects project type by reading `.zxide.json` and sets a VS Code context key `ZxIdeProjectType` in [src/core/services/features.service.ts](src/core/services/features.service.ts#L1). That context drives feature activation.

## Core flows and services

- Commands inherit from the `Command` base, which auto-registers the VS Code command in its constructor ([src/core/abstractions/command.ts](src/core/abstractions/command.ts#L1)). Creating a command normally means: define class → bind in Inversify → ensure it is resolved in `activate()`.
- `CreateProjectCmd` runs a bundled CLI (`zx-ide-cli.js`) via the terminal, writes an output JSON file, then reopens the workspace ([src/commands/create-project.cmd.ts](src/commands/create-project.cmd.ts#L1)). The CLI bundle is copied from `../cli/dist` by webpack ([webpack.config.js](webpack.config.js#L28)).
- Z88DK projects: after build tasks end, the extension moves `.lis/.sym/.o` files into `bin/` and emits a build report by parsing the `.map` file ([src/z88dk/services/z88dk-project.service.ts](src/z88dk/services/z88dk-project.service.ts#L1), [src/z88dk/services/z88dk-report.service.ts](src/z88dk/services/z88dk-report.service.ts#L1)).
- Z88DK asm debugging: when `zxide.z88dk.useAsmDebug` is enabled, breakpoints are remapped from C/ASM sources to the generated `.source.lis` file ([src/z88dk/services/z88dk-asm-breakpoints.service.ts](src/z88dk/services/z88dk-asm-breakpoints.service.ts#L1)). Breakpoint mapping uses language strategies in [src/z88dk/services/z88dk-asm-breakpoints-language.strategy.ts](src/z88dk/services/z88dk-asm-breakpoints-language.strategy.ts#L1).

## Project conventions

- Disposables: all long-lived objects extend `Disposable` and push subscriptions into `_subscriptions` ([src/core/abstractions/disposable.ts](src/core/abstractions/disposable.ts#L1)). The Inversify `onActivation` hook auto-subscribes disposables.
- Workspace file edits go through `WorkspaceHelpers.writeWorkspaceJsonFile` to preserve JSONC comments when mutating files like `.vscode/launch.json` ([src/core/helpers/workspace-helpers.ts](src/core/helpers/workspace-helpers.ts#L1)).
- Global array extension `groupBy` is added in [src/core/helpers/array-helpers.ts](src/core/helpers/array-helpers.ts#L1). Avoid redefining or shadowing it.
- Path aliases are used everywhere (`@core/*`, `@z88dk/*`, etc.) and are configured in [tsconfig.json](tsconfig.json#L1) and [webpack.config.js](webpack.config.js#L17).

## Workflows (build/test)

- Build/watch: `npm run watch` (also builds the external CLI via `npm --prefix ../cli run build`). See [package.json](package.json#L37).
- Package: `npm run package` builds the CLI then webpack production bundle.
- Tests: `npm run test` after `npm run pretest` (compile tests + compile + lint). See [package.json](package.json#L43).

## Integration points

- Output and terminal interactions are centralized in `OutputChannelService` and `TerminalService` ([src/core/services/output-channel.service.ts](src/core/services/output-channel.service.ts#L1), [src/core/services/terminal.service.ts](src/core/services/terminal.service.ts#L1)). Reuse these for new user-facing output/terminal flows.
- Localization strings come from `package.nls.json` and `package.nls.es.json` (command titles, config descriptions). Follow that pattern for any new user-visible text.

## ZxideFile structure

- `ZxideFile` interface in [src/core/infrastructure.ts](src/core/infrastructure.ts#L26) defines the schema for `.zxide.json` with properties:
  - `template-version`: version of the template
  - `project.type`: project type (`'sjasmplus'` or `'z88dk'`)
  - `project.assetsGraphics`: optional array of workspace-relative paths to graphics files (`.zxp` format) managed by `AttachProjectGraphicsCmd` ([src/commands/attach-project-graphics.cmd.ts](src/commands/attach-project-graphics.cmd.ts#L1))
- Always use camelCase for interface properties (e.g., `assetsGraphics`, not `AssetsGraphics`)
