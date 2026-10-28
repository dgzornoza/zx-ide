/**
 * Pure helpers over the lines of a z88dk `.lis` listing file.
 *
 * Depends on nothing but the standard library so the extension test host can
 * load it directly.
 */

/**
 * `true` when `lineText` is an assembled `.lis` line (at least the line number
 * and the address/opcode columns), so a breakpoint can be placed on it.
 */
export function isValidLisFileLineForBreakpoint(lineText: string | undefined): boolean {
  if (lineText === undefined) {
    return false;
  }
  const numberGroups = lineText.match(/\b[0-9a-fA-F]+\b/g);
  return numberGroups !== null && numberGroups.length >= 2;
}

/**
 * Index of the first `.lis` line that contains `asmLineText`, or `undefined`
 * when the source line is blank, missing or not in the listing.
 */
export function findAsmLineInLisFile(lisFileLines: string[], asmLineText: string | undefined): number | undefined {
  const searchedText = asmLineText?.trim();
  if (!searchedText) {
    return undefined;
  }
  const lineIndex = lisFileLines.findIndex((line) => line.includes(searchedText));
  return lineIndex === -1 ? undefined : lineIndex;
}
