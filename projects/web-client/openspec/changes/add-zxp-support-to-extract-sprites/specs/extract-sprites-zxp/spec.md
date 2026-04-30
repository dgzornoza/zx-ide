## ADDED Requirements

### Requirement: Extract sprites from .zxp files

The system SHALL allow users to upload and process `.zxp` files in the `extract-sprites` component, extracting sprite data in the same manner as `.png` files.

#### Scenario: Successful extraction from .zxp

- **WHEN** a user uploads a valid `.zxp` file to the `extract-sprites` component
- **THEN** the system SHALL parse the `.zxp` file and display the extracted sprites correctly.

#### Scenario: Failed extraction from invalid .zxp

- **WHEN** a user uploads a corrupted or invalid `.zxp` file
- **THEN** the system SHALL display an error message indicating the failure.
