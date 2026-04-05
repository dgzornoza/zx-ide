## 1. Input Contract and Models

- [x] 1.1 Define TypeScript interfaces for the Tiled JSON source (`tileset`, `layers`, and layer `data` entries)
- [x] 1.2 Add JSON schema validation helpers for required properties and invalid value types
- [x] 1.3 Add user-facing validation error mapping for malformed JSON and unsupported format

## 2. Extract Map Tileset Migration

- [x] 2.1 Replace XML parsing/loading path in extract-map-tileset composable with JSON parse + validate flow
- [x] 2.2 Remove or isolate XML-specific code paths no longer needed by extract-map-tileset
- [x] 2.3 Normalize validated JSON data into the existing extraction state model without changing expected extraction output

## 3. UI and Messaging Adjustments

- [x] 3.1 Update source input labeling/help text to indicate Tiled JSON requirement
- [x] 3.2 Ensure rejected XML input returns a clear "JSON required" error in the UI flow
- [x] 3.3 Verify bridge/event payloads remain compatible after source format migration

## 4. Test Coverage and Verification

- [x] 4.1 Add or update unit tests for valid JSON loading and state population
- [x] 4.2 Add or update unit tests for malformed JSON, missing required fields, and invalid layer data
- [x] 4.3 Run project type-check/tests and validate extraction parity with representative map samples
