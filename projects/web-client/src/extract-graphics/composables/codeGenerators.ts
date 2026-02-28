/**
 * Code generators for tile-based graphics exports.
 *
 * generateHeaderFile  → C header (.h) with extern declarations
 * generateAsmFile     → Z88DK assembly (.asm) with tile binary data
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a base filename (no extension) into a valid C/ASM identifier.
 * Replaces any non-alphanumeric characters with underscores and lowercases.
 */
function toIdentifier(baseName: string): string {
  return baseName.toLowerCase().replaceAll(/[^a-z0-9]/g, "_");
}

/**
 * Converts a base filename to an UPPER_CASE macro guard name.
 */
function toMacroGuard(baseName: string): string {
  return baseName.toUpperCase().replaceAll(/[^A-Z0-9]/g, "_");
}

/**
 * Packs `tileWidth` boolean ink values from `bitmask` at the given `rowOffset`
 * into an array of bytes (one byte per 8 pixels, MSB = leftmost pixel).
 */
function rowToBytes(
  bitmask: boolean[],
  rowOffset: number,
  tileWidth: number,
): number[] {
  const bytesPerRow = Math.ceil(tileWidth / 8);
  const bytes: number[] = [];
  for (let b = 0; b < bytesPerRow; b++) {
    let value = 0;
    for (let bit = 0; bit < 8; bit++) {
      const col = b * 8 + bit;
      // MSB = leftmost pixel
      if (col < tileWidth && bitmask[rowOffset + col]) {
        value |= 1 << (7 - bit);
      }
    }
    bytes.push(value);
  }
  return bytes;
}

// ─── Header generator ─────────────────────────────────────────────────────────

/**
 * Generates a C header file with `extern` declarations for every tile.
 *
 * @param baseName  - Filename without extension (e.g. "player")
 * @param tileNames - Ordered list of tile names (e.g. ["tile1", "tile2"])
 * @returns UTF-8 content of the generated `.h` file
 */
export function generateHeaderFile(
  baseName: string,
  tileNames: string[],
): string {
  const id = toIdentifier(baseName);
  const guard = toMacroGuard(baseName);

  const lines: string[] = [
    `#ifndef __${guard}_H__`,
    `#define __${guard}_H__`,
    "",
    "#include <stdint.h>",
    "",
    `extern const uint8_t ${id}_tiles[];`,
    ...tileNames.map((name) => `extern const uint8_t ${id}_${name}[];`),
    "",
    `#endif // __${guard}_H__`,
    "",
  ];

  return lines.join("\n");
}

// ─── ASM generator ────────────────────────────────────────────────────────────

/**
 * Generates a Z88DK assembly file with binary tile data in `rodata_user` section.
 *
 * Each tile row is emitted as one or more `defb @XXXXXXXX` directives
 * (one per 8 pixels, MSB = leftmost pixel).
 *
 * @param baseName  - Filename without extension (e.g. "player")
 * @param tileNames - Ordered list of tile names
 * @param tileWidth - Tile width in pixels
 * @param tileHeight - Tile height in pixels
 * @param bitmasks  - Per-tile pixel array; `bitmasks[i]` is row-major boolean[] of
 *                    length `tileWidth * tileHeight` (true = ink pixel)
 * @returns UTF-8 content of the generated `.asm` file
 */
export function generateAsmFile(
  baseName: string,
  tileNames: string[],
  tileWidth: number,
  tileHeight: number,
  bitmasks: boolean[][],
): string {
  const id = toIdentifier(baseName);

  const lines: string[] = [
    "// Read-Only Data Section for User Module",
    "SECTION rodata_user",
    "",
    `PUBLIC _${id}_tiles`,
    `_${id}_tiles:`,
  ];

  tileNames.forEach((name, tileIndex) => {
    const tileName = `_${id}_${name}`;
    const bitmask = bitmasks[tileIndex] ?? [];

    lines.push("", `PUBLIC ${tileName}`, `${tileName}:`);

    for (let row = 0; row < tileHeight; row++) {
      const rowOffset = row * tileWidth;
      const bytes = rowToBytes(bitmask, rowOffset, tileWidth);
      for (const byte of bytes) {
        const bits = byte.toString(2).padStart(8, "0");
        lines.push(`    defb @${bits}`);
      }
    }
  });

  lines.push("");
  return lines.join("\n");
}
