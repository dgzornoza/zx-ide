/**
 * String transformation utilities for code-generation identifiers.
 */

/**
 * Converts a base filename (no extension) into a valid C/ASM identifier.
 * Replaces any non-alphanumeric characters with underscores and lowercases.
 */
export function toIdentifier(baseName: string): string {
  return baseName.toLowerCase().replaceAll(/[^a-z0-9]/g, "_");
}

/**
 * Converts a base filename to an UPPER_CASE macro guard name.
 */
export function toMacroGuard(baseName: string): string {
  return baseName.toUpperCase().replaceAll(/[^A-Z0-9]/g, "_");
}
