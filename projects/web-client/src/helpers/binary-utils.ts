// ─── Binary helpers ────────────────────────────────────────────────────────────

/**
 * Converts a `Uint8Array` (or `number[]`) to a base64-encoded string suitable
 * for embedding in JSON / DTO transport.
 *
 * Used by code generators to ship raw uncompressed `.bin` bytes to the
 * VS Code extension, which then runs ZX0 compression before writing the
 * file to disk.
 *
 * @param bytes - Raw bytes to encode.
 * @returns Base64 string (no whitespace, standard alphabet).
 */
export function bytesToBase64(bytes: Uint8Array | number[]): string {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  let binary = "";
  const chunkSize = 0x8000; // 32 KiB chunks keep `apply` happy on large inputs
  for (let offset = 0; offset < arr.length; offset += chunkSize) {
    const chunk = arr.subarray(offset, offset + chunkSize);
    binary += String.fromCodePoint(...chunk);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string produced by {@link bytesToBase64} back into raw
 * bytes. Browser-only counterpart of `Buffer.from(base64, "base64")`.
 *
 * @param base64 - Base64-encoded string.
 * @returns Decoded bytes.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * Reads a `File` (or `Blob`) as raw bytes. Used by the webview to forward
 * binary payloads from the user-supplied source image to extension-side
 * helpers when needed.
 *
 * @param file - File-like object with `.arrayBuffer()`.
 */
export async function readBytesFromFile(file: Blob): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}
