## Why

Currently, the `BinaryInputPanel` component is limited to extracting data from binary strings and providing an add action. Users need to perform arbitrary 3D rotation operations (X, Y, Z axes, specified in degrees) on these binary grids to transform the sprites or tiles visually. Implementing programmatic matrix rotations directly in the panel empowers the user to transform binary arts before saving, using nearest-neighbor approximation to maintain the monochrome nature of the pixels.

## What Changes

- Introduce three numeric input fields (X, Y, Z degrees) into the `BinaryInputPanel.vue` UI, typically in a dedicated rotation controls section.
- Add a "Rotate" or "Apply Rotation" button.
- Implement the 3D rotation matrix calculation (Euler angles) using standard `Math` trigonometry functions.
- Apply this rotation transformation to the binary array representation of the parsed input string using nearest-neighbor interpolation to determine pixel coverage.
- The UI will immediately reflect the applied rotation transformation.

## Capabilities

### New Capabilities

- `binary-matrix-rotation`: Provides 3D matrix math transformations (Euler rotations around X, Y, Z axes) applied to 1-bit boolean 2D arrays, using nearest-neighbor scaling/rotating to match the source grid to the destination layout.

### Modified Capabilities

## Impact

- Modifies `src/shared/components/BinaryInputPanel.vue`.
- Does not affect saved data structures, it's a pre-processing UI tool before emitting the `add` event.
- No new external dependencies required.
