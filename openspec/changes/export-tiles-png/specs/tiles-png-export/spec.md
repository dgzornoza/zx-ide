## ADDED Requirements

### Requirement: System generates a tile sheet PNG on export

When performing a tile export, the system SHALL produce a PNG file (`<name>.png`) containing all tiles arranged in the same grid (columns × rows) as the source file. Each cell in the PNG SHALL be exactly `tileWidth × tileHeight` pixels.

#### Scenario: PNG source export includes PNG file in the ZIP

- **WHEN** the user loads a `.png` source file, configures the tile size, and clicks export in standalone mode
- **THEN** the downloaded ZIP MUST contain a `<name>.png` file with all tiles in a grid, with `columns = Math.floor(imageWidth / tileWidth)` columns

#### Scenario: ZXP source export includes PNG file in the ZIP

- **WHEN** the user loads a `.zxp` source file and clicks export in standalone mode
- **THEN** the downloaded ZIP MUST contain a `<name>.png` file with all tiles in a grid, with the same number of columns as the original ZXP file

#### Scenario: VS Code mode export includes PNG in the writeFiles message

- **WHEN** the user clicks export from within the VS Code extension
- **THEN** the `writeFiles` message sent to the extension MUST include a `FileEntry` with `fileType: "png"` and `fileName: "<name>.png"` whose `content` is the binary content (base64 or Blob) of the generated PNG

### Requirement: Excluded tiles are shown with a red cross in the exported PNG

The system SHALL overlay a diagonal red cross on each tile marked as excluded in the generated PNG. The cross SHALL be visible on top of the tile content.

#### Scenario: Excluded tile shows cross in the PNG

- **WHEN** the user has marked one or more tiles as excluded and triggers the export
- **THEN** each excluded tile in the resulting PNG MUST display two red diagonal lines crossing the cell from corner to corner

#### Scenario: Included tile shows no cross in the PNG

- **WHEN** a tile is not in the excluded list
- **THEN** the corresponding cell in the resulting PNG MUST NOT display any exclusion marker

### Requirement: Results section reflects excluded tiles

The results section SHALL display the count and memory usage of **included** tiles only (i.e. total tiles minus excluded tiles). Values SHALL update reactively whenever a tile is toggled.

#### Scenario: Results update when a tile is excluded

- **WHEN** the user marks one or more tiles as excluded
- **THEN** the displayed tile count SHALL decrease by the number of excluded tiles and the memory usage SHALL be recalculated accordingly

#### Scenario: Results update when an excluded tile is re-included

- **WHEN** the user un-marks a previously excluded tile
- **THEN** the displayed tile count SHALL increase by one and the memory usage SHALL be recalculated accordingly

### Requirement: Tiles model exposes the column count from the source

The system SHALL store in `TilesModel` the number of columns (`columns`) derived from the source file. This value SHALL be used to build the grid of the exported PNG.

#### Scenario: Columns correctly calculated for PNG source

- **WHEN** a PNG file of `W × H` pixels is loaded with `tileWidth = tw`
- **THEN** `TilesModel.columns` SHALL be `Math.floor(W / tw)`

#### Scenario: Columns correctly calculated for ZXP source

- **WHEN** a ZXP file is loaded
- **THEN** `TilesModel.columns` SHALL match the `tilesPerRow` field returned by `extractTilesFromZxpFile`
