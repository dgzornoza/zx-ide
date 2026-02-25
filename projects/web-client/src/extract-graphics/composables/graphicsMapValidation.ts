// ─── Path utilities ────────────────────────────────────────────────────────

import { SpriteDefinition } from "src/extract-graphics/models/spriteDefinition";
import { TileDefinition } from "src/extract-graphics/models/tilesDefinition";

/**
 * Trims whitespace and converts backslashes to forward slashes.
 */
export function normalizeRelativePath(value: string): string {
  return value.trim().replace(/\\/g, "/");
}

/**
 * Returns true when the given string looks like an absolute path
 * (Unix-style `/…` or Windows-style `C:\…` / `C:/…`).
 */
export function isAbsolutePath(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("\\") ||
    /^[a-zA-Z]:[\\/]/.test(value)
  );
}

/**
 * Derives the workspace-relative `.map.json` path from the source PNG path.
 * e.g. `assets/sprites/hero.png` → `assets/sprites/hero.map.json`
 */
export function buildMapRelativePath(sourcePath: string): string {
  const normalized = normalizeRelativePath(sourcePath);
  const lastSlash = normalized.lastIndexOf("/");
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : "";
  const base = normalized.slice(lastSlash + 1);
  const name = base.replace(/\.[^/.]+$/, "");
  return dir ? `${dir}/${name}.map.json` : `${name}.map.json`;
}

// ─── Field validators ──────────────────────────────────────────────────────

/**
 * Validates the source PNG field.
 * @throws `Error` with a translated message on invalid input.
 */
export function validateSource(
  source: string,
  t: (key: string) => string,
): void {
  if (!source) {
    throw new Error(t("errorSourceRequired"));
  }
  if (!source.toLowerCase().endsWith(".png")) {
    throw new Error(t("errorSourceNotPng"));
  }
  if (isAbsolutePath(source)) {
    throw new Error(t("errorSourceAbsolutePath"));
  }
}

/**
 * Validates the graphics data output folder field.
 * @throws `Error` with a translated message on invalid input.
 */
export function validateGraphicsData(
  graphicsData: string,
  t: (key: string) => string,
): void {
  if (!graphicsData) {
    throw new Error(t("errorGraphicsDataRequired"));
  }
  if (!graphicsData.startsWith("src/") && graphicsData !== "src") {
    throw new Error(t("errorGraphicsDataNotInSrc"));
  }
  if (isAbsolutePath(graphicsData)) {
    throw new Error(t("errorGraphicsDataAbsolutePath"));
  }
}

/**
 * Validates a {@link TileDefinition} object.
 * @throws `Error` with a translated message on invalid input.
 */
export function validateTileDefinition(
  tiles: TileDefinition,
  t: (key: string) => string,
): void {
  if (typeof tiles.tileWidth !== "number" || tiles.tileWidth <= 0) {
    throw new Error(t("errorTileWidthInvalid"));
  }
  if (typeof tiles.tileHeight !== "number" || tiles.tileHeight <= 0) {
    throw new Error(t("errorTileHeightInvalid"));
  }
  if (typeof tiles.count !== "number" || tiles.count < 0) {
    throw new Error(t("errorTileCountInvalid"));
  }
  if (!Array.isArray(tiles.names) || tiles.names.length !== tiles.count) {
    throw new Error(t("errorTileNamesMismatch"));
  }
  for (const name of tiles.names) {
    if (!name || typeof name !== "string") {
      throw new Error(t("errorTileNameEmpty"));
    }
  }
}

/**
 * Validates a {@link SpriteDefinition} object.
 * @throws `Error` with a translated message on invalid input.
 */
export function validateSpriteDefinition(
  sprite: SpriteDefinition,
  t: (key: string) => string,
): void {
  if (!sprite.name || typeof sprite.name !== "string") {
    throw new Error(t("errorSpriteNameRequired"));
  }
  if (typeof sprite.width !== "number" || sprite.width <= 0) {
    throw new Error(t("errorSpriteWidthInvalid"));
  }
  if (typeof sprite.height !== "number" || sprite.height <= 0) {
    throw new Error(t("errorSpriteHeightInvalid"));
  }
  if (!Array.isArray(sprite.frames)) {
    throw new Error(t("errorSpriteFramesInvalid"));
  }
  for (const frame of sprite.frames) {
    if (typeof frame.column !== "number" || frame.column < 0) {
      throw new Error(t("errorFrameColumnInvalid"));
    }
    if (typeof frame.row !== "number" || frame.row < 0) {
      throw new Error(t("errorFrameRowInvalid"));
    }
  }
}

// ─── Map builder ──────────────────────────────────────────────────────────

/**
 * Validates all form fields and builds the {/*@link GraphicsMapData} object.
 * The `selectedType` controls which definition block is included.
 *
 * @throws `Error` (translated) if any field is invalid.
 */
// export function buildGraphicsMapData(
//   source: string,
//   graphicsData: string,
//   selectedType: "tiles" | "sprites" | "",
//   tiles: TileDefinition,
//   sprites: SpriteDefinition[],
//   t: (key: string) => string,
// ): GraphicsMapData {
//   validateSource(source, t);
//   validateGraphicsData(graphicsData, t);

//   const mapData: GraphicsMapData = {
//     imageSourcePath: source,
//     graphicsTargetData: graphicsData,
//   };

//   if (selectedType === "tiles") {
//     validateTileDefinition(tiles, t);
//     mapData.tiles = {
//       count: tiles.count,
//       names: tiles.names.map((item) => item ?? ""),
//     };
//   }

//   if (selectedType === "sprites") {
//     for (const sprite of sprites) {
//       validateSpriteDefinition(sprite, t);
//     }
//     mapData.sprites = sprites.map((sprite) => ({
//       name: sprite.name ?? "",
//       width: sprite.width ?? 0,
//       height: sprite.height ?? 0,
//       frames: sprite.frames.map((f) => ({
//         column: f.column ?? 0,
//         row: f.row ?? 0,
//       })),
//     }));
//   }

//   return mapData;
// }
