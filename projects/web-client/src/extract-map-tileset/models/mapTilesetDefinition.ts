import type { CodeGenerationType } from "../../../../shared/extract-graphics/extract-graphics-dtos";

/** Datos extraídos del documento XML Tiled (.tmx). */
export interface TmxMapMetadata {
  /** Ancho del mapa en tiles. */
  mapWidth: number;
  /** Alto del mapa en tiles. */
  mapHeight: number;
  /** Ancho de cada tile en píxeles. */
  tileWidth: number;
  /** Alto de cada tile en píxeles. */
  tileHeight: number;
  /** Nombre del tileset (atributo `name` del nodo `<tileset>`). */
  tilesetName: string;
  /** GID del primer tile del tileset (normalmente 1). */
  firstGid: number;
  /** Número total de tiles en el tileset. Máximo 255; si > 255 → error. */
  tileCount: number;
  /** Número de columnas del tileset (para calcular posición en el PNG). */
  columns: number;
  /** Path relativo a la imagen fuente del tileset (atributo `source` de `<image>`). */
  sourceImage: string;
}

/** Estado reactivo completo del composable useExtractMapTileset. */
export interface MapTilesetState {
  /** Nombre del fichero TMX cargado. */
  xmlSource: string;
  /** Nombre del fichero PNG del tileset. */
  imageSource: string;
  /** Metadatos parseados del XML. undefined si no hay TMX válido. */
  metadata?: TmxMapMetadata;
  /**
   * Índices normalizados por celda (row-major).
   * localIndex = gid === 0 ? 0 : gid - firstGid + 1
   * Longitud: mapWidth * mapHeight.
   */
  tileIndices: number[];
  /** Errores de validación o parseo activos (bloquean la extracción). */
  errors: string[];
  /** Avisos no bloqueantes (e.g. dimensiones PNG inconsistentes). */
  warnings: string[];
  /** Modo de generación de código seleccionado. */
  codeGenerationType: CodeGenerationType;
  /** true cuando hay metadata válida, tileCount ≤ 255 y tileIndices no vacío. */
  isReady: boolean;
}
