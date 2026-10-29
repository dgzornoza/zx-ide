// ─── Unit tests for the sprites code-generator factory ────────────────────
//
// Same dispatch contract as the tiles factory, but for the sprite
// strategies. Pins the C/ASM mapping and the `undefined` fallback for
// unrecognised `CodeGenerationType` values.

import { describe, expect, it } from 'vitest';

import { AsmSpritesCodeGeneratorStrategy } from 'src/domain/code-generation/sprites/asm-sprites-code-generator';
import { CSpritesCodeGeneratorStrategy } from 'src/domain/code-generation/sprites/c-sprites-code-generator';
import { createSpritesCodeGenerator } from 'src/domain/code-generation/sprites/sprites-code-generator-factory';
import type { CodeGenerationType } from 'externalShared/extract-graphics/extract-graphics-dtos';

describe('createSpritesCodeGenerator', () => {
  it("returns the C strategy instance for the 'c' code-generation type", () => {
    expect(createSpritesCodeGenerator('c')).toBeInstanceOf(CSpritesCodeGeneratorStrategy);
  });

  it("returns the ASM strategy instance for the 'asm' code-generation type", () => {
    expect(createSpritesCodeGenerator('asm')).toBeInstanceOf(AsmSpritesCodeGeneratorStrategy);
  });

  it('returns undefined for an unrecognised code-generation type', () => {
    // The factory's switch has no `default` branch; unrecognised inputs
    // fall through and return `undefined` at runtime.
    expect(createSpritesCodeGenerator('js' as unknown as CodeGenerationType)).toBeUndefined();
  });
});
