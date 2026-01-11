# z80asm-dev-environment README

z80asm Developer Container Environment for Visual Studio Code.

Author: David González Zornoza

## Features

Project to set up a development environment for zx spectrum with sjasmplus/pasmo, in a visual studio code dev-container.

Environment using DeZog for debugging ASM/sjasmplus with source code tags.
Pasmo can not debug with DeZog, but you can use for build, on this sample is using PASMO for build end tap file with loader, screen and code.

## Requirements

- installed visual studio code dev-container extension:
  [https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers](vscode-remote.remote-containers)

- Docker environment
  - Windows: [https://docs.docker.com/docker-for-windows/install/](https://docs.docker.com/docker-for-windows/install/)
  - Mac: [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/)
  - Linux: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## How to use

- Press F1, then execute `Dev Containers: Reopen in container`
- Wait for install container and recomended extensions (First time it may take a few minutes)
- Press (F5) to Start Debugging or (Ctrl + Shift + B) to execute build task.
- All ready to develop your project

(optional for build tap file with loader + screen + code)

- Press F1 and select 'Run Task' -> 'Build with PASMO'
- use build/main-output.tap in any emulator

Refers to [Wiki](https://github.com/dgzornoza/zx-ide/wiki) for more information.

## Remarks

Source code sample is from Juan Antonio Rubio García book 'Ensamblador para ZX Spectrum: ¿Hacemos un juego?'

www: <https://espamatica.com/>

### Sample TAP generator sjasmplus

*(currenly not tested)*

```asm
    DEVICE ZXSPECTRUM48
    INCLUDE BasicLib.asm

start_basic
    LINE : db clear : NUM 23980 : LEND
    LINE : db load, '""' , screen : LEND
    LINE : db load, '""', code : LEND
    LINE : db load, '""', code : NUM 32768 : LEND
    LINE : db rand, usr : NUM $5dad  : LEND
end_basic

    org $5dad
start_code
    INCBIN "main.bin"
end_code

    org 32768
start_func
    INCBIN "func.bin"
end_func

    org $4000
start_screen
    INCBIN "pantalla.scr"
end_screen


    DEFINE cinta "pin.tap"
    EMPTYTAP cinta
    ; cargador BASIC
    SAVETAP cinta, BASIC, "juego", start_basic, end_basic-start_basic, 10
    ;
    SAVETAP cinta, CODE, "pantalla", start_screen, end_screen-start_screen
    ; código máquina
    SAVETAP cinta, CODE, "main", start_code, end_code-start_code
    SAVETAP cinta, CODE, "funciones", start_func, end_func-start_func
```

*thanks to Pedro Picapiedra in Telegram group*

## Links of interest

- sjasmplus: <https://github.com/z00m128/sjasmplus>
- sjasmplus-doc: <https://z00m128.github.io/sjasmplus/documentation.html>
- PASMO-doc: <https://pasmo.speccy.org/pasmodoc.html>
- SPECCY: <https://www.speccy.org/>

- DeZog/sjasmplus sample program: <https://github.com/maziac/z80-sample-program>
- ASM telegram group: <https://t.me/EnsambladorZXSpectrum>

- My Github account: <https://github.com/dgzornoza>


**Enjoy!**
