/// <reference types="@mapeditor/tiled-api" />

/**
 * ZX-IDE EXPORTER & VALIDATOR
 * Script para tiled. Permite exportar mapas a un formato JSON específico para ZX-IDE,
 * con soporte para tiles prohibidos definidos en un archivo .cfg asociado al tileset.
 * También incluye una acción de validación para detectar tiles prohibidos en el mapa.
 */

let ZxIdeUtils = {
  /**
   * Carga el archivo .cfg asociado a un tileset y devuelve el array de tiles prohibidos.
   * @param {Tileset} tileset - Tileset activo en el mapa.
   * @returns {number[]|null} Array de IDs de tiles prohibidos, o null si no se encuentra o hay error.
   */
  loadCfgForTileset: function (tileset) {
    let imagePath = tileset.image;
    if (!imagePath) return null;

    imagePath = imagePath.replace("\\", "/");
    let cfgPath = imagePath.replace(/\.png$/i, ".cfg");

    // Resolver rutas relativas
    if (!/^[A-Za-z]:\//.test(cfgPath) && !cfgPath.startsWith("/")) {
      if (tiled.activeAsset?.fileName) {
        let mapPath = tiled.activeAsset.fileName.replace("\\", "/");
        let mapDir = mapPath.replace(/\/[^/]+$/, "");
        cfgPath = mapDir + "/" + cfgPath;
      }
    }

    let file = null;

    try {
      file = new TextFile(cfgPath, TextFile.ReadOnly);
      let content = file.readAll();
      let json = JSON.parse(content);
      return json && Array.isArray(json.excluded) ? json.excluded : [];
    } catch (error) {
      tiled.alert("loadCfgForTileset: error" + error.toString());
    } finally {
      // Cerrar solo si sigue abierto
      if (file) {
        try {
          file.close();
        } catch (error) {
          tiled.alert("loadCfgForTileset finally: error" + error.toString());
        }
      }
    }
  },

  /**
   * Remapea el ID de un tile considerando los excluidos (prohibidos).
   * @param {number} id - ID original del tile.
   * @param {number[]} excluded - Array de IDs de tiles prohibidos.
   * @returns {number} Nuevo ID remapeado.
   */
  remapId: function (id, excluded) {
    let count = 0;
    for (const element of excluded) {
      if (element < id) count++;
    }
    return id - count;
  },

  /**
   * Genera el JSON de exportación del mapa, omitiendo o remapeando tiles prohibidos.
   * @param {TileMap} map - Mapa activo de Tiled.
   * @param {Tileset} tileset - Tileset asociado al mapa.
   * @param {number[]} excluded - Array de IDs de tiles prohibidos.
   * @returns {string} JSON serializado listo para exportar.
   */
  generateJSON: function (map, tileset, excluded) {
    const EXPORTER_VERSION = "1.0.0";
    let json = {
      exporterVersion: EXPORTER_VERSION,
      tileset: {
        // guardar solo el nombre (tiene que estar en la misma carpeta que el JSON exportado)
        image: tileset.image.replace(/^.*[\\/]/, ""),
        tileWidth: tileset.tileWidth,
        tileHeight: tileset.tileHeight,
        tileCount: tileset.tileCount,
        columns: tileset.columnCount,
      },
      layers: [],
    };

    for (let i = 0; i < map.layerCount; ++i) {
      let layer = map.layerAt(i);
      if (!layer.isTileLayer) continue;

      let processedData = [];
      for (let y = 0; y < layer.height; ++y) {
        for (let x = 0; x < layer.width; ++x) {
          let tile = layer.tileAt(x, y);
          if (!tile || excluded.includes(tile.id)) {
            processedData.push(0);
          } else {
            processedData.push(this.remapId(tile.id, excluded) + 1);
          }
        }
      }

      json.layers.push({
        name: layer.name,
        width: layer.width,
        height: layer.height,
        data: processedData,
      });
    }

    return JSON.stringify(json, null, 2);
  },
};

let Validators = {
  /**
   * Valida todos los tiles prohibidos en el mapa y muestra advertencias por consola.
   * @param {TileMap} map - Mapa activo de Tiled.
   * @param {number[]} excluded - Array de IDs de tiles prohibidos.
   * @returns {number} Cantidad total de tiles prohibidos encontrados.
   */
  validateProhibitedTiles: function (map, excluded) {
    let count = 0;
    for (let i = 0; i < map.layerCount; ++i) {
      let layer = map.layerAt(i);
      if (!layer.isTileLayer) continue;
      count += this.validateLayerTiles(layer, excluded);
    }
    return count;
  },

  /**
   * Valida los tiles prohibidos en una capa específica y muestra advertencias por consola.
   * @param {TileLayer} layer - Capa de tiles a validar.
   * @param {number[]} excluded - Array de IDs de tiles prohibidos.
   * @returns {number} Cantidad de tiles prohibidos encontrados en la capa.
   */
  validateLayerTiles: function (layer, excluded) {
    let count = 0;
    for (let y = 0; y < layer.height; ++y) {
      for (let x = 0; x < layer.width; ++x) {
        let tile = layer.tileAt(x, y);
        if (tile && excluded.includes(tile.id)) {
          tiled.warn(`[zx-ide] Tile prohibido en ${layer.name} (${x},${y})`);
          count++;
        }
      }
    }
    return count;
  },
};

// --- FORMATO DE EXPORTACIÓN ---

tiled.registerMapFormat("zx-ide-map-tiled", {
  name: "zx-ide map tiled (*.json)",
  extension: "json",

  /**
   * Función de exportación: escribe el mapa en formato JSON usando la lógica ZX-IDE.
   * @param {TileMap} map - Mapa activo de Tiled.
   * @param {string} fileName - Ruta destino del archivo JSON.
   * @returns {string|undefined} Mensaje de error o undefined si fue exitoso.
   */
  write: function (map, fileName) {
    let tileset = map.tilesets[0];
    if (!tileset) return "El mapa no tiene tilesets.";

    let excluded = ZxIdeUtils.loadCfgForTileset(tileset) || [];

    try {
      let jsonString = ZxIdeUtils.generateJSON(map, tileset, excluded);
      let file = new TextFile(fileName, TextFile.WriteOnly);

      if (!file) return "No se pudo abrir el archivo para escribir.";

      file.write(jsonString);
      file.commit();

      tiled.alert("Mapa exportado correctamente");
      return undefined;
    } catch (err) {
      return "Error al exportar: " + err.toString();
    }
  },
});

// --- ACCIÓN DE VALIDACIÓN ---

/**
 * Acción de validación: busca tiles prohibidos en el mapa activo y muestra advertencias.
 */
tiled.registerAction("ZxIdeValidateAction", function () {
  let map = tiled.activeAsset;
  if (!map?.isTileMap) {
    tiled.alert("Abre un mapa primero.");
    return;
  }

  let tileset = map.tilesets[0];
  if (!tileset) {
    tiled.alert("No se encontró ningún tileset.");
    return;
  }

  let excluded = ZxIdeUtils.loadCfgForTileset(tileset);
  if (!excluded) {
    tiled.alert("No se encontró el archivo .cfg.");
    return;
  }

  let count = Validators.validateProhibitedTiles(map, excluded);

  if (count === 0) {
    tiled.alert("¡Mapa válido!");
  } else {
    tiled.alert(`Se encontraron ${count} tiles prohibidos. Revisa la consola.`);
  }
}).text = "Validar Tiles Prohibidos (zx-ide)";

tiled.extendMenu("Map", [
  { separator: true },
  { action: "ZxIdeValidateAction" },
]);
