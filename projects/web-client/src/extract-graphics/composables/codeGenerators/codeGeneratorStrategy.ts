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
  /**
   * Numeric combination of {@link SpriteFlags} bits describing active options.
   * Use bitwise AND to test individual flags:
   * ```ts
   * if (params.spriteFlags & SpriteFlags.Sp1Padding) { ... }
   * ```
   */
  spriteFlags: number;
  /**
   * Pre-extracted pixel bitmasks for every sprite frame, indexed as
   * `spriteBitmasks[spriteIndex][frameIndex]`.
   *
   * Each inner array is row-major with length `sprite.width * sprite.height`.
   * `true` = ink pixel (dark / opaque), `false` = paper pixel.
   *
   * Populated by `useExtractGraphics` before invoking the generator, using
   * {@link extractSpritesBitmasks} from `image-utils`.
   */
  spriteBitmasks: boolean[][][];
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
