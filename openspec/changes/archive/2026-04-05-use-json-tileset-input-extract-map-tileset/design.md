## Context

The extract-map-tileset flow in the web client currently reads Tiled XML to obtain tileset metadata and map layers. A new export script now generates an equivalent JSON payload with `tileset` and `layers`, making XML parsing unnecessary for this workflow. The change must preserve current extraction outcomes while reducing format-specific parsing complexity.

## Goals / Non-Goals

**Goals:**

- Replace XML ingestion with JSON ingestion for extract-map-tileset input.
- Validate required JSON structure before processing (`tileset`, `layers`, and required nested properties).
- Keep downstream extraction behavior consistent for valid input.
- Provide clear validation errors for malformed JSON or missing required properties.

**Non-Goals:**

- Supporting XML and JSON simultaneously as first-class long-term inputs.
- Redesigning extraction algorithms or output file formats.
- Introducing new bridge message types unless existing payloads become insufficient.

## Decisions

1. Input contract will be strict JSON schema validation at load time.

- Rationale: Early validation prevents partial state updates and hard-to-debug downstream failures.
- Alternative considered: Best-effort parsing with defaults. Rejected because it can hide source data issues and produce incorrect tile maps.

1. The composable remains the orchestration point for parsing, validation, and state assignment.

- Rationale: Existing flow already centralizes source loading in composables, minimizing cross-module refactors.
- Alternative considered: Move parsing to a separate service layer. Rejected for now to keep migration scope focused and low-risk.

1. XML-specific parsing paths will be removed instead of feature-flagged.

- Rationale: The proposal explicitly migrates to JSON-only input, and keeping both paths increases maintenance burden.
- Alternative considered: Keep XML fallback. Rejected because it conflicts with the simplification goal and future script-driven pipeline.

1. TypeScript models will define the JSON source shape explicitly.

- Rationale: Strong typing improves maintainability and makes validation and tests clearer.
- Alternative considered: Dynamic object access without typed models. Rejected due to weaker safety and readability.

## Risks / Trade-offs

- [Risk] Existing users may still provide XML files initially -> Mitigation: Show explicit unsupported-format guidance in validation error messaging.
- [Risk] JSON files may omit fields currently inferred by XML parser behavior -> Mitigation: Require mandatory fields and fail fast with actionable error details.
- [Trade-off] Stricter validation may reject loosely formatted legacy data -> Mitigation: Document required JSON structure and provide a migration note in release communication.

## Migration Plan

1. Introduce JSON input model and validation logic in extract-map-tileset composable/helpers.
2. Replace XML parsing calls with JSON parse + validate + normalize.
3. Remove XML-only utilities no longer used by extract-map-tileset.
4. Update unit tests to cover valid JSON, malformed JSON, and missing fields.
5. Verify extraction outputs remain stable for representative maps.
6. Rollback strategy: revert the change commit to restore XML path if critical regressions appear.

## Open Questions

- Should the UI label explicitly mention "Tiled JSON" to reduce ambiguity when selecting source files?
- Do we need a temporary compatibility warning message for users who still attempt XML inputs?
