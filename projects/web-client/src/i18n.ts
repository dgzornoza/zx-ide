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
        "Load a previously saved .cfg file to restore tile configuration.",
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
      errorMapLoadFailed: "Failed to load .cfg file: invalid or corrupted data",
      tileExcludeTooltip: "Exclude tile from output",
      tileIncludeTooltip: "Include tile in output",
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
        "Load a previously saved .cfg file to restore sprite configuration.",
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
      errorMapLoadFailed: "Failed to load .cfg file: invalid or corrupted data",
      errorSpriteNameRequired: "Sprite name is required",
      errorSpriteWidthInvalid: "Sprite width must be greater than zero",
      errorSpriteHeightInvalid: "Sprite height must be greater than zero",
      errorSpriteFramesInvalid: "Sprite frames must be an array",
      errorFrameXInvalid: "Frame X coordinate must be a non-negative number",
      errorFrameYInvalid: "Frame Y coordinate must be a non-negative number",
    },
    "extract-map-tileset": {
      title: "Extract Map Tileset",
      subtitle:
        "Generate assembly code from a Tiled JSON map file and save it into your project.",
      sectionSource: "Source data",
      sourceLabel: "Map file (.json)",
      sourceHint:
        "Select the Tiled JSON map file and its PNG tileset image together.",
      browseButton: "Browse\u2026",
      imageNotLoaded:
        "PNG not loaded. Re-select including {filename} alongside the .json file.",
      noFileSelected: "No file selected",
      sectionResults: "Results",
      tilesUsedLabel: "Tiles used",
      tilesBytesLabel: "Tiles size (bytes)",
      mapWidthLabel: "Map width (tiles)",
      mapHeightLabel: "Map height (tiles)",
      mapBytesLabel: "Map size (bytes)",
      totalBytesLabel: "Total size (bytes)",
      codeGenerationTypeLabel: "Code generation",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determined by the VS Code project type and cannot be changed here.",
      create: "Extract",
      statusSent: "Message sent in standalone mode.",
      errorTileCountExceeds255:
        "Tileset has {count} tiles, which exceeds the maximum of 255 for uint8 indexing.",
      errorJsonInvalid: "The map file is not valid JSON.",
      errorJsonRequired:
        "JSON map file required. TMX/XML files are not supported.",
      errorJsonUnsupportedFormat:
        "Unsupported map format. Please select a .json file.",
      errorJsonMissingField: "Missing or invalid required field: {field}.",
      errorNoLayers: "The map JSON does not contain any layers.",
      errorLayerDataInvalid:
        "Layer data must be an array of numeric tile identifiers.",
      errorJsonInvalidDimensions:
        "Map layer width and height must be greater than zero.",
      errorExporterVersionMismatch:
        "This map was exported with an unsupported exporter version.",
      errorGidOutOfRange:
        "Tile index out of range after normalisation. Check the map file consistency.",
      warningDimensionsMismatch:
        "PNG width ({actual}px) does not match expected ({expected}px). Preview may be incorrect.",
    },
  },
  es: {
    "extract-tiles": {
      title: "Extracción de tiles",
      subtitle:
        "Genera código fuente con la definición de tiles desde un archivo .png para usarlas en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Imagen origen",
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
      statusMapDownloaded: "Archivo .cfg descargado correctamente",
      mapSourceLabel: "Archivo .cfg (opcional)",
      mapSourceHint:
        "Carga un archivo .cfg guardado previamente para restaurar la configuración de tiles.",
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
        "No se pudo cargar el archivo .cfg: datos inválidos o corruptos",
      tileExcludeTooltip: "Excluir tile de la salida",
      tileIncludeTooltip: "Incluir tile en la salida",
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
      statusMapDownloaded: "Archivo .cfg descargado correctamente",
      mapSourceLabel: "Archivo .cfg (opcional)",
      mapSourceHint:
        "Carga un archivo .cfg guardado previamente para restaurar la configuración de sprites.",
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
        "No se pudo cargar el archivo .cfg: datos inválidos o corruptos",
      errorSpriteNameRequired: "El nombre del sprite es requerido",
      errorSpriteWidthInvalid: "El ancho del sprite debe ser mayor que cero",
      errorSpriteHeightInvalid: "La altura del sprite debe ser mayor que cero",
      errorSpriteFramesInvalid: "Los frames del sprite deben ser un array",
      errorFrameXInvalid:
        "La coordenada X del frame debe ser un entero no negativo",
      errorFrameYInvalid:
        "La coordenada Y del frame debe ser un entero no negativo",
    },
    "extract-map-tileset": {
      title: "Extraer mapa de tileset",
      subtitle:
        "Genera código ensamblador desde un archivo JSON de mapa Tiled y guárdalo en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Archivo de mapa (.json)",
      sourceHint:
        "Selecciona el archivo .json y su imagen PNG del tileset juntos.",
      browseButton: "Examinar\u2026",
      imageNotLoaded:
        "PNG no cargado. Vuelve a seleccionar incluyendo {filename} junto al archivo .json.",
      noFileSelected: "Ningún archivo seleccionado",
      sectionResults: "Resultados",
      tilesUsedLabel: "Tiles usados",
      tilesBytesLabel: "Tamaño tiles (bytes)",
      mapWidthLabel: "Ancho del mapa (tiles)",
      mapHeightLabel: "Alto del mapa (tiles)",
      mapBytesLabel: "Tamaño del mapa (bytes)",
      totalBytesLabel: "Tamaño total (bytes)",
      codeGenerationTypeLabel: "Generación de código",
      codeGenerationTypeAsm: "ASM",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determinado por el tipo de proyecto de VS Code y no se puede modificar aquí.",
      create: "Extraer",
      statusSent: "Mensaje enviado en modo standalone.",
      errorTileCountExceeds255:
        "El tileset tiene {count} tiles, que supera el máximo de 255 para indexado uint8.",
      errorJsonInvalid: "El archivo de mapa no es un JSON válido.",
      errorJsonRequired:
        "Se requiere un archivo de mapa JSON. Los archivos TMX/XML no son compatibles.",
      errorJsonUnsupportedFormat:
        "Formato de mapa no compatible. Selecciona un archivo .json.",
      errorJsonMissingField:
        "Falta o es inválido el campo obligatorio: {field}.",
      errorNoLayers: "El JSON de mapa no contiene capas.",
      errorLayerDataInvalid:
        "Los datos de la capa deben ser un array de identificadores de tile numéricos.",
      errorJsonInvalidDimensions:
        "El ancho y alto de la capa del mapa deben ser mayores que cero.",
      errorExporterVersionMismatch:
        "Este mapa fue exportado con una versión de exportador no compatible.",
      errorGidOutOfRange:
        "Índice de tile fuera de rango tras la normalización. Comprueba la consistencia del archivo de mapa.",
      warningDimensionsMismatch:
        "El ancho del PNG ({actual}px) no coincide con el esperado ({expected}px). La vista previa puede ser incorrecta.",
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
  if (globalThis.window === undefined) {
    return "en";
  }
  return normalizeLocale(
    globalThis.window.__WEBVIEW_LOCALE__ ?? navigator.language,
  );
};

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages,
});
