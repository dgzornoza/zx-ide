## Why

The `extract-sprites` component currently only supports importing `.png` files. This limits users who work with `.zxp` files (Paint Brush format), which are already supported in the `extract-tiles` component. Adding this support provides consistency across the tool and improves usability for users with existing `.zxp` assets.

## What Changes

- Update `extract-sprites` component to allow file uploads of `.zxp` files.
- Implement logic to parse and extract sprite data from `.zxp` files, similar to the implementation in `extract-tiles`.
- Ensure the UI/UX for file selection and processing is consistent with the existing `.png` workflow.

## Capabilities

### New Capabilities

- `extract-sprites-zxp`: Support for extracting sprites from `.zxp` files.

### Modified Capabilities

- `extract-sprites`: Modified to support `.zxp` input format.

## Impact

- `projects/web-client/src/extract-sprites/` (component logic and UI)
- `projects/web-client/src/extract-tiles/` (as a reference for implementation)
- Potential shared logic if extraction utilities can be reused.
