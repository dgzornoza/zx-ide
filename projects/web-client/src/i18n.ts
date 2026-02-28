import { createI18n } from "vue-i18n";

const messages = {
  en: {
    "extract-graphics": {
      title: "Attach project graphics",
      subtitle:
        "Generate tile and sprite definitions from a spritesheet and save them into your project.",
      sectionSource: "Source data",
      sourceLabel: "Source image",
      sourceHint: "Select the PNG source file from your workspace.",
      browseButton: "Browse…",
      noFileSelected: "No file selected",
      graphicsLabel: "Output data",
      graphicsHint: "Target folder for the generated graphics data.",
      sectionTiles: "Tiles",
      tilesHint:
        "Configure tile size and name each extracted tile. (tiles are ordered left to right, top to bottom)",
      tileWidthLabel: "Tile width (px)",
      tileHeightLabel: "Tile height (px)",
      tilesCountLabel: "Tiles found",
      tileNameLabel: "Tile {index}",
      sectionSprites: "Sprites",
      spritesHint:
        "Define sprites by name, frame, and dimensions. (all values are in 8x8 cell units at the character level)",
      spriteNameLabel: "Name",
      spriteWidthLabel: "Width",
      spriteHeightLabel: "Height",
      frameLabel: "Frame",
      columnLabel: "Column",
      rowLabel: "Row",
      addFrame: "Add frame",
      addTile: "Add tile",
      addSprite: "Add sprite",
      remove: "Remove",
      create: "Create",
      statusSent: "Message sent in standalone mode.",
      errorSourceRequired: "Asset Graphics File is required",
      errorSourceNotPng: "Asset Graphics File must be a .png image",
      errorSourceAbsolutePath:
        "Asset Graphics File must be a workspace-relative path",
      errorGraphicsDataRequired: "Graphics Data folder is required",
      errorGraphicsDataNotInSrc:
        "Graphics Data folder must be inside the src/ directory",
      errorGraphicsDataAbsolutePath:
        "Graphics Data folder must be a workspace-relative path",
      errorTileCountInvalid: "Tile count must be a non-negative number",
      errorTileWidthInvalid: "Tile width must be greater than zero",
      errorTileHeightInvalid: "Tile height must be greater than zero",
      errorTileNamesMismatch: "Tile names count must match the tile count",
      errorTileNameEmpty: "All tile names must be non-empty strings",
      errorTileExtractionFailed: "Failed to extract tiles from the PNG file",
      errorNoSourceFile: "Please select a source image before creating a map",
      errorMapLoadFailed: "Failed to load .map file: invalid or corrupted data",
      statusMapDownloaded: "Map file downloaded successfully",
      mapSourceLabel: "Map file (optional)",
      mapSourceHint:
        "Load a previously saved .map file to restore tile configuration.",
      codeGenerationTypeLabel: "Code generation",
      codeGenerationTypeAsm: "Assembler (ASM)",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determined by the VS Code project type and cannot be changed here.",
      errorSpriteNameRequired: "Sprite name is required",
      errorSpriteWidthInvalid: "Sprite width must be greater than zero",
      errorSpriteHeightInvalid: "Sprite height must be greater than zero",
      errorSpriteFramesInvalid: "Sprite frames must be an array",
      errorFrameColumnInvalid: "Frame column must be a non-negative number",
      errorFrameRowInvalid: "Frame row must be a non-negative number",
    },
  },
  es: {
    "extract-graphics": {
      title: "Adjuntar graficos al proyecto",
      subtitle:
        "Genera codigo fuente con la definicion de tiles/sprites desde un archivo .png para usarlas en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Imagen fuente",
      sourceHint: "Selecciona el archivo PNG de origen desde tu workspace.",
      browseButton: "Examinar…",
      noFileSelected: "Ningún archivo seleccionado",
      graphicsLabel: "Salida de datos",
      graphicsHint: "Carpeta destino para los datos generados.",
      sectionTiles: "Tiles",
      tilesHint:
        "Configura el tamaño del tile y nombra cada tile extraído. (el orden será de izquierda a derecha, de arriba abajo)",
      tileWidthLabel: "Ancho tile (px)",
      tileHeightLabel: "Alto tile (px)",
      tilesCountLabel: "Tiles encontrados",
      tileNameLabel: "Tile {index}",
      sectionSprites: "Sprites",
      spritesHint:
        "Define sprites por nombre, frame y dimensiones. (todos los valores son en celdas de 8x8 a nivel de caracter)",
      spriteNameLabel: "Nombre",
      spriteWidthLabel: "Ancho",
      spriteHeightLabel: "Alto",
      frameLabel: "Frame",
      columnLabel: "Columna",
      rowLabel: "Fila",
      addFrame: "Agregar frame",
      addTile: "Agregar tile",
      addSprite: "Agregar sprite",
      remove: "Quitar",
      create: "Crear",
      statusSent: "Mensaje enviado en modo standalone.",
      errorSourceRequired: "El archivo de gráficos es requerido",
      errorSourceNotPng: "El archivo de gráficos debe ser una imagen .png",
      errorSourceAbsolutePath:
        "El archivo de gráficos debe ser una ruta relativa al workspace",
      errorGraphicsDataRequired: "La carpeta de datos gráficos es requerida",
      errorGraphicsDataNotInSrc:
        "La carpeta de datos gráficos debe estar dentro del directorio src/",
      errorGraphicsDataAbsolutePath:
        "La carpeta de datos gráficos debe ser una ruta relativa al workspace",
      errorTileCountInvalid:
        "El número de tiles debe ser un entero no negativo",
      errorTileWidthInvalid: "El ancho del tile debe ser mayor que cero",
      errorTileHeightInvalid: "El alto del tile debe ser mayor que cero",
      errorTileNamesMismatch:
        "El número de nombres de tiles debe coincidir con el conteo de tiles",
      errorTileNameEmpty:
        "Todos los nombres de tiles deben ser cadenas no vacías",
      errorTileExtractionFailed:
        "No se pudieron extraer los tiles del archivo PNG",
      errorNoSourceFile:
        "Selecciona una imagen de origen antes de crear el mapa",
      errorMapLoadFailed:
        "No se pudo cargar el archivo .map: datos inválidos o corruptos",
      statusMapDownloaded: "Archivo .map descargado correctamente",
      mapSourceLabel: "Archivo .map (opcional)",
      mapSourceHint:
        "Carga un archivo .map guardado previamente para restaurar la configuración de tiles.",
      codeGenerationTypeLabel: "Generación de código",
      codeGenerationTypeAsm: "Ensamblador (ASM)",
      codeGenerationTypeC: "C",
      codeGenerationTypeReadOnlyHint:
        "Determinado por el tipo de proyecto de VS Code y no se puede modificar aquí.",
      errorSpriteNameRequired: "El nombre del sprite es requerido",
      errorSpriteWidthInvalid: "El ancho del sprite debe ser mayor que cero",
      errorSpriteHeightInvalid: "La altura del sprite debe ser mayor que cero",
      errorSpriteFramesInvalid: "Los frames del sprite deben ser un array",
      errorFrameColumnInvalid:
        "La columna del frame debe ser un entero no negativo",
      errorFrameRowInvalid: "La fila del frame debe ser un entero no negativo",
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
