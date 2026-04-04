const fs = require("fs");

function loadCfgForTileset(tileset) {
    let tsxPath = tileset.fileName;
    if (!tsxPath) return null;

    let cfgPath = tsxPath.replace(".tsx", ".cfg");

    if (!fs.exists(cfgPath)) return null;

    let json = JSON.parse(fs.readFile(cfgPath));
    return json.excluded || [];
}

function remapId(id, excluded) {
    let count = excluded.filter(e => e < id).length;
    return id - count;
}

tiled.registerMapFormat("remap-export", {
    name: "Remap Export (with excluded tiles)",
    extension: "json",

    write: function(map, fileName) {
        let tileset = map.tilesets[0];
        let excluded = loadCfgForTileset(tileset);

        if (!excluded) {
            console.log("No .cfg found, exporting normally");
            return tiled.writeFile(map, fileName);
        }

        console.log("Excluded tiles:", excluded);

        // Clonar el mapa para no modificar el original
        let clone = JSON.parse(JSON.stringify(map));

        clone.layers.forEach(layer => {
            if (!layer.data) return;

            layer.data = layer.data.map(id => {
                if (id === 0) return 0;
                return remapId(id - 1, excluded) + 1;
            });
        });

        fs.writeFile(fileName, JSON.stringify(clone, null, 2));
        return true;
    }
});
