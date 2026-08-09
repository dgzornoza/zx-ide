// ─── String transformation utilities ───────────────────────────────────────
//
// Unit tests for the two identifier helpers that feed the C/ASM generators.
// These run as pure string transformations and have no dependencies.

import { describe, expect, it } from "vitest";

import { toCodeIdentifier, toMacroGuard } from "./string-utils";

describe("toCodeIdentifier", () => {
  it("lowercases an identifier with no special characters", () => {
    expect(toCodeIdentifier("PlayerOne")).toBe("playerone");
  });

  it("replaces spaces with underscores", () => {
    expect(toCodeIdentifier("my tiles")).toBe("my_tiles");
  });

  it("replaces hyphens with underscores", () => {
    expect(toCodeIdentifier("foo-bar")).toBe("foo_bar");
  });

  it("replaces every non-alphanumeric character with underscores in one pass", () => {
    expect(toCodeIdentifier("a.b@c")).toBe("a_b_c");
  });

  it("returns an empty string unchanged", () => {
    expect(toCodeIdentifier("")).toBe("");
  });
});

describe("toMacroGuard", () => {
  it("uppercases an identifier with no special characters", () => {
    expect(toMacroGuard("PlayerOne")).toBe("PLAYERONE");
  });

  it("replaces spaces with underscores", () => {
    expect(toMacroGuard("my tiles")).toBe("MY_TILES");
  });

  it("preserves digits in the input", () => {
    expect(toMacroGuard("tiles1")).toBe("TILES1");
  });
});
