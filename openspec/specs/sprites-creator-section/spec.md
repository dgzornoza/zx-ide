## ADDED Requirements

### Requirement: Componente muestra colección de sprites con sus frames

El sistema SHALL renderizar una sección que liste todos los sprites de la colección, mostrando para cada uno su nombre, dimensiones y la lista de frames como miniaturas pixeladas.

#### Scenario: Sección vacía sin sprites

- **WHEN** la colección de sprites está vacía
- **THEN** el componente SHALL mostrar la sección pero sin ítems de sprite visibles

#### Scenario: Visualización de frames como miniaturas

- **WHEN** un sprite tiene uno o más frames
- **THEN** el componente SHALL mostrar cada frame como una miniatura pixelada de 40×40 píxeles con `image-rendering: pixelated`

### Requirement: Componente está desacoplado de extract-sprites

El componente `SpritesCreatorSection.vue` SHALL no importar ningún módulo de `src/extract-sprites/`. SHALL depender únicamente de `src/shared/` y librerías externas.

#### Scenario: Importación sin dependencias horizontales

- **WHEN** se analiza estáticamente el grafo de importaciones de `SpritesCreatorSection.vue`
- **THEN** no SHALL existir ninguna importación cuya ruta comience por `src/extract-sprites`

### Requirement: Componente emite eventos para gestión de sprites y frames

El componente SHALL comunicarse con su padre exclusivamente mediante eventos Vue para todas las operaciones de mutación del estado.

#### Scenario: Emisión de evento add-sprite

- **WHEN** el usuario pulsa el botón "Nuevo sprite" dentro del componente
- **THEN** el componente SHALL emitir el evento `add-sprite` sin payload

#### Scenario: Emisión de evento remove-sprite

- **WHEN** el usuario pulsa el botón de eliminar de un sprite
- **THEN** el componente SHALL emitir `remove-sprite` con el índice del sprite como payload

#### Scenario: Emisión de evento remove-frame

- **WHEN** el usuario pulsa el botón de eliminar de un frame
- **THEN** el componente SHALL emitir `remove-frame` con los índices `[spriteIndex, frameIndex]` como payload
