// ─── ZX0 data compressor (JavaScript port) ──────────────────────────────────
//
// ZX0 — Optimal LZ77/LZSS compressor by Einar Saukas.
//   Original C implementation: https://github.com/einar-saukas/ZX0
//   JavaScript port by Bedazzle: https://github.com/Bedazzle/zx0-js
//
// BSD-3-Clause license. Original copyright:
//   (c) 2021 Einar Saukas
//   JavaScript port (c) 2026 Bedazzle
//
// ─── Why this lives in the webview ──────────────────────────────────────────
//
// We use the *quick* mode (`-q` equivalent) which compresses in milliseconds
// even on small inputs. Switching to JS (instead of a native binary) gives
// us cross-platform parity (Linux/macOS/Windows/ARM, no native dependency)
// and lets standalone browser mode also produce compressed `.bin` outputs.
//
// Output is byte-for-byte compatible with `zx0.exe -q` (V2 format).

const MAX_OFFSET_ZX0 = 32640;
const MAX_OFFSET_ZX7 = 2176;
const INITIAL_OFFSET = 1;

interface OptimizeNode {
  bits: number;
  index: number;
  offset: number;
  chain: OptimizeNode | null;
}

// ─── Compression (V2 standard format) ──────────────────────────────────────
//
// The following function structure mirrors the upstream JS port
// (Bedazzle/zx0-js) closely. Helper extraction was attempted and
// reverted — the inner optimization loop is sensitive to ordering
// and side effects, so it stays inline here.

function eliasGammaBits(value: number): number {
  let bits = 1;
  while ((value >>>= 1) !== 0) bits += 2;
  return bits;
}

function offsetCeiling(index: number, offsetLimit: number): number {
  // Equivalent to the original nested ternary:
  //   return index > offsetLimit ? offsetLimit
  //        : index < INITIAL_OFFSET ? INITIAL_OFFSET
  //        : index;
  // Using `Math.max` + `Math.min` keeps it linear.
  return Math.max(INITIAL_OFFSET, Math.min(index, offsetLimit));
}

function optimize(
  inputData: Uint8Array,
  inputSize: number,
  skip: number,
  offsetLimit: number,
): OptimizeNode | null {
  if (inputSize === 0) return null;

  const maxOffsetStart = offsetCeiling(inputSize - 1, offsetLimit);

  const lastLiteral: (OptimizeNode | null)[] = new Array(maxOffsetStart + 1).fill(null);
  const lastMatch: (OptimizeNode | null)[] = new Array(maxOffsetStart + 1).fill(null);
  const optimal: (OptimizeNode | null)[] = new Array(inputSize).fill(null);
  const matchLength = new Int32Array(maxOffsetStart + 1);
  const bestLength = new Int32Array(inputSize);

  if (inputSize > 2) bestLength[2] = 2;

  function allocate(
    bits: number,
    index: number,
    offset: number,
    chain: OptimizeNode | null,
  ): OptimizeNode {
    return { bits, index, offset, chain };
  }

  lastMatch[INITIAL_OFFSET] = allocate(-1, skip - 1, INITIAL_OFFSET, null);

  for (let index = skip; index < inputSize; index++) {
    let bestLengthSize = 2;
    const maxOffset = offsetCeiling(index, offsetLimit);
    for (let offset = 1; offset <= maxOffset; offset++) {
      if (index !== skip && index >= offset && inputData[index] === inputData[index - offset]) {
        // copy from last offset
        if (lastLiteral[offset]) {
          const length = index - lastLiteral[offset]!.index;
          const bits = lastLiteral[offset]!.bits + 1 + eliasGammaBits(length);
          lastMatch[offset] = allocate(bits, index, offset, lastLiteral[offset]);
          if (!optimal[index] || optimal[index]!.bits > bits) {
            optimal[index] = lastMatch[offset];
          }
        }
        // copy from new offset
        matchLength[offset]++;
        if (matchLength[offset] > 1) {
          if (bestLengthSize < matchLength[offset]) {
            let bits =
              optimal[index - bestLength[bestLengthSize]]!.bits +
              eliasGammaBits(bestLength[bestLengthSize] - 1);
            do {
              bestLengthSize++;
              const bits2 =
                optimal[index - bestLengthSize]!.bits +
                eliasGammaBits(bestLengthSize - 1);
              if (bits2 <= bits) {
                bestLength[bestLengthSize] = bestLengthSize;
                bits = bits2;
              } else {
                bestLength[bestLengthSize] = bestLengthSize - 1;
              }
            } while (bestLengthSize < matchLength[offset]);
          }
          const length = bestLength[matchLength[offset]];
          const bits =
            optimal[index - length]!.bits +
            8 +
            eliasGammaBits(Math.trunc((offset - 1) / 128) + 1) +
            eliasGammaBits(length - 1);
          if (!lastMatch[offset] || lastMatch[offset]!.index !== index || lastMatch[offset]!.bits > bits) {
            lastMatch[offset] = allocate(bits, index, offset, optimal[index - length]);
            if (!optimal[index] || optimal[index]!.bits > bits) {
              optimal[index] = lastMatch[offset];
            }
          }
        }
      } else {
        // copy literals
        matchLength[offset] = 0;
        if (lastMatch[offset]) {
          const length = index - lastMatch[offset]!.index;
          const bits = lastMatch[offset]!.bits + 1 + eliasGammaBits(length) + length * 8;
          lastLiteral[offset] = allocate(bits, index, 0, lastMatch[offset]);
          if (!optimal[index] || optimal[index]!.bits > bits) {
            optimal[index] = lastLiteral[offset];
          }
        }
      }
    }
  }

  return optimal[inputSize - 1];
}

function compressForward(
  inputData: Uint8Array,
  skip: number,
  classicMode: boolean,
  quickMode: boolean,
): { data: Uint8Array; delta: number } {
  const inputSize = inputData.length;
  const offsetLimit = quickMode ? MAX_OFFSET_ZX7 : MAX_OFFSET_ZX0;
  const invertMode = !classicMode;

  const optimalBlock = optimize(inputData, inputSize, skip, offsetLimit);
  // `compress()` short-circuits empty input, so we always have a block here.
  const rootBits = optimalBlock!.bits;

  // Allocate a slightly oversized buffer (+25 is the upstream constant).
  const outputSize = Math.trunc((rootBits + 25) / 8);
  const outputData = new Uint8Array(outputSize);

  // Un-reverse the chain so we walk it forward when emitting.
  let prev: OptimizeNode | null = null;
  let cur: OptimizeNode | null = optimalBlock;
  while (cur !== null) {
    const next = cur.chain;
    cur.chain = prev;
    prev = cur;
    cur = next;
  }

  // Initialize state — encapsulated in a struct to keep the main loop readable.
  const state = {
    outputData,
    diff: outputSize - inputSize + skip,
    delta: 0,
    inputIndex: skip,
    outputIndex: 0,
    bitMask: 0,
    bitIndex: 0,
    backtrack: true,
    lastOffset: INITIAL_OFFSET,
  };

  function readBytes(n: number): void {
    state.inputIndex += n;
    state.diff += n;
    if (state.delta < state.diff) state.delta = state.diff;
  }

  function writeByte(value: number): void {
    state.outputData[state.outputIndex++] = value;
    state.diff--;
  }

  function writeBit(value: boolean | number): void {
    if (state.backtrack) {
      if (value) state.outputData[state.outputIndex - 1] |= 1;
      state.backtrack = false;
      return;
    }
    if (state.bitMask === 0) {
      state.bitMask = 128;
      state.bitIndex = state.outputIndex;
      writeByte(0);
    }
    if (value) state.outputData[state.bitIndex] |= state.bitMask;
    state.bitMask >>>= 1;
  }

  function writeInterlacedEliasGamma(value: number, invert: boolean): void {
    // Find the highest power of 2 ≤ value.
    let i = 2;
    while (i <= value) i <<= 1;
    i >>>= 1;

    while ((i >>>= 1) !== 0) {
      // Equivalent to the original nested-ternary expression:
      //   leadBit = backwardsMode ? 1 : 0;
      //   tailBit = invert
      //     ? !(value & i) ? 1 : 0
      //     : value & i ? 1 : 0;
      // Extracted as plain arithmetic for readability (this is forward mode,
      // so `backwardsMode` is always `false` and `leadBit === 0`).
      const valueBit = (value & i) !== 0;
      const tailBit = invert ? (valueBit ? 0 : 1) : valueBit ? 1 : 0;
      writeBit(0);
      writeBit(tailBit);
    }
    writeBit(1);
  }

  let node: OptimizeNode | null = prev;
  while (node !== null) {
    const opt = node.chain;
    if (opt === null) break;

    const length = opt.index - node.index;

    if (opt.offset === 0) {
      // copy literals
      writeBit(0);
      writeInterlacedEliasGamma(length, false);
      for (let i = 0; i < length; i++) {
        writeByte(inputData[state.inputIndex]);
        readBytes(1);
      }
    } else if (opt.offset === state.lastOffset) {
      // copy from last offset
      writeBit(0);
      writeInterlacedEliasGamma(length, false);
      readBytes(length);
    } else {
      // copy from new offset
      writeBit(1);
      writeInterlacedEliasGamma(
        Math.trunc((opt.offset - 1) / 128) + 1,
        invertMode,
      );

      // Offset LSB — inverted (0 → 127) for forward mode.
      const offsetLSB = (opt.offset - 1) % 128;
      writeByte((127 - offsetLSB) << 1);

      state.backtrack = true;
      writeInterlacedEliasGamma(length - 1, false);
      readBytes(length);

      state.lastOffset = opt.offset;
    }

    node = opt;
  }

  // End marker.
  writeBit(1);
  writeInterlacedEliasGamma(256, invertMode);

  return { data: outputData, delta: state.delta };
}

function compressBlock(
  inputData: Uint8Array,
  skip: number,
  backwardsMode: boolean,
  classicMode: boolean,
  quickMode: boolean,
): { data: Uint8Array; delta: number } {
  if (backwardsMode) {
    const reversed = new Uint8Array(inputData);
    reverse(reversed, 0, reversed.length - 1);
    const result = compressBlock(reversed, skip, true, classicMode, quickMode);
    reverse(result.data, 0, result.data.length - 1);
    return result;
  }
  return compressForward(inputData, skip, classicMode, quickMode);
}

// ─── Decompression (V2 standard format) ────────────────────────────────────

function decompressForward(
  inputData: Uint8Array,
  classicMode: boolean,
): Uint8Array {
  const inputSize = inputData.length;
  const output: number[] = [];

  let inputIndex = 0;
  let bitMask = 0;
  let bitValue = 0;
  let backtrack = false;
  let lastByte = 0;
  let lastOffset = INITIAL_OFFSET;

  function readByte(): number {
    if (inputIndex >= inputSize) throw new Error("Truncated input");
    lastByte = inputData[inputIndex++];
    return lastByte;
  }

  function readBit(): number {
    if (backtrack) {
      backtrack = false;
      return lastByte & 1;
    }
    bitMask >>>= 1;
    if (bitMask === 0) {
      bitMask = 128;
      bitValue = readByte();
    }
    return (bitValue & bitMask) !== 0 ? 1 : 0;
  }

  function readInterlacedEliasGamma(inverted: number): number {
    let value = 1;
    const continueReading = (): boolean => readBit() === 0;
    while (continueReading()) {
      value = (value << 1) | (readBit() ^ inverted);
    }
    return value;
  }

  function writeBytes(offset: number, length: number): void {
    for (let i = 0; i < length; i++) {
      output.push(output[output.length - offset]);
    }
  }

  const invertOffset = !classicMode ? 1 : 0;
  let length: number;

  function copyFromNewOffset(): boolean {
    const msb = readInterlacedEliasGamma(invertOffset);
    if (msb === 256) return false;
    lastOffset = msb * 128 - (readByte() >> 1);
    backtrack = true;
    length = readInterlacedEliasGamma(0) + 1;
    writeBytes(lastOffset, length);
    return true;
  }

  // State machine mirroring dzx0.c's gotos:
  //   0 = COPY_LITERALS, 1 = COPY_FROM_LAST_OFFSET, 2 = COPY_FROM_NEW_OFFSET
  let stateId = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stateId === 0) {
      // COPY_LITERALS
      length = readInterlacedEliasGamma(0);
      for (let i = 0; i < length; i++) output.push(readByte());
      stateId = readBit() === 1 ? 2 : 1;
    } else if (stateId === 1) {
      // COPY_FROM_LAST_OFFSET
      length = readInterlacedEliasGamma(0);
      writeBytes(lastOffset, length);
      stateId = readBit() === 0 ? 0 : 2;
    } else {
      // COPY_FROM_NEW_OFFSET
      if (!copyFromNewOffset()) break;
      stateId = readBit() === 1 ? 2 : 0;
    }
  }

  return new Uint8Array(output);
}

function decompressBlock(
  inputData: Uint8Array,
  backwardsMode: boolean,
  classicMode: boolean,
): Uint8Array {
  if (backwardsMode) {
    const reversed = new Uint8Array(inputData);
    reverse(reversed, 0, reversed.length - 1);
    const result = decompressBlock(reversed, true, classicMode);
    reverse(result, 0, result.length - 1);
    return result;
  }
  return decompressForward(inputData, classicMode);
}

function reverse(arr: Uint8Array, start: number, end: number): void {
  while (start < end) {
    const tmp = arr[start];
    arr[start] = arr[end];
    arr[end] = tmp;
    start++;
    end--;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Result of {@link compress}. */
export interface CompressionResult {
  /** Compressed payload (ZX0 V2 format). */
  data: Uint8Array;
  /**
   * Minimum offset (in bytes) required between the end of the compressed
   * stream and the end of the decompressed buffer for safe in-place
   * decompression.
   */
  delta: number;
}

/**
 * Compresses `inputData` using the ZX0 algorithm.
 *
 * @param inputData - Raw bytes to compress.
 * @param options.quick - When `true` (default), uses ZX7-style quick mode
 *   with a 2176-byte sliding window — near-instant compression with a
 *   slightly larger output. Set to `false` for the full optimal ZX0
 *   compressor (32 KB window, slower).
 * @returns Compressed payload + delta hint for in-place decompression.
 */
export function compress(
  inputData: Uint8Array,
  options: { quick?: boolean } = {},
): CompressionResult {
  const data = inputData instanceof Uint8Array ? inputData : Uint8Array.from(inputData);
  if (data.length === 0) return { data: new Uint8Array(0), delta: 0 };
  return compressBlock(data, 0, false, false, options.quick ?? true);
}

/**
 * Decompresses a ZX0 V2 payload. Output is byte-identical to the
 * original pre-compression data, regardless of whether compression was
 * performed by this JS port or by `zx0.exe -q` (both produce V2 format).
 */
export function decompress(inputData: Uint8Array): Uint8Array {
  const data = inputData instanceof Uint8Array ? inputData : Uint8Array.from(inputData);
  return decompressBlock(data, false, false);
}

/** Maximum offset in normal (optimal) mode — 32 KB sliding window. */
export { MAX_OFFSET_ZX0 };
/** Maximum offset in quick mode — same as ZX7. */
export { MAX_OFFSET_ZX7 };
