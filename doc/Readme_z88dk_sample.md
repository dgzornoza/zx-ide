# z88dk-dev-environment README

z88dk Developer Container Environment for Visual Studio Code.
Author: David González Zornoza

## Features

Project to set up a development environment for zx spectrum with z88dk in a visual studio code dev-container.

Environment using DeZog for debugging ASM with C source code tags.

## Requirements

- installed visual studio code dev-container extension:
  [https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers](vscode-remote.remote-containers)

- Docker environment
  - Windows: [https://docs.docker.com/docker-for-windows/install/](https://docs.docker.com/docker-for-windows/install/)
  - Mac: [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/)
  - Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## How to use

- Press F1, then execute `Dev Containers: Reopen in container`
- Wait for install container and recomended extensions.
- Press (F5) to Start Debugging or (Ctrl + Shift + B) to execute build task.
- Set break point in c or asm source files, the extensions map breakpoints to c.lis file to debug
- All ready to develop your project

Refers to [Wiki](https://github.com/dgzornoza/zx-ide/wiki) for more information.


## Remarks

The first time it download docker hub image with the Z88DK sources from 2024-10-31.

Source sample is from: <https://www.z88dk.org/wiki/doku.php?id=temp:front#mixing_c_and_assembly_language>

## Links of interest

- z88dk: <https://z88dk.org/site/>
- zx spectrum starter guide: <https://github.com/z88dk/z88dk/blob/master/doc/ZXSpectrumZSDCCnewlib_01_GettingStarted.md>
- mixing C and ASM <https://www.z88dk.org/wiki/doku.php?id=temp:front#mixing_c_and_assembly_language>
- CRTs reference <https://github.com/z88dk/z88dk/blob/master/doc/ZXSpectrumZSDCCnewlib_02_HelloWorld.md>
- ASM tutorial <https://wiki.speccy.org/cursos/ensamblador/indice>
- ASM tutorials and sample coe <https://espamatica.com/>

**Enjoy!**
