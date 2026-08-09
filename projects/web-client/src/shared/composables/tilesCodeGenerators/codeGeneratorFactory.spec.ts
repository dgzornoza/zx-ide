// ─── Unit tests for the tiles code-generator factory ──────────────────────
//
// Pins the dispatch behaviour of `createTilesCodeGenerator`: each supported
// `CodeGenerationType` value must map to the matching concrete strategy
// instance, and any unrecognised value must fall through the switch's
// missing `default` branch (returns `undefined` at runtime).

import { describe, expect, it } from "vitest";

import { AsmTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/asmGenerator";
import { CTilesCodeGeneratorStrategy } from "src/shared/composables/tilesCodeGenerators/cGenerator";
import { createTilesCodeGenerator } from "src/shared/composables/tilesCodeGenerators/codeGeneratorFactory";
import type { CodeGenerationType } from "externalShared/extract-graphics/extract-graphics-dtos";

describe("createTilesCodeGenerator", () => {
  it("returns the C strategy instance for the 'c' code-generation type", () => {
    expect(createTilesCodeGenerator("c")).toBeInstanceOf(
      CTilesCodeGeneratorStrategy,
    );
  });

  it("returns the ASM strategy instance for the 'asm' code-generation type", () => {
    expect(createTilesCodeGenerator("asm")).toBeInstanceOf(
      AsmTilesCodeGeneratorStrategy,
    );
  });

  it("returns undefined for an unrecognised code-generation type", () => {
    // The factory's switch has no `default` branch, so any value outside
    // the two known types falls through and yields `undefined` at runtime.
    // The cast bypasses the type system to exercise that runtime branch.
    expect(
      createTilesCodeGenerator("js" as unknown as CodeGenerationType),
    ).toBeUndefined();
  });
});
