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

  it("falls back to ($FF,$00) only for the missing trailing byte of an odd-length masked input", () => {
    // Three bytes: the third (odd index) byte is preserved as-is ($02), and
    // the missing fourth byte falls through to the `?? 0` defensive default.
    // The `?? 0xff` fallback for `bytes[i]` only kicks in when the *first*
    // index of the pair is past the end, which never happens here because the
    // loop steps by 2 and the length is odd (3, 5, 7…). The quirk is real
    // but subtler than "missing mask byte defaults to 0xff".
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
});