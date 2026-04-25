## ADDED Requirements

### Requirement: Usuario puede diseñar sprites manualmente con matrices binarias

El sistema SHALL permitir al usuario introducir matrices de `0` y `1` (separadas por saltos de línea) en un panel de entrada (`BinaryInputPanel`) para definir cada frame de un sprite, y SHALL mostrar una previsualización pixelada en tiempo real.

#### Scenario: Entrada binaria válida genera previsualización

- **WHEN** el usuario introduce únicamente caracteres `0`, `1` y saltos de línea en el textarea
- **THEN** el sistema SHALL renderizar en tiempo real una previsualización pixelada del patrón binario

#### Scenario: Entrada con caracteres inválidos muestra error

- **WHEN** el usuario introduce cualquier carácter distinto de `0`, `1` o salto de línea
- **THEN** el sistema SHALL mostrar un mensaje de error en rojo y el botón "Añadir" SHALL estar deshabilitado

#### Scenario: Filas de longitud desigual muestran error

- **WHEN** el usuario introduce filas de diferente longitud
- **THEN** el sistema SHALL mostrar un mensaje de error en rojo y el botón "Añadir" SHALL estar deshabilitado

### Requirement: Cada pulsación de "Añadir" crea un frame en el sprite activo

El sistema SHALL añadir el bitmap binario actual como un nuevo frame al sprite activo cuando el usuario pulse el botón "Añadir" del panel de entrada.

#### Scenario: Añadir frame a sprite activo

- **WHEN** la entrada binaria es válida y el usuario pulsa "Añadir"
- **THEN** el sistema SHALL crear un nuevo frame en el sprite activo con el bitmap introducido y SHALL limpiar el textarea

#### Scenario: Añadir frame con dimensiones distintas al primer frame del sprite

- **WHEN** el bitmap ingresado tiene dimensiones (width × height) diferentes al primer frame del sprite activo
- **THEN** el sistema SHALL mostrar un mensaje de error y SHALL rechazar la inserción sin modificar el estado

### Requirement: Usuario puede gestionar múltiples sprites

El sistema SHALL permitir al usuario crear nuevos sprites y eliminarlos de la colección.

#### Scenario: Crear nuevo sprite

- **WHEN** el usuario pulsa el botón "Nuevo sprite"
- **THEN** el sistema SHALL añadir un nuevo sprite vacío a la colección y SHALL establecerlo como sprite activo

#### Scenario: Eliminar sprite existente

- **WHEN** el usuario pulsa el botón de eliminar de un sprite
- **THEN** el sistema SHALL remover ese sprite y todos sus frames de la colección

#### Scenario: Eliminar frame de un sprite

- **WHEN** el usuario pulsa el botón de eliminar de un frame
- **THEN** el sistema SHALL remover ese frame del sprite correspondiente

### Requirement: Usuario puede generar código C o ASM

El sistema SHALL permitir al usuario seleccionar el tipo de salida (C o ASM) y SHALL generar el código fuente correspondiente para todos los sprites activos de la colección al pulsar "Crear Código".

#### Scenario: Generación de código con sprites en la colección

- **WHEN** la colección tiene al menos un sprite con al menos un frame y el usuario pulsa "Crear Código"
- **THEN** el sistema SHALL generar el archivo de código (C o ASM) y el archivo `.cfg` de la colección y SHALL ofrecerlos para descarga

#### Scenario: Botón "Crear Código" deshabilitado sin sprites

- **WHEN** la colección de sprites está vacía
- **THEN** el botón "Crear Código" SHALL estar deshabilitado
