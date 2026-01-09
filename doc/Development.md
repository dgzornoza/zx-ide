# Development Notes

benchmark z88dk:
<https://www.cpcmania.com/Docs/Programming/SDCC_vs_z88dk_Comparando_tama%C3%B1o_y_velocidad.htm?utm_source=copilot.com>

## Debugging GDB configuration

```json
        {
            // https://github.com/speccytools/fuse/
            "type": "gdb",
            "request": "attach",
            "name": "Attach to gdbserver",
            "executable": "${workspaceRoot}/build/z88dkDbg.map",
            "target": "192.168.123.118:1339",
            "remote": true,
            "cwd": "${workspaceRoot}",
            "gdbpath": "z88dk-gdb",
            "autorun": [],
            "stopAtConnect": true,
            "printCalls": true
            // "debugger_args": [
            //     "-x",
            //     "${workspaceRoot}/build/z88dkDbg.map"
            // ],
            //"showDevDebugOutput": true
            // "valuesFormatting": "parseText"
        },
```
