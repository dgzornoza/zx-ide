# Change Log

All notable changes to the "zxide" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.4.0] - 2026-01-28

### Updated

- Updated makefiles for z88dk projects, now support .obj files for faster compilation.
- Simplified vscode task arguments.

## [1.3.0] - 2026-01-09

### Added

- Updated docker images to latest version.
- unified docker images for all emulators and toolchains.
- optimized docker images for reduce container size.
- Added c debugger support for z88dk projects using (sdcc/dezog).
- Corrected bugs.

## [1.2.0] - 2025-05-17

### Updated

- Updated docker images to latest version.
- Updated documentation.

## [1.1.0] - 2025-01-12

### Added

- Added Debug configuration for CSpect and ZesarUX emulators.

### Updated

- Updated docker images to latest version.
- Updated documentation.

## [1.0.2] - 2024-12-30

### Fixed

- fix devcontainers configuration

## [1.0.1] - 2024-12-23

### Added

- Added documentation

## [1.0.0] - 2024-12-01

Initial release of zx-ide

### Added

- Added Zx Spectrum sjasmplus and pasmo project.
- Added Zx Spectrum z88dk project with sdcc and zsdcc (classic/new lib).
- Added sjasmplus debugger by DeZog extension.
- Added z88dk debugger in asm (with comments and c code) by DeZog extension.
