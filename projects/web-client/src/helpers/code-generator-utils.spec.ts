// ─── Text formatters for ZX Spectrum code-generation output ─────────────────
//
// Unit tests for the three `defb`-formatting helpers. These run as pure text
// transformations over pre-computed byte arrays; no bit-packing happens here.
// Behavioural quirks (defensive fallbacks, partial-row drops) are locked in
// explicitly — see individual test names for the contract.

import { describe, expect, it } from "vitest";

import {
  formatAttributeBytesAsDefb,
  formatBytesAsDefb,
  formatIndicesAsDefb,
} from "./code-generator-utils";

describe("formatBytesAsDefb", () => {
  it("returns an empty array for an empty input", () => {
    expect(formatBytesAsDefb(new Uint8Array(0))).toEqual([]);
  });

  it("packs eight unmasked bytes into a single indented line", () => {
    expect(formatBytesAsDefb(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07])))
      .toEqual(["    defb $00,$01,$02,$03,$04,$05,$06,$07"]);
  });

  it("wraps to a second line when input exceeds the default per-line stride", () => {
    const nine = Uint8Array.from({ length: 9 }, (_, i) => i);
    expect(formatBytesAsDefb(nine)).toEqual([
      "    defb $00,$01,$02,$03,$04,$05,$06,$07",
      "    defb $08",
    ]);
  });

  it("emits alternating mask/data hex pairs in a single line when useMask is set", () => {
    // 8 mask/data pairs (16 bytes) → 16 hex entries on one line at the
    // useMask-default stride of 16.
    const pairs = new Uint8Array([
      0xff, 0x00, 0xff, 0x01, 0xff, 0x02, 0xff, 0x03,
      0xff, 0x04, 0xff, 0x05, 0xff, 0x06, 0xff, 0x07,
    ]);
    expect(formatBytesAsDefb(pairs, undefined, true)).toEqual([
      "    defb $FF,$00,$FF,$01,$FF,$02,$FF,$03,$FF,$04,$FF,$05,$FF,$06,$FF,$07",
    ]);
  });

  it("preserves the trailing mask byte and defaults only the missing data byte to $00 in an odd-length masked input", () => {
    // Three bytes [0x00, 0x01, 0x02] with `useMask=true` pair as
    // (mask=$00, data=$01) and (mask=$02, data=$00, default fallback).
    // The `?? 0xff` mask-side default was removed because the loop
    // condition `i < bytes.length` already guarantees `bytes[i]` is
    // in-bounds on every iteration.
    expect(formatBytesAsDefb(new Uint8Array([0x00, 0x01, 0x02]), undefined, true))
      .toEqual(["    defb $00,$01,$02,$00"]);
  });

  it("honours a custom per-line override", () => {
    const eight = Uint8Array.from({ length: 8 }, (_, i) => i);
    expect(formatBytesAsDefb(eight, 4)).toEqual([
      "    defb $00,$01,$02,$03",
      "    defb $04,$05,$06,$07",
    ]);
  });
});

describe("formatAttributeBytesAsDefb", () => {
  it("returns an empty array for an empty input", () => {
    expect(formatAttributeBytesAsDefb(new Uint8Array(0))).toEqual([]);
  });

  it("packs eight attribute bytes into a single line by default", () => {
    const eight = Uint8Array.from({ length: 8 }, (_, i) => i);
    expect(formatAttributeBytesAsDefb(eight)).toEqual([
      "    defb $00,$01,$02,$03,$04,$05,$06,$07",
    ]);
  });

  it("wraps to exactly two lines of eight entries each for sixteen bytes", () => {
    const sixteen = Uint8Array.from({ length: 16 }, (_, i) => i);
    expect(formatAttributeBytesAsDefb(sixteen)).toEqual([
      "    defb $00,$01,$02,$03,$04,$05,$06,$07",
      "    defb $08,$09,$0A,$0B,$0C,$0D,$0E,$0F",
    ]);
  });

  it("honours a custom per-line override", () => {
    const eight = Uint8Array.from({ length: 8 }, (_, i) => i);
    expect(formatAttributeBytesAsDefb(eight, 4)).toEqual([
      "    defb $00,$01,$02,$03",
      "    defb $04,$05,$06,$07",
    ]);
  });
});

describe("formatIndicesAsDefb", () => {
  it("emits one line per map row using decimal indices", () => {
    expect(formatIndicesAsDefb([1, 2, 3, 0, 4, 5, 6, 0], 4)).toEqual([
      "    defb 1,2,3,0",
      "    defb 4,5,6,0",
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(formatIndicesAsDefb([], 4)).toEqual([]);
  });

  it("silently drops a partial trailing row that does not fill rowWidth", () => {
    // 5 elements with rowWidth=4 → 1 complete row (4 elements); the 5th
    // element is discarded by `Math.floor(length / rowWidth)`. This is the
    // current behaviour and must not silently change without a deliberate
    // refactor of callers.
    expect(formatIndicesAsDefb([10, 20, 30, 40, 50], 4)).toEqual([
      "    defb 10,20,30,40",
    ]);
  });

  it("produces identical output for a Uint8Array and an equivalent number[]", () => {
    const asArray = [1, 2, 3, 4, 5, 6, 7, 8];
    const asUint8 = new Uint8Array(asArray);
    expect(formatIndicesAsDefb(asArray, 4)).toEqual(formatIndicesAsDefb(asUint8, 4));
  });

  it("emits no rows when rowWidth exceeds the input length", () => {
    // 3 elements with rowWidth=10 → Math.floor(3 / 10) = 0, so no row is
    // emitted. This is the current behaviour (and is consistent with the
    // existing "silently drops a partial trailing row" test above).
    expect(formatIndicesAsDefb([1, 2, 3], 10)).toEqual([]);
  });
});