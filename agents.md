# Copilot instructions for zx-ide workspace

## Overview

zx-ide is a retro-development toolkit for the ZX Spectrum. The codebase is a multi-root VS Code workspace (see [zx-ide.code-workspace](zx-ide.code-workspace)) with these workspace folders:

| Folder | Purpose |
|--------|---------|
| `doc` | Development notes and documentation ([Development.md](doc/Development.md)) |
| `shared` | TypeScript types/DTOs shared across projects (e.g. [extract-graphics-dtos.ts](projects/shared/extract-graphics/extract-graphics-dtos.ts)) |
| `vscode-extension` | VS Code extension — see [projects/vscode-extension/Agents.md](projects/vscode-extension/Agents.md) |
| `cli` | Node CLI for project scaffolding — see [projects/cli/Agents.md](projects/cli/Agents.md) |
| `web-client` | Vue 3 webview apps embedded in the extension — see [projects/web-client/Agents.md](projects/web-client/Agents.md) |

## Cross-project relationships

```
┌──────────────┐     bundles CLI      ┌───────────────┐
│  cli          │◄────────────────────│ vscode-ext     │
└──────────────┘                      │                │
                                      │  hosts webview │
┌──────────────┐    Vite build ──►    │  (media/)      │
│  web-client   │─────────────────────┤                │
└──────────────┘                      └───────────────┘
       │                                     │
       └────── shared DTOs ──────────────────┘
              (projects/shared/)
```

- The **CLI** is bundled into the extension by webpack (copied from `../cli/dist`).
- The **web-client** is built with Vite and its output is synced into the extension's `media/` folder via [scripts/sync-web-client.cjs](projects/vscode-extension/scripts/sync-web-client.cjs).
- **Shared** DTOs (e.g. `WriteFilesMessage`, `InitMessage`) in `projects/shared/` are imported by both the extension and the web-client using relative paths.

## Conventions

- **Language**: TypeScript everywhere. Use camelCase for variables/properties, PascalCase for classes/interfaces.
- **No abbreviations** in variable names (e.g. `codeGenerationType`, not `codeGenType`).
- **i18n**: all user-facing strings are translated (EN + ES). Extension uses `package.nls.json`; web-client uses `vue-i18n` in [src/i18n.ts](projects/web-client/src/i18n.ts).
- **Disposables**: long-lived objects extend `Disposable` and push into `_subscriptions`.

## Building the full stack

```bash
# CLI
cd projects/cli && npm run build

# Web-client
cd projects/web-client && npm run build

# Extension (also rebuilds CLI)
cd projects/vscode-extension && npm run watch
```

## Per-project Agents

Each project folder contains its own `Agents.md` with detailed architecture, conventions and dev workflow information. **Always** consult the relevant project-level agents file before making changes:

- [projects/vscode-extension/Agents.md](projects/vscode-extension/Agents.md) — Extension architecture, Inversify DI, commands, services
- [projects/cli/Agents.md](projects/cli/Agents.md) — CLI scaffolding, templates, wizard/generator strategies
- [projects/web-client/Agents.md](projects/web-client/Agents.md) — Vue 3 webview apps, composables, VS Code bridge
