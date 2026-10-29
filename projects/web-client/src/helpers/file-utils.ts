/**
 * Returns the basename (last path segment) of a forward-slash separated path.
 * If the path has no separators the input is returned unchanged so callers
 * can pass either a directory entry or a bare file name without branching.
 */
export function basenameFromPath(path: string): string {
  return path.split('/').at(-1) ?? path;
}

/**
 * Returns the lower-cased extension of a path, including the leading dot
 * (e.g. `.png`, `.zxp`). Returns the empty string when the path has no
 * extension. The path is treated as a forward-slash separated workspace path
 * and the basename is derived via {@link basenameFromPath}.
 */
export function getFileExtension(path: string): string {
  const basename = basenameFromPath(path);
  const dotIndex = basename.lastIndexOf('.');
  return dotIndex >= 0 ? basename.slice(dotIndex).toLowerCase() : '';
}

/**
 * Returns the directory portion of a forward-slash separated path, i.e.
 * everything before the last separator. Returns the empty string when the
 * path has no separators (a bare file name) so callers can concatenate it
 * with a leading slash only when there is a directory to keep.
 *
 * Examples:
 *   dirNameOfPath("hud/hud-tiles.zxp") === "hud"
 *   dirNameOfPath("hud-tiles.zxp")    === ""
 *   dirNameOfPath("a/b/c.png")        === "a/b"
 */
export function dirNameOfPath(path: string): string {
  const slashIndex = path.lastIndexOf('/');
  return slashIndex >= 0 ? path.slice(0, slashIndex) : '';
}
