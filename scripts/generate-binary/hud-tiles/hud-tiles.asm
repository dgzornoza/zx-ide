; HUD_TILES_PIXMAP_SIZE: 1024
; HUD_TILES_ATTRS_SIZE: 128
; HUD_TILES_TOTAL_SIZE: 1152
; Compressed Size: 631 bytes (ZX0 standard)

; incbin path is resolved relative to the Makefile cwd (project root),
; not relative to this .asm file's location.
SECTION rodata_user

PUBLIC _hud_tiles_compressed
_hud_tiles_compressed:
    incbin "hud-tiles.bin"
