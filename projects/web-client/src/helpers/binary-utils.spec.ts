// ─── Binary helpers ─────────────────────────────────────────────────────────
//
// Unit tests for the base64 byte contracts used to ship raw `.bin` payloads
// across the webview ↔ extension boundary, plus the small `readBytesFromFile`
// Blob reader. Round-trips exercise both the simple path and the 32 KiB
// chunking branch inside `bytesToBase64`.

import { describe, expect, it } from "vitest";

import { base64ToBytes, bytesToBase64, readBytesFromFile } from "./binary-utils";

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

describe("bytesToBase64", () => {
  it("returns an empty string for an empty input", () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe("");
  });

  it("encodes a known three-byte sequence to its canonical base64 form", () => {
    // [0x00, 0x01, 0x02] is a textbook fixture: AAEC.
    expect(bytesToBase64(new Uint8Array([0x00, 0x01, 0x02]))).toBe("AAEC");
  });
});

describe("base64ToBytes", () => {
  it("decodes a known base64 string back to the original bytes", () => {
    expect(base64ToBytes("AAEC")).toEqual(new Uint8Array([0x00, 0x01, 0x02]));
  });
});

describe("round-trip (bytesToBase64 → base64ToBytes)", () => {
  it("returns the original bytes byte-for-byte for a small payload", () => {
    const original = Uint8Array.from({ length: 16 }, (_, i) => i);
    const encoded = bytesToBase64(original);
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = base64ToBytes(encoded);
    expect(bytesEqual(decoded, original)).toBe(true);
  });

  it("returns the original bytes byte-for-byte across the 32 KiB chunking boundary", () => {
    // 0x8400 (33792) bytes — strictly larger than the 0x8000 chunk stride used
    // inside `bytesToBase64`, so multiple chunks are exercised. A deterministic
    // pseudo-random pattern keeps the test reproducible across runs.
    const length = 0x8400;
    let seed = 0xfeed_face;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fff_ffff;
      return seed & 0xff;
    };
    const original = Uint8Array.from({ length }, rand);
    const encoded = bytesToBase64(original);
    const decoded = base64ToBytes(encoded);
    expect(decoded.length).toBe(original.length);
    expect(bytesEqual(decoded, original)).toBe(true);
  });
});

describe("readBytesFromFile", () => {
  it("forwards a Blob's ArrayBuffer as a Uint8Array", async () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const blob = new Blob([payload]);
    const out = await readBytesFromFile(blob);
    expect(out).toEqual(payload);
  });
});