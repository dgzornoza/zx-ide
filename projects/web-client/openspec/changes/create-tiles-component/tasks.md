## 1. Refactorización a Entidades Compartidas (Shared)

- [x] 1.1 Extraer el control de *Radio Buttons* (`CodeGenerationType`) de `SourceSection.vue` hacia un componente nuevo `CodeGenerationSelector.vue` en `src/shared/components/`.
- [x] 1.2 Mover la lógica de generación C/ASM (`codeGenerators/*` y `codeGeneratorFactory.ts`) desde `src/extract-tiles/composables/` a `src/shared/composables/`.
- [x] 1.3 Mover los modelos requeridos (como `TilesModel`) desde `extract-tiles/models/` a `src/shared/models/` para evitar acoplamiento horizontal.

## 2. Setup y UI de Entrada Binaria

- [x] 2.1 Crear directorio y estructura base del componente `create-tiles` en `projects/web-client/src/create-tiles/`.
- [x] 2.2 Crear el componente compartido `BinaryInputPanel.vue` en `src/shared/components/` dado que se reutilizará para sprites.
- [x] 2.3 Implementar el cuadro de texto `textarea` que acepte `0` y `1` y la lógica de validación reactiva que verifique los caracteres prohibidos y disparidad.
- [x] 2.4 Implementar en `BinaryInputPanel.vue` el renderizado *pixelated* de los datos ingresados al lado derecho usando Canvas o bloques HTML dinámicos.
- [x] 2.5 Implementar componente base `App.vue` de `create-tiles` integrando `BinaryInputPanel.vue` en el inicio de pantalla.

## 3. Colección de Tiles

- [x] 3.1 Extraer la interfaz gráfica de `TilesSection.vue` a un componente común para que `create-tiles` pueda consumirlo.
- [x] 3.2 Conectar el botón "Añadir" del panel de entrada binaria para inyectar el gráfico al estado local (`state.tiles.previews` y matrices de tintas).
- [x] 3.3 Implementar la exclusión/borrado de los *tiles* conectando eventos entre la UI de `TilesSection` y el estado local.

## 4. Exportación y UX

- [x] 4.1 Integrar `CodeGenerationSelector.vue` (refactorizado en 1.1) justo antes de la colección para seleccionar C / ASM.
- [x] 4.2 Integrar en el *footer* el botón "Crear Código".
- [x] 4.3 Adaptar el generador de código movido (en 1.2) para que reciba y transforme los *tiles* coleccionados del estado actual de `create-tiles`.
- [x] 4.4 Integrar `ResultsSection.vue` y asegurar que la salida reciba el texto parseado de C o ASM de forma limpia.
- [x] 4.5 Ajustar traducciones necesarias en `i18n.ts` y añadir la entrada en la navegación de la aplicación si corresponde.
