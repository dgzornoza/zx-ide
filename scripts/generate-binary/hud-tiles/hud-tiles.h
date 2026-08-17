#ifndef __DATA_HUD_TILES_H__
#define __DATA_HUD_TILES_H__

#include <stdint.h>

#define HUD_TILES_TILES_COUNT 128u
#define HUD_TILES_PIXMAP_SIZE (HUD_TILES_TILES_COUNT * 8u)
#define HUD_TILES_ATTRS_SIZE  128u
#define HUD_TILES_TOTAL_SIZE  (HUD_TILES_PIXMAP_SIZE + HUD_TILES_ATTRS_SIZE)

extern const uint8_t hud_tiles_compressed[];

#endif // __DATA_HUD_TILES_H__
