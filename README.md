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

- vscode [https://code.visualstudio.com/](https://code.visualstudio.com/)
- installed visual studio code dev-container extension:
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

- Press F1, then execute `ZxIde: Create new project`
- Follow the steps of the Assistant in the terminal
- Wait for open new project.
- Press F1, then execute `Dev Containers: Reopen in container`
- Wait for install container and recomended extensions (First time it may take a few minutes)
- Press (F5) to Start Debugging or (Ctrl + Shift + B) to execute build task.
- All ready to develop your project

Refers to [Wiki](https://github.com/dgzornoza/zx-ide/wiki) for more information.

## License

This project is licensed under the **MIT license**. This means you can use, copy, modify, and distribute this code, always including the copyright notice and the permission notice. For more details, see the [LICENSE](./LICENSE) file or visit the [MIT License](https://opensource.org/licenses/MIT) page.

## Contact

Any questions or suggestions, please contact me at [dgzornoza@dgzornoza.com](mailto:dgzornoza@dgzornoza.com).
