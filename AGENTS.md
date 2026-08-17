# AGENTS.md — Workspace (zx-ide)

Este archivo centraliza las instrucciones generales para asistentes AI que trabajan en este workspace (GitHub Copilot, Continue, u otros).

## Uso general

- Consulta las instrucciones específicas por proyecto dentro de `.ai/instructions/` antes de hacer cambios en ese proyecto.
  - CLI: [.ai/instructions/cli.md](.ai/instructions/cli.md)
  - VS Code extension: [.ai/instructions/vscode-extension.md](.ai/instructions/vscode-extension.md)
  - Web-client: [.ai/instructions/web-client.md](.ai/instructions/web-client.md)
- Cuando trabajes en `projects/web-client`, carga el skill `vue-best-practices` desde `.ai/skills/vue-best-practices/`.
- Para cambios que afectan a varios proyectos (por ejemplo: cambiar DTOs compartidos), documenta el alcance en la PR y actualiza los archivos relevantes en `.ai/instructions/`.

## Convenciones de Agentes

- Antes de editar código, revisa la instrucción del proyecto correspondiente en `.ai/instructions/`.
- Mantén el estilo y convención del proyecto (TypeScript, nombres en camelCase, sin abreviaturas).
- Si detectas un nuevo "skill" o convención orgánica (ej. elección de librería o patrón), registra la decisión y agrega una breve nota en `.ai/instructions/` o propone un `AGENTS.md` update.

## Convenciones TypeScript (todos los proyectos)

- **No usar `null`** — usar siempre `undefined`. Las propiedades opcionales se declaran con `?`: `myVar?: string;` en lugar de `myVar: string | null`.
- Los parámetros y variables opcionales siguen el mismo patrón: `function foo(bar?: string)` en lugar de `function foo(bar: string | null)`.
- Código fuente y comentarios técnicos en inglés en todos los proyectos.

## Pautas de uso para asistentes

- Para tareas de diseño o decisiones de arquitectura, sugiere alternativas con pros/cons y solicita confirmación antes de aplicar cambios.
- Para tareas locales (ej. arreglar un bug en `projects/cli`), aplica cambios mínimos y céntrate en la causa raíz.
- Para cambios que requieran múltiples commits o pasos, crea un checklist en la PR y usa el archivo `.ai/instructions/` correspondiente para documentar por qué se hicieron las decisiones.

## Contacto

- Si no está claro qué instrucción usar, pregunta en la PR o añade un comentario en el issue asociado antes de aplicar cambios.