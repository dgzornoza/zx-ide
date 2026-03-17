import { createI18n } from "vue-i18n";

const messages = {
  en: {
    "extract-tiles": {
      title: "Extract Tiles",
      subtitle:
        "Generate tile definitions from a spritesheet and save them into your project.",
      sectionSource: "Source data",
      sourceLabel: "Source image",
      sourceHint:
        "Select the PNG or ZX-Paintbrush (.zxp) source file from your workspace.",
      browseButton: "Browse…",
      noFileSelected: "No file selected",
      sectionTiles: "Tiles",
      tilesHint:
        "Configure tile size and name each extracted tile. (tiles are ordered left to right, top to bottom)",
      tileWidthLabel: "Tile width (px)",
      tileHeightLabel: "Tile height (px)",
      tilesCountLabel: "Tiles found",
      tileNameLabel: "Tile {index}",
      addTile: "Add tile",
      create: "Create",
      statusSent: "Message sent in standalone mode.",
      statusMapDownloaded: "Map file downloaded successfully",
      mapSourceLabel: "Map file (optional)",
      mapSourceHint:
        "Load a previously saved .tiles.map file to restore tile configuration.",
      codeGenerationTypeLabel: "Code generation",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determined by the VS Code project type and cannot be changed here.",
      errorTileCountInvalid: "Tile count must be a non-negative number",
      errorTileWidthInvalid: "Tile width must be greater than zero",
      errorTileHeightInvalid: "Tile height must be greater than zero",
      errorTileNamesMismatch: "Tile names count must match the tile count",
      errorTileNameEmpty: "All tile names must be non-empty strings",
      errorTileExtractionFailed: "Failed to extract tiles from the source file",
      errorNoSourceFile: "Please select a source image before creating a map",
      errorMapLoadFailed:
        "Failed to load .tiles.map file: invalid or corrupted data",
    },
    "extract-sprites": {
      title: "Extract Sprites",
      subtitle:
        "Generate sprite definitions from a spritesheet and save them into your project.",
      sectionSource: "Source data",
      sourceLabel: "Source image",
      sourceHint: "Select the PNG source file from your workspace.",
      browseButton: "Browse…",
      noFileSelected: "No file selected",
      sectionSprites: "Sprites",
      spritesHint:
        "Define sprites by name, frame, and dimensions. Width and height are in pixels.",
      spriteNameLabel: "Name",
      spriteWidthLabel: "Width (px)",
      spriteHeightLabel: "Height (px)",
      frameLabel: "Frame",
      xLabel: "X",
      yLabel: "Y",
      playAnimation: "Play",
      stopAnimation: "Stop",
      addFrame: "Add frame",
      addSprite: "Add sprite",
      remove: "Remove",
      create: "Create",
      statusSent: "Message sent in standalone mode.",
      statusMapDownloaded: "Map file downloaded successfully",
      mapSourceLabel: "Map file (optional)",
      mapSourceHint:
        "Load a previously saved .sprites.map file to restore sprite configuration.",
      codeGenerationTypeLabel: "Code generation",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determined by the VS Code project type and cannot be changed here.",
      spriteSp1PaddingLabel: "Add SP1 padding",
      spriteSp1PaddingTooltip:
        "Adds 7 zero-bytes before and 8 zero-bytes after each sprite column (Used by the SP1 library).",
      spriteUseMaskLabel: "Use mask",
      spriteUseMaskTooltip: "Use a mask for the sprite.",
      errorNoSourceFile: "Please select a source image before creating a map",
      errorMapLoadFailed:
        "Failed to load .sprites.map file: invalid or corrupted data",
      errorSpriteNameRequired: "Sprite name is required",
      errorSpriteWidthInvalid: "Sprite width must be greater than zero",
      errorSpriteHeightInvalid: "Sprite height must be greater than zero",
      errorSpriteFramesInvalid: "Sprite frames must be an array",
      errorFrameXInvalid: "Frame X coordinate must be a non-negative number",
      errorFrameYInvalid: "Frame Y coordinate must be a non-negative number",
    },
  },
  es: {
    "extract-tiles": {
      title: "Extracción de tiles",
      subtitle:
        "Genera código fuente con la definición de tiles desde un archivo .png para usarlas en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Imagen fuente",
      sourceHint:
        "Selecciona el archivo PNG o ZX-Paintbrush (.zxp) de origen desde tu workspace.",
      browseButton: "Examinar…",
      noFileSelected: "Ningún archivo seleccionado",
      sectionTiles: "Tiles",
      tilesHint:
        "Configura el tamaño del tile y nombra cada tile extraído. (el orden será de izquierda a derecha, de arriba abajo)",
      tileWidthLabel: "Ancho tile (px)",
      tileHeightLabel: "Alto tile (px)",
      tilesCountLabel: "Tiles encontrados",
      tileNameLabel: "Tile {index}",
      addTile: "Agregar tile",
      create: "Crear",
      statusSent: "Mensaje enviado en modo standalone.",
      statusMapDownloaded: "Archivo .tiles.map descargado correctamente",
      mapSourceLabel: "Archivo .map (opcional)",
      mapSourceHint:
        "Carga un archivo .tiles.map guardado previamente para restaurar la configuración de tiles.",
      codeGenerationTypeLabel: "Generación de código",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determinado por el tipo de proyecto de VS Code y no se puede modificar aquí.",
      errorTileCountInvalid:
        "El número de tiles debe ser un entero no negativo",
      errorTileWidthInvalid: "El ancho del tile debe ser mayor que cero",
      errorTileHeightInvalid: "El alto del tile debe ser mayor que cero",
      errorTileNamesMismatch:
        "El número de nombres de tiles debe coincidir con el conteo de tiles",
      errorTileNameEmpty:
        "Todos los nombres de tiles deben ser cadenas no vacías",
      errorTileExtractionFailed:
        "No se pudieron extraer los tiles del archivo de origen",
      errorNoSourceFile:
        "Selecciona una imagen de origen antes de crear el mapa",
      errorMapLoadFailed:
        "No se pudo cargar el archivo .tiles.map: datos inválidos o corruptos",
    },
    "extract-sprites": {
      title: "Extracción de sprites",
      subtitle:
        "Genera código fuente con la definición de sprites desde un archivo .png para usarlas en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Imagen fuente",
      sourceHint: "Selecciona el archivo PNG de origen desde tu workspace.",
      browseButton: "Examinar…",
      noFileSelected: "Ningún archivo seleccionado",
      sectionSprites: "Sprites",
      spritesHint:
        "Define sprites por nombre, frame y dimensiones. El ancho y alto son en píxeles.",
      spriteNameLabel: "Nombre",
      spriteWidthLabel: "Ancho (px)",
      spriteHeightLabel: "Alto (px)",
      frameLabel: "Frame",
      xLabel: "X",
      yLabel: "Y",
      playAnimation: "Reproducir",
      stopAnimation: "Detener",
      addFrame: "Agregar frame",
      addSprite: "Agregar sprite",
      remove: "Quitar",
      create: "Crear",
      statusSent: "Mensaje enviado en modo standalone.",
      statusMapDownloaded: "Archivo .sprites.map descargado correctamente",
      mapSourceLabel: "Archivo .map (opcional)",
      mapSourceHint:
        "Carga un archivo .sprites.map guardado previamente para restaurar la configuración de sprites.",
      codeGenerationTypeLabel: "Generación de código",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determinado por el tipo de proyecto de VS Code y no se puede modificar aquí.",
      spriteSp1PaddingLabel: "Añadir padding SP1",
      spriteSp1PaddingTooltip:
        "Añade 7 bytes a cero antes y 8 bytes a cero después de cada columna del sprite (Utilizado por la librería SP1).",
      spriteUseMaskLabel: "Usar máscara",
      spriteUseMaskTooltip: "Usar sprites con máscara.",
      errorNoSourceFile:
        "Selecciona una imagen de origen antes de crear el mapa",
      errorMapLoadFailed:
        "No se pudo cargar el archivo .sprites.map: datos inválidos o corruptos",
      errorSpriteNameRequired: "El nombre del sprite es requerido",
      errorSpriteWidthInvalid: "El ancho del sprite debe ser mayor que cero",
      errorSpriteHeightInvalid: "La altura del sprite debe ser mayor que cero",
      errorSpriteFramesInvalid: "Los frames del sprite deben ser un array",
      errorFrameXInvalid:
        "La coordenada X del frame debe ser un entero no negativo",
      errorFrameYInvalid:
        "La coordenada Y del frame debe ser un entero no negativo",
    },
  },
} as const;

export type SupportedLocale = keyof typeof messages;

const normalizeLocale = (value?: string): SupportedLocale => {
  if (!value) {
    return "en";
  }
  const lower = value.toLowerCase();
  if (lower.startsWith("es")) {
    return "es";
  }
  return "en";
};

export const getInitialLocale = (): SupportedLocale => {
  if (typeof window === "undefined") {
    return "en";
  }
  return normalizeLocale(window.__WEBVIEW_LOCALE__ ?? navigator.language);
};

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages,
});
