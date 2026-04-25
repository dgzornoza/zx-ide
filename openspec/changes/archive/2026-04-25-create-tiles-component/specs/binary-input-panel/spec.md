## ADDED Requirements

### Requirement: Binary text matrix validation

El sistema DEBE permitir el ingreso de caracteres de texto.
La caja de texto DEBE evaluar la validez de los contenidos.
El sistema DEBE marcar como inválido cualquier contenido que no sean saltos de línea (puros) o `0`s y `1`s.
El sistema DEBE marcar como inválido si las distintas filas de bits (delimitadas por salto de línea) difieren en anchura.

#### Scenario: Contenido inválido introducido

- **WHEN** El usuario ingresa una letra "a", un espacio, o filas de longitudes dispares.
- **THEN** Sistema marca error visualmente (texto en rojo bajo la caja de texto) y bloquea la acción Añadir.

#### Scenario: Contenido válido

- **WHEN** El usuario ingresa líneas compuestas única y uniformemente de "0" y "1", con la misma longitud entre ellas.
- **THEN** El panel indica validez visual (sin error) y procesa la entrada para su previsualización.

### Requirement: Generación de visualización

El panel DEBE exponer un área `canvas` o `img` donde se dibujen bloques en base al ratio de la matriz extraída de texto.
Los bits "1" DEBEN dibujarse con color sólido contraste (e.g. negro) y los "0" transparente o fondo opuesto (blanco).

#### Scenario: Vista previa reactiva

- **WHEN** Hay caracteres binarios válidos en la entrada.
- **THEN** Sistema regenera instantáneamente cada vez que varíe el contenido la vista previa a la derecha del texto.
