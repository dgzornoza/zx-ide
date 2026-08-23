## Context

The `extract-sprites` component in the web client is currently limited to `.png` files. The `extract-tiles` component already has the capability to handle `.zxp` files (a format used by Paint Brush). To provide a consistent experience and leverage existing functionality, we want to extend `extract-sprites` to support `.zxp` as well.

## Goals / Non-Goals

**Goals:**

- Enable `.zxp` file upload in the `extract-sprites` component.
- Implement/reuse logic to extract sprite data from `.png` and `.zxp` files.
- Maintain a consistent UI/UX with the existing `.png` workflow.

**Non-Goals:**

- Supporting other image formats beyond `.png` and `.zxp` in this specific change.
- Refactoring the entire extraction architecture (this is a targeted addition).

## Decisions

- **Reuse existing extraction logic**: Instead of writing new parsing logic, we will investigate the implementation in `extract-tiles` and reuse the parts that handle `.zxp` parsing.
- **Update File Input**: Modify the file input component in `extract-sprites` to include `.zxp` in the `accept` attribute.
- **Unified Processing Flow**: The processing logic will be updated to branch based on the file extension, calling the appropriate parser.

## Risks / Trade-offs

- [Complexity] → Increased complexity in the `extract-sprites` component due to handling multiple file types. Mitigation: Keep the logic modular and reuse existing utilities.
- [Regression] → Changes to the file upload logic might break existing `.png` functionality. Mitigation: Thorough testing with both `.png` and `.zxp` files.
