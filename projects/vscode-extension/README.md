# Zx-Ide

```
███████╗██╗  ██╗     ██╗██████╗ ███████╗
╚══███╔╝╚██╗██╔╝     ██║██╔══██╗██╔════╝
  ███╔╝  ╚███╔╝█████╗██║██║  ██║█████╗  
 ███╔╝   ██╔██╗╚════╝██║██║  ██║██╔══╝  
███████╗██╔╝ ██╗     ██║██████╔╝███████╗
╚══════╝╚═╝  ╚═╝     ╚═╝╚═════╝ ╚══════╝
```

Extension for developing on retro computers with vscode.

## Features

Currently the following types of projects are allowed:

- Zx Spectrum
  - sjasmplus, pasmo (asm)
  - z88dk (c/asm)

## Requirements

- Installed visual studio code dev-container extension:
  [https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers](vscode-remote.remote-containers)

- Docker environment
  - Windows: [https://docs.docker.com/docker-for-windows/install/](https://docs.docker.com/docker-for-windows/install/)
  - Mac: [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/)
  - Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## Usage

- Press F1, then execute `ZxIde: Create new project`
- Follow the steps of the Assistant in the terminal
- Wait for open new project.
- Press F1, then execute `Dev Containers: Reopen in container`
- Wait for install container and recomended extensions (First time it may take a few minutes)
- Press (F5) to Start Debugging or (Ctrl + Shift + B) to execute build task.
- All ready to develop your project
  
![create_project](https://github.com/user-attachments/assets/bdb55874-e5a3-4355-b035-bbf6336e807a)

> **Remarks:** *If the path project folder is changed after the container is created, the container must be deleted so that it can be recreated with the new path, otherwise it will give an error indicating that the container already exists.*

## Clean containers

To remove containers that have not been used in a while and free up memory, you can run the following command:

```bash
# (168h = 7 days)
docker container prune --filter "until=168h"
```

## Documentation

For more information, visit the [Wiki](https://github.com/dgzornoza/zx-ide/wiki)

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**. This means you can use, copy, modify, and distribute this code under the terms of the AGPL-3.0. For more details, see the [LICENSE](./LICENSE) file or visit the [GNU AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) page.

For information about third-party toolchains included in the development container, see the [NOTICE.md](./NOTICE.md) file.

## Contact

Any questions or suggestions, please contact me.
