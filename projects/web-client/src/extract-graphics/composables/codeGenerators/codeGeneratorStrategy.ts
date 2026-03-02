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
 * - `"c"`   → {@link CSpritesCodeGeneratorStrategy}  (C header + Z88DK assembly)
 * - `"asm"` → {@link AsmSpritesCodeGeneratorStrategy} (sjasmplus assembly)
 */

import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import { TilesModel } from "src/extract-graphics/models/tilesDefinition";
import { FileEntry } from "../../../../../shared/extract-graphics/extract-graphics-dtos";

// ─── Public types ─────────────────────────────────────────────────────────────

/** Generated file entry for generators */
export type GeneratedFile = FileEntry;

/** Parameters for sprite code-generation strategies. */
export interface SpritesCodeGeneratorParams {
  /** Filename without extension (e.g. `"player"`). */
  name: string;
  /** Full list of sprite definitions (including frame coordinates). */
  sprites: SpriteDefinition[];
}

/** Parameters for tile code-generation strategies. */
export interface TilesCodeGeneratorParams {
  /** Filename without extension (e.g. `"mainTiles"`). */
  name: string;
  /** Full tiles model containing dimensions, names, bitmasks and count. */
  tiles: TilesModel;
}

// ─── Strategy interfaces ──────────────────────────────────────────────────────

/** Strategy that produces all output files (map + source) from tile data. */
export interface TilesCodeGeneratorStrategy {
  generate(params: TilesCodeGeneratorParams): GeneratedFile[];
}

/**
 * Strategy that produces all output files (map + source) from sprite data.
 */
export interface SpritesCodeGeneratorStrategy {
  generate(params: SpritesCodeGeneratorParams): GeneratedFile[];
}
