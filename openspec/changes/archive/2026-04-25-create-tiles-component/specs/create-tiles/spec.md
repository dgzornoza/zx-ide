## ADDED Requirements

### Requirement: Composición visual del componente principal

El componente DEBE incluir en la parte superior el panel de entrada binaria (`BinaryInputPanel`).
El componente DEBE incluir una sección separadora para generar código (igual a `extract-tiles`).
El componente DEBE incluir una lista de *tiles* coleccionados en la parte inferior, usando un componente reutilizado de "colección / galería".

#### Scenario: Visualización básica

- **WHEN** El usuario ingresa a la vista de creación de tiles.
- **THEN** Puede ver el panel con caja de entrada de texto, su previsualización vacía al lado, el botón "Añadir", los controles de exportación (C/ASM y Crear Código) y una galería de tiles vacía.

### Requirement: Colección de Tiles

El botón Añadir en la superficie superior DEBE traspasar la representación validada del tile a una colección mostrada en la parte inferior del flujo.
Los tiles coleccionados DEBEN poder extraerse o eliminarse de la colección individualmente usando un control de "cierre" / exclusión superpuesto a su vista previa de 40x40.
Los tiles DEBEN ser del mismo ancho por alto en la colección, tomando como referencia el primero añadido o requiriendo consistencia general si corresponde en la galería.

#### Scenario: Añadir tile a colección

- **WHEN** Se pulsa el botón "Añadir" y el contenido de la caja de texto binaria es válido.
- **THEN** Se inserta visualmente un nuevo elemento de representación gráfica a la galería inferior.

#### Scenario: Eliminar tile de colección

- **WHEN** Se hace clic en el botón de exclusión ("+" / "-" o "x") de la esquina de una vista previa en la colección.
- **THEN** El tile desaparece de la vista y ya no será procesado por la generación de código.

### Requirement: Generación de código a partir de la colección

El sistema DEBE proveer botones radiales para escoger exportar en lenguajes C o ASM Z80.
El sistema DEBE ejecutar la exportación únicamente al presionar el botón "Crear Código".
La exportación generará una o varias estructuras según la API compartida, recibiendo los listados unitarios de bits que componen a cada tile de la colección y mostrando el string resultante en la vista en formato de código no editable.

#### Scenario: Exportación a Ensamblador o C

- **WHEN** El usuario elige código tipo ASM y pulsa "Crear Código" contando con 3 tiles en colección.
- **THEN** El panel muestra etiquetas `tiles: defb %...` o declaraciones hex decimales equivalentes a las matrices cargadas.
