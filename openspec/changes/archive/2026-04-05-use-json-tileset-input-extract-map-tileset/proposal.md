## Why

The extract-map-tileset flow currently depends on loading a Tiled XML map file, which adds parsing complexity and creates a mismatch with the new export pipeline already producing JSON. Moving to JSON now reduces maintenance cost and aligns the editor workflow with the generated data format.

## What Changes

- Replace XML map file ingestion in extract-map-tileset with JSON map file ingestion.
- Update validation and parsing rules in the extract-map-tileset composable to consume the new JSON schema (`tileset` + `layers`).
- Remove XML-specific handling paths from the extract-map-tileset flow.
- Keep user-facing extraction behavior equivalent where possible (same map/layer interpretation and output expectations).
- Add or update tests for JSON loading success and invalid JSON/schema error handling.

## Capabilities

### New Capabilities

- `map-tileset-json-input`: Accept a Tiled-exported JSON file as the source format for extract-map-tileset processing.

### Modified Capabilities

- None.

## Non-goals

- Supporting both XML and JSON in parallel long-term.
- Adding new tile transformation features unrelated to source file format migration.
- Changing generated output formats beyond what is required by JSON input adoption.

## Impact

- Affected code in web-client extract-map-tileset composables and related models/helpers.
- Potential message contract updates only if the source payload shape sent through the bridge changes.
- No additional runtime dependencies are expected; existing TypeScript/JSON parsing utilities should be sufficient.
