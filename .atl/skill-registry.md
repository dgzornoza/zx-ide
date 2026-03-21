# Skill Registry — zx-ide

Generated: 2026-03-20

## User Skills (`~/.copilot/skills/`)

| Name | Path | Trigger |
|------|------|---------|
| go-testing | `c:\Users\dgonzalez\.copilot\skills\go-testing\SKILL.md` | Writing Go tests, using teatest, adding test coverage |
| sdd-apply | `c:\Users\dgonzalez\.copilot\skills\sdd-apply\SKILL.md` | Implementing tasks from a change |
| sdd-archive | `c:\Users\dgonzalez\.copilot\skills\sdd-archive\SKILL.md` | Archiving a completed change |
| sdd-design | `c:\Users\dgonzalez\.copilot\skills\sdd-design\SKILL.md` | Writing technical design for a change |
| sdd-explore | `c:\Users\dgonzalez\.copilot\skills\sdd-explore\SKILL.md` | Exploring ideas or investigating codebase |
| sdd-init | `c:\Users\dgonzalez\.copilot\skills\sdd-init\SKILL.md` | Initialize SDD in a project |
| sdd-propose | `c:\Users\dgonzalez\.copilot\skills\sdd-propose\SKILL.md` | Creating a change proposal |
| sdd-spec | `c:\Users\dgonzalez\.copilot\skills\sdd-spec\SKILL.md` | Writing specs for a change |
| sdd-tasks | `c:\Users\dgonzalez\.copilot\skills\sdd-tasks\SKILL.md` | Breaking down a change into tasks |
| sdd-verify | `c:\Users\dgonzalez\.copilot\skills\sdd-verify\SKILL.md` | Verifying implementation against specs |
| skill-creator | `c:\Users\dgonzalez\.copilot\skills\skill-creator\SKILL.md` | Creating new AI agent skills |

## Project Skills (workspace-level)

| Name | Path | Trigger | Status |
|------|------|---------|--------|
| vue-best-practices | `.github/skills/vue-best-practices/SKILL.md` | Trabajar con .vue files, composables, Vite+Vue, Vue Router, Pinia | ✅ Disponible |

## Project Conventions (`.github/`)

| File | Scope | Description |
|------|-------|-------------|
| `.github/copilot-instructions.md` | Workspace | Instrucciones generales + referencias a instrucciones por proyecto |
| `.github/instructions/cli.instructions.md` | `projects/cli` | Stack CLI: commander, wizard/generator strategies, convenciones de templates |
| `.github/instructions/vscode-extension.instructions.md` | `projects/vscode-extension` | Stack extension: Inversify, Command base, disposables, flujos Z88DK |
| `.github/instructions/web-client.instructions.md` | `projects/web-client` | Stack web-client: Vue 3 + Composition API, bridge, i18n, Tailwind |

## Agents.md (pendientes de crear)

| Path | Status |
|------|--------|
| `projects/cli/Agents.md` | ⚠️ Referenciado en instrucciones, no existe |
| `projects/vscode-extension/Agents.md` | ⚠️ Referenciado en instrucciones, no existe |
| `projects/web-client/Agents.md` | ⚠️ Referenciado en instrucciones, no existe |
| `agents.md` (raíz repo) | ⚠️ Referenciado en instrucciones, no existe |

## Notes

- SDD skills (`sdd-*`) son cargados on-demand por el orquestador — no se inyectan en sub-agentes automáticamente.
- `skill-creator` activa cuando el usuario pide crear nuevos skills AI.
- Para trabajar en `projects/web-client`, cargar siempre `vue-best-practices` (cuando esté disponible).
- Para cambios multi-proyecto que afectan DTOs en `projects/shared`, documentar alcance y actualizar los tres archivos de instrucciones relevantes.
