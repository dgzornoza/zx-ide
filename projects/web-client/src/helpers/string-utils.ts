/**
 * String transformation utilities for code-generation identifiers.
 */

/**
 * Converts a string into a valid C/ASM identifier.
 * Replaces any non-alphanumeric characters with underscores and lowercases.
 */
export function toCodeIdentifier(text: string): string {
  return text.toLowerCase().replaceAll(/[^a-z0-9]/g, '_');
}

/**
 * Converts a string into an UPPER_CASE macro guard name.
 * Replaces any non-alphanumeric characters with underscores.
 */
export function toMacroGuard(text: string): string {
  return text.toUpperCase().replaceAll(/[^A-Z0-9]/g, '_');
}
