# Zx-Ide

```txt
███████╗██╗  ██╗     ██╗██████╗ ███████╗
╚══███╔╝╚██╗██╔╝     ██║██╔══██╗██╔════╝
  ███╔╝  ╚███╔╝█████╗██║██║  ██║█████╗  
 ███╔╝   ██╔██╗╚════╝██║██║  ██║██╔══╝  
███████╗██╔╝ ██╗     ██║██████╔╝███████╗
╚══════╝╚═╝  ╚═╝     ╚═╝╚═════╝ ╚══════╝
```

Extension for development on retro computers with vscode.

## Features

Currently the following types of projects are allowed:

### Zx Spectrum

- sjasmplus, pasmo (asm)
- z88dk (c/asm)

## Requirements

- VsCode [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Installed visual studio code dev-container extension:
  [https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers](vscode-remote.remote-containers)

- Docker environment
  - Windows: [https://docs.docker.com/docker-for-windows/install/](https://docs.docker.com/docker-for-windows/install/)
  - Mac: [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/)
  - Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## Install

You can install in one of these ways:

- **vscode**: Go to the vscode extensions and search for `zx-ide`.
- **marketplace**: Download it from the [marketplace](https://marketplace.visualstudio.com/items?itemName=dgzornoza.zxide).
- **github**: download latest .vsix from [GitHub Releases](https://github.com/dgzornoza/zx-ide/releases) file and install it.

## Usage

Refers to [Wiki](https://github.com/dgzornoza/zx-ide/wiki) for more information.

## Workspace (CLI + Extension)

This repository contains two projects: a CLI (`cli`) and a VS Code extension (`vscode-extension`). A multi-root workspace file is included to work with both in a single VS Code window.

- Open the workspace: [zx-ide.code-workspace](zx-ide.code-workspace)
- Folders included: `cli` and `vscode-extension`

### Tasks

- CLI
  - Install: run task "cli: install" or `npm install --prefix ./cli`
  - Build: run task "cli: build" or `npm run build --prefix ./cli`
  - Start: run task "cli: start" or `npm run start --prefix ./cli`
- Extension
  - Install: run task "extension: install" or `npm install --prefix ./vscode-extension`
  - Compile: run task "extension: compile" or `npm run compile --prefix ./vscode-extension`
  - Watch: run task "extension: watch"
  - Test: run task "extension: test" or `npm test --prefix ./vscode-extension`

### Debug

- Run Extension: use the "Run Extension" launch configuration; it starts an Extension Host using the built `vscode-extension` output.
- Debug CLI: use the "Debug CLI" launch configuration; it builds `cli` and runs `dist/zx-ide-cli.js` with source maps.

Note: if you want to debug the extension code with a app code, you need open this project in devcontainer, and set `devcontainer.json` mounts property to a directory with your app code. Where you can open the app code folder in the extension host window.

## License

This project is licensed under the **MIT license**. This means you can use, copy, modify, and distribute this code, always including the copyright notice and the permission notice. For more details, see the [LICENSE](./LICENSE) file or visit the [MIT License](https://opensource.org/licenses/MIT) page.

## Contact

Any questions or suggestions, please contact me at [dgzornoza@dgzornoza.com](mailto:dgzornoza@dgzornoza.com).
