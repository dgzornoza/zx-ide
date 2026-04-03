/**
 * String transformation utilities for code-generation identifiers.
 */

/**
 * Converts a string into a valid C/ASM identifier.
 * Replaces any non-alphanumeric characters with underscores and lowercases.
 */
export function toCodeIdentifier(str: string): string {
  return str.toLowerCase().replaceAll(/[^a-z0-9]/g, "_");
}

/**
 * Converts a string into an UPPER_CASE macro guard name.
 * Replaces any non-alphanumeric characters with underscores.
 */
export function toMacroGuard(str: string): string {
  return str.toUpperCase().replaceAll(/[^A-Z0-9]/g, "_");
}
