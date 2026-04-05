## ADDED Requirements

### Requirement: System accepts Tiled JSON as extract-map-tileset source
The system SHALL accept a JSON file containing `tileset` and `layers` as the source input for extract-map-tileset processing.

#### Scenario: Valid JSON file is loaded
- **GIVEN** the user selects a JSON file with a valid `tileset` object and at least one valid layer in `layers`
- **WHEN** the file is loaded in extract-map-tileset
- **THEN** the system MUST parse the JSON and populate the internal map/tileset state for extraction

### Requirement: System validates required JSON structure before extraction
The system SHALL validate required source properties before allowing extraction. Required properties MUST include: `tileset.image`, `tileset.tileWidth`, `tileset.tileHeight`, `tileset.tileCount`, `tileset.columns`, and for each layer `name`, `width`, `height`, `data`.

#### Scenario: Missing required property blocks processing
- **GIVEN** the selected JSON file is missing one or more required properties
- **WHEN** the file is validated
- **THEN** the system MUST reject the file and MUST NOT proceed to extraction

#### Scenario: Invalid layer data type blocks processing
- **GIVEN** the selected JSON file contains a layer where `data` is not an array of numeric tile identifiers
- **WHEN** the file is validated
- **THEN** the system MUST reject the file and display a validation error

### Requirement: System rejects malformed or unsupported source format
The system SHALL fail fast when the source file is not valid JSON or is an unsupported format for extract-map-tileset.

#### Scenario: Malformed JSON is rejected
- **GIVEN** the user selects a file with invalid JSON syntax
- **WHEN** the system attempts to parse the file
- **THEN** the system MUST display a parse error and MUST NOT modify the previous valid extraction state

#### Scenario: XML file input is rejected
- **GIVEN** the user selects a Tiled XML file
- **WHEN** the system validates the source format
- **THEN** the system MUST reject the input and show that JSON is required
