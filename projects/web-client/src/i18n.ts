import { createI18n } from "vue-i18n";

const messages = {
  en: {
    "attach-project-graphics": {
      title: "Attach project graphics",
      subtitle:
        "Generate tile and sprite definitions from a spritesheet and save them into your project.",
      sectionSource: "Source data",
      sourceLabel: "Source image",
      sourceHint: "Workspace relative path to the PNG source file.",
      graphicsLabel: "Output data",
      graphicsHint: "Target folder for the generated graphics data.",
      sectionTiles: "Tiles 8x8",
      tilesHint:
        "Define tiles by name and coordinates. (tiles will be ordered left to right by tile rows)",
      tilesCountLabel: "Tiles Number",
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
      statusInvalid: "VS Code webview messaging is not available.",
    },
  },
  es: {
    "attach-project-graphics": {
      title: "Adjuntar graficos al proyecto",
      subtitle:
        "Genera definiciones de tiles y sprites desde una spritesheet y guardalas en tu proyecto.",
      sectionSource: "Datos de origen",
      sourceLabel: "Imagen fuente",
      sourceHint: "Ruta relativa al workspace del PNG de origen.",
      graphicsLabel: "Salida de datos",
      graphicsHint: "Carpeta destino para los datos generados.",
      sectionTiles: "Tiles 8x8",
      tilesHint:
        "Define tiles por nombre y coordenadas. (el orden será de izquierda a derecha por líneas de tiles)",
      tilesCountLabel: "Numero Tiles",
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
      statusInvalid: "No hay API de VS Code disponible.",
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
