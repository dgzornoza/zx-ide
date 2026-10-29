// ─── Unit tests for the map tileset code-generator factory ────────────────
//
// Same dispatch contract as the tiles/sprites factories, but for the map
// tileset strategies. Pins the C/ASM mapping and the `undefined` fallback
// for unrecognised `CodeGenerationType` values.

import { describe, expect, it } from 'vitest';

import { AsmMapCodeGenerator } from 'src/domain/code-generation/map-tileset/asm-map-tileset-code-generator';
import { CMapCodeGenerator } from 'src/domain/code-generation/map-tileset/c-map-tileset-code-generator';
import { createMapCodeGenerator } from 'src/domain/code-generation/map-tileset/map-tileset-code-generator-factory';
import type { CodeGenerationType } from 'externalShared/extract-graphics/extract-graphics-dtos';

describe('createMapCodeGenerator', () => {
  it("returns the C strategy instance for the 'c' code-generation type", () => {
    expect(createMapCodeGenerator('c')).toBeInstanceOf(CMapCodeGenerator);
  });

  it("returns the ASM strategy instance for the 'asm' code-generation type", () => {
    expect(createMapCodeGenerator('asm')).toBeInstanceOf(AsmMapCodeGenerator);
  });

  it('returns undefined for an unrecognised code-generation type', () => {
    // The factory's switch has no `default` branch; unrecognised inputs
    // fall through and return `undefined` at runtime.
    expect(createMapCodeGenerator('js' as unknown as CodeGenerationType)).toBeUndefined();
  });
});
