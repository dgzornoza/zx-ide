/// <reference types="@mapeditor/tiled-api" />

/**
 * ZX-IDE EXPORTER & VALIDATOR
 * Versión corregida con manejo seguro de TextFile
 */

var ZxIdeUtils = {
  loadCfgForTileset: function (tileset) {
    let imagePath = tileset.image;
    if (!imagePath) return null;

    imagePath = imagePath.replace(/\\/g, "/");
    let cfgPath = imagePath.replace(/\.png$/i, ".cfg");

    // Resolver rutas relativas
    if (!/^[A-Za-z]:\//.test(cfgPath) && !cfgPath.startsWith("/")) {
      if (tiled.activeAsset && tiled.activeAsset.fileName) {
        let mapPath = tiled.activeAsset.fileName.replace(/\\/g, "/");
        let mapDir = mapPath.replace(/\/[^\/]+$/, "");
        cfgPath = mapDir + "/" + cfgPath;
      }
    }

    let file = null;

    try {
      file = new TextFile(cfgPath, TextFile.ReadOnly);
      let content = file.readAll(); // Si falla, Tiled puede cerrar el archivo internamente
      let json = JSON.parse(content);
      return json && Array.isArray(json.excluded) ? json.excluded : [];
    } catch (e) {
      return null;
    } finally {
      // Cerrar solo si sigue abierto
      if (file) {
        try {
          file.close();
        } catch (_) {}
      }
    }
  },

  remapId: function (id, excluded) {
    let count = 0;
    for (let i = 0; i < excluded.length; i++) {
      if (excluded[i] < id) count++;
    }
    return id - count;
  },

  generateJSON: function (map, tileset, excluded) {
    let json = {
      tileset: {
        image: tileset.image,
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
          if (!tile || excluded.indexOf(tile.id) !== -1) {
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

// --- FORMATO DE EXPORTACIÓN ---

tiled.registerMapFormat("zx-ide-map-tiled", {
  name: "zx-ide map tiled (*.json)",
  extension: "json",

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
      file.close();

      return undefined;
    } catch (err) {
      return "Error al exportar: " + err.toString();
    }
  },
});

// --- ACCIÓN DE VALIDACIÓN ---

tiled.registerAction("ZxIdeValidateAction", function () {
  let map = tiled.activeAsset;
  if (!map || !map.isTileMap) {
    tiled.alert("Abre un mapa primero.");
    return;
  }

  let tileset = map.tilesets[0];
  if (!tileset) return;

  let excluded = ZxIdeUtils.loadCfgForTileset(tileset);
  if (!excluded) {
    tiled.alert("No se encontró el archivo .cfg.");
    return;
  }

  let count = 0;

  for (let i = 0; i < map.layerCount; ++i) {
    let layer = map.layerAt(i);
    if (!layer.isTileLayer) continue;

    for (let y = 0; y < layer.height; ++y) {
      for (let x = 0; x < layer.width; ++x) {
        let tile = layer.tileAt(x, y);
        if (tile && excluded.indexOf(tile.id) !== -1) {
          tiled.warn(
            "[zx-ide] Tile prohibido en " +
              layer.name +
              " (" +
              x +
              "," +
              y +
              ")",
          );
          count++;
        }
      }
    }
  }

  if (count === 0) tiled.alert("¡Mapa válido!");
  else
    tiled.alert(
      "Se encontraron " + count + " tiles prohibidos. Revisa la consola.",
    );
}).text = "Validar Tiles Prohibidos (zx-ide)";

tiled.extendMenu("Map", [
  { separator: true },
  { action: "ZxIdeValidateAction" },
]);
