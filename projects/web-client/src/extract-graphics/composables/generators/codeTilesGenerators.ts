import {
  GeneratedFile,
  TilesCodeGeneratorParams,
  TilesCodeGeneratorStrategy,
} from "src/extract-graphics/composables/generators/generatorStrategy";
import { generateTileDefbLines } from "src/utils/image-utils";
import { toIdentifier, toMacroGuard } from "src/utils/string-utils";

// ─── C tiles strategy (Z88DK) ───────────────────────────────────────────────
/**
 * Generates a C header (`.h`) with `extern` declarations and a Z88DK assembly
 * file (`.asm`) with tile binary data in the `rodata_user` section.
 */
export class CTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const headerContent = this.generateHeaderFile(
      params.baseName,
      params.tileNames,
    );
    const asmContent = this.generateAsmFile(params);

    return [
      { extension: ".h", content: headerContent },
      { extension: ".asm", content: asmContent },
    ];
  }

  private generateHeaderFile(baseName: string, tileNames: string[]): string {
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

  private generateAsmFile(params: TilesCodeGeneratorParams): string {
    const { baseName, tileNames, tileWidth, tileHeight, bitmasks } = params;
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

      lines.push(
        "",
        `PUBLIC ${tileName}`,
        `${tileName}:`,
        ...generateTileDefbLines(bitmask, tileWidth, tileHeight),
      );
    });

    lines.push("");
    return lines.join("\n");
  }
}

// ─── ASM tiles strategy (sjasmplus) ────────────────────────────────────────

/**
 * Generates a single sjasmplus assembly file (`.asm`) with plain labels and
 * `defb @XXXXXXXX` binary tile data.
 */
export class AsmTilesCodeGeneratorStrategy implements TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[] {
    const { baseName, tileNames, tileWidth, tileHeight, bitmasks } = params;
    const id = toIdentifier(baseName);

    const lines: string[] = [`${id}_tiles:`];

    tileNames.forEach((name, tileIndex) => {
      const bitmask = bitmasks[tileIndex] ?? [];

      lines.push(
        "",
        `${id}_${name}:`,
        ...generateTileDefbLines(bitmask, tileWidth, tileHeight),
      );
    });

    lines.push("");
    return [{ extension: ".asm", content: lines.join("\n") }];
  }
}
