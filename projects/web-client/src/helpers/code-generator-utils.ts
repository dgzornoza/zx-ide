// ─── Text formatters for ZX Spectrum code-generation output ─────────────────
//
// These functions take **already-computed byte arrays** and format them as
// `defb` directives. All bit-packing logic lives in `binary-builder-utils.ts`
// — this module is presentation only.
//
// The bytes-first split lets the same data flow into:
//   - Plain-mode generators:  bytes → formatBytesAsDefb() → `.asm` text
//   - Compressed generators:  bytes → zx0-compress()         → `.bin`
//
// Avoid re-introducing bitmap / attribute packing here.

// ─── defb line generators ─────────────────────────────────────────────────────

/** Formats a single byte as a `$XX` hex string. */
function toHexByte(value: number): string {
  return `$${value.toString(16).padStart(2, "0").toUpperCase()}`;
}

/**
 * Formats a byte array as `defb` directives (hex, MSB-aligned).
 *
 * Groups 8 bytes per line (16 with mask, since each data byte is preceded
 * by its mask byte). The output is a sequence of indented lines ready
 * to join into an ASM file.
 *
 * When `useMask` is `true`, the input is treated as alternating
 * mask/data byte pairs (mask, data, mask, data, …) and two bytes are
 * emitted per logical sprite-byte — preserving byte parity with the
 * uncompressed text output for decompression compatibility.
 *
 * @example
 * formatBytesAsDefb(new Uint8Array([0x80, 0x00]));
 * // → ['    defb $80,$00']
 *
 * @param bytes     - Pre-computed bytes (no bit-packing happens here).
 * @param perLine   - Bytes per `defb` line. Defaults to 8 (16 with mask).
 * @param useMask   - When `true`, treats input as (mask, data) pairs and
 *                    emits both per logical byte. Defaults to `false`.
 */
export function formatBytesAsDefb(
  bytes: Uint8Array,
  perLine?: number,
  useMask = false,
): string[] {
  const entries: string[] = [];

  if (useMask) {
    // Input is (mask, data) interleaved. `bytes[i]` is always in-bounds
    // here (the loop condition is `i < bytes.length`); only `bytes[i + 1]`
    // can be undefined when the input has an odd length.
    for (let i = 0; i < bytes.length; i += 2) {
      entries.push(toHexByte(bytes[i]), toHexByte(bytes[i + 1] ?? 0));
    }
  } else {
    for (const element of bytes) {
      entries.push(toHexByte(element ?? 0));
    }
  }

  const stride = perLine ?? (useMask ? 16 : 8);
  const lines: string[] = [];
  for (let i = 0; i < entries.length; i += stride) {
    lines.push(`    defb ${entries.slice(i, i + stride).join(",")}`);
  }
  return lines;
}

/**
 * Formats a pre-computed attribute byte array as `defb` lines.
 *
 * @param attrBytes - Bytes from {@link buildAttributeBytes}.
 * @param perLine   - Bytes per line. Defaults to 8.
 */
export function formatAttributeBytesAsDefb(
  attrBytes: Uint8Array,
  perLine = 8,
): string[] {
  const entries: string[] = [];
  for (const element of attrBytes) {
    entries.push(toHexByte(element ?? 0));
  }

  const lines: string[] = [];
  for (let offset = 0; offset < entries.length; offset += perLine) {
    lines.push(`    defb ${entries.slice(offset, offset + perLine).join(",")}`);
  }
  return lines;
}

/**
 * Formats a flat array of uint8 tile indices as decimal `defb` lines,
 * one map row per line.
 *
 * Used by map code generators where tiles are addressed by uint8 index (0-255).
 * No bit-packing involved — pure text formatting.
 *
 * @example
 * formatIndicesAsDefb([1,2,3,0,4,5,6,0], 4);
 * // → ['    defb 1,2,3,0', '    defb 4,5,6,0']
 *
 * @param indices  - Flat row-major array of tile indices.
 * @param rowWidth - Number of indices per row (= map width in tiles).
 */
export function formatIndicesAsDefb(
  indices: Uint8Array | number[],
  rowWidth: number,
): string[] {
  const rowCount = Math.floor(indices.length / rowWidth);
  const lines: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    const rowValues: string[] = [];
    for (let col = 0; col < rowWidth; col++) {
      rowValues.push(String(indices[row * rowWidth + col] ?? 0));
    }
    lines.push(`    defb ${rowValues.join(",")}`);
  }
  return lines;
}
