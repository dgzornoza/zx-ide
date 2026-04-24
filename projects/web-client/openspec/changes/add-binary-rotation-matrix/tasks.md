## 1. UI Components Updates

- [x] 1.1 Add reactive state properties `degX`, `degY`, and `degZ` (default 0) in `BinaryInputPanel.vue`.
- [x] 1.2 Update the `BinaryInputPanel.vue` template to display numeric input controls for X, Y, Z with localized labels in the `actions` or controls area.
- [x] 1.3 Add an "Apply Rotation" action button bound to a new rotation function in `BinaryInputPanel.vue`.

## 2. Rotation Engine Math

- [x] 2.1 Implement `applyRotation` function inside `BinaryInputPanel.vue` that parses the current `binaryText` into a 2D boolean array.
- [x] 2.2 Implement the 3D to 2D inverse projection math algorithm (Euler inverse matrix) within `applyRotation` mapping each destination pixel back to source coordinates using nearest-neighbor rounding.
- [x] 2.3 Handle bounds checking in the mapping (set to `0` if outside source grid).
- [x] 2.4 Convert the mapped 2D boolean array back to a formatted multi-line string and assign it to `binaryText.value`.
