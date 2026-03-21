# Copilot Instructions — Workspace (zx-ide)

Este archivo centraliza las instrucciones generales para GitHub Copilot / asistentes AI que trabajan en este workspace.

Uso general

- Consulta las instrucciones específicas por proyecto dentro de `.github/instructions/` antes de hacer cambios en ese proyecto.
  - CLI: [.github/instructions/cli.instructions.md](.github/instructions/cli.instructions.md)
  - VS Code extension: [.github/instructions/vscode-extension.instructions.md](.github/instructions/vscode-extension.instructions.md)
  - Web-client: [.github/instructions/web-client.instructions.md](.github/instructions/web-client.instructions.md)
- Cuando trabajes en `projects/web-client`, carga el skill `vue-best-practices` si está disponible.
- Para cambios que afectan a varios proyectos (por ejemplo: cambiar DTOs en `projects/shared`), documenta el alcance en la PR y actualiza los tres archivos relevantes si procede.

Convenciones de Copilot / Agentes

- Antes de editar código, revisa la instrucción del proyecto correspondiente en `.github/instructions/`.
- Mantén el estilo y convención del proyecto (TypeScript, nombres en camelCase, sin abreviaturas).
- Si detectas un nuevo "skill" o convención orgánica (ej. elección de librería o patrón), registra la decisión y agrega una breve nota en `.github/instructions/` o propone un `copilot-instructions.md` update.

### Convenciones TypeScript (todos los proyectos)

- **No usar `null`** — usar siempre `undefined`. Las propiedades opcionales se declaran con `?`: `myVar?: string;` en lugar de `myVar: string | null`.
- Los parámetros y variables opcionales siguen el mismo patrón: `function foo(bar?: string)` en lugar de `function foo(bar: string | null)`.

Pautas de uso para asistentes

- Para tareas de diseño o decisiones de arquitectura, sugiere alternativas con pros/cons y solicita confirmación antes de aplicar cambios.
- Para tareas locales (ej. arreglar un bug en `projects/cli`), aplica cambios mínimos y céntrate en la causa raíz.
- Para cambios que requieran múltiples commits o pasos, crea un checklist en la PR y usa el archivo `.github/instructions` correspondiente para documentar por qué se hicieron las decisiones.

Dónde buscar más contexto

- Lecturas rápidas: `projects/cli/Agents.md`, `projects/vscode-extension/Agents.md`, `projects/web-client/Agents.md` (archivos originales aún presentes en sus carpetas).
- Convenciones del workspace: [agents.md](agents.md) en la raíz del repo.

Contacto

- Si no está claro qué instrucción usar, pregunta en la PR o añade un comentario en el issue asociado antes de aplicar cambios.
