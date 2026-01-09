# IA Agents Instructions for zx-ide Projects

## Overview

This document provides guidance for AI coding agents working with the zx-ide codebase, focusing on the CLI and VSCode extension components. Understanding the architecture, workflows, and conventions is crucial for effective contributions.

## Architecture

The zx-ide project consists of two main components:

1. **CLI**: A command-line interface for managing retro computer projects, primarily targeting ZX Spectrum and Z88DK.
2. **VSCode Extension**: Enhances the development experience for retro computer projects within Visual Studio Code.

### Key Components

- **CLI**:
  - **src/infrastructure.ts**: Defines project types and configurations, including `ProjectType` and `MachineType`.
  - **src/new-project/new-project-wizard.ts**: Implements the project creation wizard, guiding users through project setup.
  - **src/helpers/file.helpers.ts**: Contains utility functions for file path management.

- **VSCode Extension**:
  - **src/extension.ts**: Main entry point for the extension, registering commands and initializing services.
  - **@commands/**: Contains command implementations like `CreateProjectCmd` and `OpenHelpCmd`.
  - **@core/services/**: Services that encapsulate business logic and feature management.

## Developer Workflows

### Building the CLI

To build the CLI after modifications:

```bash
npm run build
```

### Testing

Ensure to run tests after making changes to verify functionality. Specific test commands can be found in the `package.json` files of both components.

### Debugging

Utilize VSCode's built-in debugging tools. Set breakpoints in the TypeScript files to inspect the execution flow.

## Project-Specific Conventions

- **File Structure**: Follow the established directory structure for organizing code. Use `src/` for source files and `tests/` for test files.
- **Naming Conventions**: Use camelCase for variables and functions, and PascalCase for classes and interfaces.
- **Lint Rules**: Conform to the CLI lint setup in [projects/cli/.eslintrc.json](projects/cli/.eslintrc.json) (Airbnb/TypeScript base; warnings for naming, semicolons handled by `@typescript-eslint/semi`, `curly`, `eqeqeq`; `semi` is disabled in base rules). Align new code with those expectations to avoid churn.

## Integration Points

- The CLI interacts with the VSCode extension through command registrations and shared services.
- External dependencies include `@inquirer/prompts` for user prompts and `node-stream-zip` for file handling.

## Conclusion

This document serves as a foundational guide for AI agents to navigate the zx-ide codebase effectively. For further details, refer to the specific files mentioned above and the README files in each component.
