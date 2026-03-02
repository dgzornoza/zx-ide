/**
 * Code generators for tile-based and sprite-based graphics exports.
 *
 * Provides strategy interfaces for tiles and sprites, each with two
 * concrete implementations selected via the factory functions:
 *
 * Tiles:
 * - `"c"`   → {@link CTilesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmTilesCodeGeneratorStrategy} (sjasmplus assembly)
 *
 * Sprites:
 * - `"c"`   → {@link CSpritesCodeGeneratorStrategy}  (stub)
 * - `"asm"` → {@link AsmSpritesCodeGeneratorStrategy} (stub)
 */

import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";

// ─── Public types ─────────────────────────────────────────────────────────────

/** Parameters for sprite code-generation strategies. */
export interface SpritesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  baseName: string;
  /** Full list of sprite definitions (including frame coordinates). */
  sprites: SpriteDefinition[];
}

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  baseName: string;
  /** Ordered list of tile names (e.g. `["tile1", "tile2"]`). */
  tileNames: string[];
  /** Tile width in pixels. */
  tileWidth: number;
  /** Tile height in pixels. */
  tileHeight: number;
  /**
   * Per-tile pixel bitmask.
   * `bitmasks[i]` is a row-major `boolean[]` of length `tileWidth * tileHeight`.
   * `true` = ink pixel.
   */
  bitmasks: boolean[][];
}

/** A single generated output file. */
export interface GeneratedFile {
  /** File extension including the dot (e.g. `".h"`, `".asm"`). */
  extension: string;
  /** UTF-8 content of the file. */
  content: string;
  /**
   * Optional filename used to build the output filename.
   * Only set by sprite strategies (one file per sprite).
   */
  fileName?: string;
}

// ─── Strategy interfaces ──────────────────────────────────────────────────────

/** Strategy that produces one or more source files from tile data. */
export interface TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}

/**
 * Strategy that produces one source file per sprite.
 * Each returned {@link GeneratedFile} has `fileName` set.
 */
export interface SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[];
}
