import { generateIndexDefbLines } from "src/shared/composables/codeGenerators/codeGeneratorUtils";
import { toCodeIdentifier, toMacroGuard } from "src/utils/string-utils";
import type { CodeGenerationType } from "../../../../../shared/extract-graphics/extract-graphics-dtos";
import type {
  GeneratedFile,
  IMapCodeGeneratorStrategy,
  MapCodeGeneratorParams,
} from "./codeGeneratorStrategy";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHeader(
  name: string,
  mapWidth: number,
  mapHeight: number,
): string {
  return `; Map: ${name}  (${mapWidth} x ${mapHeight} tiles)`;
}

// ─── sjasmplus ASM generator ─────────────────────────────────────────────────

class AsmMapCodeGenerator implements IMapCodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight } = metadata;
    const identifier = toCodeIdentifier(name);
    const header = buildHeader(name, mapWidth, mapHeight);
    const rows = generateIndexDefbLines(tileIndices, mapWidth);

    const content = [header, `${identifier}:`, ...rows, ""].join("\n");

    return [
      {
        fileType: "asm",
        fileName: `${name}.asm`,
        content,
      },
    ];
  }
}

// ─── z88dk C generator ───────────────────────────────────────────────────────

class CMapCodeGenerator implements IMapCodeGeneratorStrategy {
  generate(params: MapCodeGeneratorParams): GeneratedFile[] {
    const { name, metadata, tileIndices } = params;
    const { mapWidth, mapHeight } = metadata;
    const identifier = toCodeIdentifier(name);
    const macroGuard = toMacroGuard(name);
    const header = buildHeader(name, mapWidth, mapHeight);
    const rows = generateIndexDefbLines(tileIndices, mapWidth);

    const headerContent = [
      `#ifndef ${macroGuard}_H`,
      `#define ${macroGuard}_H`,
      "",
      `// ${header.slice(2)}`,
      `#define ${macroGuard}_WIDTH  ${mapWidth}`,
      `#define ${macroGuard}_HEIGHT ${mapHeight}`,
      `#define ${macroGuard}_SIZE   ${mapWidth * mapHeight}`,
      `extern unsigned char ${identifier}[${mapHeight}][${mapWidth}];`,
      "",
      `#endif`,
      "",
    ].join("\n");

    const asmContent = [
      "SECTION rodata_user",
      `PUBLIC _${identifier}`,
      "",
      header,
      `_${identifier}:`,
      ...rows,
      "",
    ].join("\n");

    return [
      {
        fileType: "c-header",
        fileName: `${name}.h`,
        content: headerContent,
      },
      {
        fileType: "asm",
        fileName: `${name}.asm`,
        content: asmContent,
      },
    ];
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createMapCodeGenerator(
  type: CodeGenerationType,
): IMapCodeGeneratorStrategy {
  if (type === "c") {
    return new CMapCodeGenerator();
  }
  return new AsmMapCodeGenerator();
}
