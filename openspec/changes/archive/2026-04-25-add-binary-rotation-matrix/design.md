## Context

The user currently inputs graphical binary sprites via a multiline text field in `BinaryInputPanel.vue`. The text field is parsed to generate an array of boolean values (the sprite grid).
We are adding functionality to perform 3D rotations on this binary grid and apply the result back into the text representation. This is primarily useful for creating isometric tiles or rotated sprites directly from a base flat 2D projection, without leaving the tool.

## Goals / Non-Goals

**Goals:**

- Provide UI inputs for X, Y, and Z rotation in degrees.
- Implement an algorithm to rotate a 2D binary grid in 3D space (using orthographic projection back to 2D) using nearest-neighbor interpolation.
- Apply the rotation to the `binaryText` in-place, rewriting the 0s and 1s.

**Non-Goals:**

- Anti-aliasing, shading, or depth calculations. The target format is strictly 1-bit monochrome data without varying opacity.
- Adding a complex 3D engine like WebGL. All transformations will be calculated via CPU using standard `Math` trigonometry.
- Expanding the bounding box. The rotated output will have the same dimensions (Width x Height) as the current grid; anything outside the bounding box will be clipped.

## Decisions

- **Inverse Matrix Mapping (Backward Mapping)**:
  Instead of projecting forward (which can leave holes in the destination grid), we will iterate over each pixel in the **destination** grid, compute its 3D coordinates relative to the center, and apply the inverse of the 3D rotation matrix to find the source pixel location. Since we project onto a 2D plane at $Z=0$, destination $z_d$ is evaluated as 0. We then round the resulting source $X_s, Y_s$ values to integers to pick the nearest neighbor.
- **Rotation Math Order**:
  We will construct the rotation matrix using standard Euler angles. Order will be $R_z \times R_y \times R_x$ or similar consistent axes standard.
- **In-place string mutation**:
  The user enters text, parses it, applies rotation, and the component writes the new binary string back to `binaryText.value`. This keeps the UI flow simple and uses Vue's reactivity to immediately show the generated preview.

## Risks / Trade-offs

- **Risk: Aliasing and "ugliness" in rotations**: Rotations on small pixel art (like 8x8 or 16x16) usually look terrible using pure mathematical rotation due to extreme aliasing.
  **Trade-off/Mitigation**: The user was consulted and understands this mathematical limitation, explicitly accepting nearest-neighbor aliasing. We provide exactly what was requested.
- **Risk: Out-of-bounds array access**:
  **Mitigation**: The inverse mapping explicitly checks if the evaluated $X_s, Y_s$ source coordinates fall within the `[0, width)` and `[0, height)` range. Anything outside results in a `0` (blank).
