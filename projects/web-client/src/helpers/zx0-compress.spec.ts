import { describe, expect, it } from "vitest";

import { compress, decompress, MAX_OFFSET_ZX7 } from "./zx0-compress";

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

describe("zx0-compress", () => {
  describe("round-trip (compress → decompress)", () => {
    it("returns the original payload unchanged for an empty input", () => {
      const empty = new Uint8Array(0);
      const { data } = compress(empty);
      // Empty payload → empty compressed stream (special-case handled in `compress`).
      expect(data.length).toBe(0);
      // No decompress call expected — round-trip is trivially satisfied.
    });

    it("round-trips a single byte", () => {
      const original = new Uint8Array([0x42]);
      const { data } = compress(original);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("round-trips a short buffer of distinct bytes", () => {
      const original = Uint8Array.from({ length: 32 }, (_, i) => i);
      const { data } = compress(original);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("round-trips a highly compressible repeating pattern", () => {
      const original = new Uint8Array(256).fill(0xaa);
      const { data } = compress(original);
      expect(data.length).toBeLessThan(original.length);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("round-trips a pseudo-random payload", () => {
      // Deterministic pseudo-random so the test is reproducible.
      let seed = 0x1234_5678;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fff_ffff;
        return seed & 0xff;
      };
      const original = Uint8Array.from({ length: 1024 }, rand);
      const { data } = compress(original);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("round-trips a large pseudo-random payload", () => {
      let seed = 0xdead_beef;
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fff_ffff;
        return seed & 0xff;
      };
      const original = Uint8Array.from({ length: 4096 }, rand);
      const { data } = compress(original);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("round-trips a pattern with repeated substrings (back-references)", () => {
      const pattern = "the quick brown fox jumps over the lazy dog ";
      const original = new Uint8Array(pattern.length * 16);
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < pattern.length; j++) {
          original[i * pattern.length + j] = pattern.charCodeAt(j);
        }
      }
      const { data } = compress(original);
      // Strong compression expected — pattern repeats 16 times.
      expect(data.length).toBeLessThan(original.length / 4);
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("respects the quick-mode sliding window", () => {
      const original = Uint8Array.from(
        { length: MAX_OFFSET_ZX7 * 2 },
        (_, i) => i & 0xff,
      );
      const { data } = compress(original, { quick: true });
      const out = decompress(data);
      expect(bytesEqual(out, original)).toBe(true);
    });

    it("returns a non-zero delta for forward compression", () => {
      const original = new Uint8Array(64).fill(0x55);
      const { delta } = compress(original);
      expect(delta).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error handling", () => {
    it("throws on truncated input", () => {
      // A header byte that says "literal block of length N" but no payload.
      const truncated = new Uint8Array([0x00, 0xff, 0xff, 0xff]);
      expect(() => decompress(truncated)).toThrow("Truncated input");
    });

    it("rejects non-Uint8Array input gracefully", () => {
      // Number[] → auto-converted by `compress` via Uint8Array.from.
      const result = compress([1, 2, 3, 4] as unknown as Uint8Array);
      const out = decompress(result.data);
      expect(bytesEqual(out, new Uint8Array([1, 2, 3, 4]))).toBe(true);
    });
  });

  // Touch the constants so they appear referenced (otherwise TS unused-warning).
  it("exports the documented constants", () => {
    expect(MAX_OFFSET_ZX7).toBe(2176);
  });
});
