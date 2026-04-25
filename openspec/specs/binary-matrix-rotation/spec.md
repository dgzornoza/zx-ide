## ADDED Requirements

### Requirement: 3D Rotation Inputs

The interface SHALL provide numeric inputs for X, Y, and Z rotation degrees.

#### Scenario: User adjusts rotation angles

- **WHEN** the user views the BinaryInputPanel
- **THEN** they see three input fields (labelled X, Y, and Z) initialized to 0.

### Requirement: Apply Rotation Transformation

The system SHALL calculate and apply a 3D rotation based on the specified degrees to the binary text content when triggered.

#### Scenario: Rotating a binary grid

- **WHEN** the user provides a valid 2D binary string in the text field, sets X, Y, and Z values, and clicks "Apply Rotation" (or similar trigger)
- **THEN** the system parses the 0s and 1s, computes the 3D rotation backward mapping (inverse Euler rotation matrix) onto the grid using nearest-neighbor interpolation, and overwrites the text field with the new rotated binary string representation.

#### Scenario: Dropping out-of-bounds pixels

- **WHEN** a pixel is mathematically rotated outside the boundaries of the original NxM grid
- **THEN** the system crops the pixel (the missing bounds are simply rendered as 0).

#### Scenario: Handling blank source regions

- **WHEN** the backward mapping logic points to a source coordinate that is outside the original grid dimensions
- **THEN** the output destination pixel is assigned a 0 (blank).
