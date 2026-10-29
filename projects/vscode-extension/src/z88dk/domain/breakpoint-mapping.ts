/**
 * Pure logic that maps C / asm source breakpoints to lines of the z88dk `.lis` listing.
 *
 * Depends on nothing but the standard library; `Z88dkAsmBreakpointService` and the language strategies
 * read the files and create the `vscode` breakpoints.
 */
import { SOURCE_FILE_EXTENSIONS } from '@z88dk/infrastructure';
import { findAsmLineInLisFile, isValidLisFileLineForBreakpoint } from './lis-file-lines';

export type BreakpointLanguage = 'c' | 'asm';

/** What `Z88dkAsmBreakpointService` does with one mapped breakpoint pair. */
export type MappedBreakpointAction = 'add-lis-breakpoint' | 'remove-source-breakpoint' | 'remove-lis-breakpoint' | 'none';

export interface MappedBreakpointState {
  hasSourceBreakpoint: boolean;
  hasLisBreakpoint: boolean;
  /** The `.lis` breakpoint is already registered in vscode. */
  isLisBreakpointRegistered: boolean;
}

function getFileExtension(filePath: string): string {
  return filePath.split('.').pop() || '';
}

/** `true` for the files whose breakpoints are mapped to the `.lis` file (`.c`, `.h`, `.asm`). */
export function isBreakpointSourceFile(filePath: string): boolean {
  return SOURCE_FILE_EXTENSIONS.includes(getFileExtension(filePath));
}

/** Language strategy for the breakpoints of `filePath`, or `undefined` when its breakpoints cannot be mapped. */
export function getBreakpointLanguage(filePath: string): BreakpointLanguage | undefined {
  const extension = getFileExtension(filePath);
  return extension === 'c' || extension === 'asm' ? extension : undefined;
}

/** `filePath` without the `workspacePath` prefix, or an empty path when the file is outside the workspace. */
export function getWorkspaceRelativePath(workspacePath: string, filePath: string): string {
  return filePath.startsWith(workspacePath) ? filePath.substring(workspacePath.length) : '';
}

/**
 * `.lis` line of a C breakpoint: the line after the `<file>:<line>:` label z88dk writes for the C source line,
 * when that line holds assembled code. `sourceLine` is 0-based, the label is 1-based.
 */
export function findCBreakpointLineInLisFile(lisFileLines: string[], relativeSourcePath: string, sourceLine: number): number | undefined {
  const cLabelInLisFile = new RegExp(`${relativeSourcePath}:${sourceLine + 1}:`);
  const labelLineNumber = lisFileLines.findIndex((line) => cLabelInLisFile.test(line.trim()));
  if (labelLineNumber === -1) {
    return undefined;
  }

  // in the .lis file only C comments of valid lines are followed by assembled code
  const lineNumber = labelLineNumber + 1;
  return isValidLisFileLineForBreakpoint(lisFileLines[lineNumber]) ? lineNumber : undefined;
}

/** `.lis` line of an asm breakpoint: the first assembled listing line with the same instruction. `sourceLine` is 0-based. */
export function findAsmBreakpointLineInLisFile(lisFileLines: string[], sourceFileLines: string[], sourceLine: number): number | undefined {
  const lineNumber = findAsmLineInLisFile(lisFileLines, sourceFileLines[sourceLine]);
  return lineNumber !== undefined && isValidLisFileLineForBreakpoint(lisFileLines[lineNumber]) ? lineNumber : undefined;
}

/**
 * - source and `.lis` breakpoint: add the `.lis` breakpoint once (valid breakpoint)
 * - source breakpoint without `.lis` line: remove the source breakpoint (invalid location)
 * - `.lis` breakpoint without source: remove the `.lis` breakpoint (removed from the source file)
 */
export function getMappedBreakpointAction(state: MappedBreakpointState): MappedBreakpointAction {
  if (state.hasSourceBreakpoint && state.hasLisBreakpoint) {
    return state.isLisBreakpointRegistered ? 'none' : 'add-lis-breakpoint';
  }
  if (state.hasSourceBreakpoint) {
    return 'remove-source-breakpoint';
  }
  if (state.hasLisBreakpoint) {
    return 'remove-lis-breakpoint';
  }
  return 'none';
}
