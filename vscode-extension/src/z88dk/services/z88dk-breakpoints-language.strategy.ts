import { FileHelpers } from '@core/helpers/file-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import * as vscode from 'vscode';

export class BreakpointsLanguageFactory {
  static getInstance(breakpointPath: string): BreakpointsLanguageStrategy | undefined {
    const extension = breakpointPath.split('.').pop() || '';
    switch (extension) {
      case 'c':
        return new BreakpointsCLanguageStrategy();
      case 'asm':
        return new BreakpointsAsmLanguageStrategy();
      default:
        return undefined;
    }
  }
}

export abstract class BreakpointsLanguageStrategy {
  protected getBreakpointRelativeFilePath(breakpoint: vscode.SourceBreakpoint): string {
    let filePath: string = '';

    if (breakpoint.location.uri.path.indexOf(WorkspaceHelpers.workspacePath) === 0) {
      filePath = breakpoint.location.uri.path.substring(WorkspaceHelpers.workspacePath.length);
    }

    return filePath;
  }

  protected isValidLisFileLineForBreakpoint(lineText: string): boolean {
    // valid assembler line contains at least line number, opcode and operands
    const regex = /\b[0-9a-fA-F]+\b/g;
    const numberGroups = lineText.match(regex);
    return (numberGroups && numberGroups.length >= 2) ?? false;
  }

  protected createBreakpointFromLineNumber(sourcePath: string, lineNumber: number): vscode.SourceBreakpoint {
    const uri = vscode.Uri.file(sourcePath);
    const position = new vscode.Position(lineNumber, 0);
    const location = new vscode.Location(uri, position);
    return new vscode.SourceBreakpoint(location);
  }

  /**
   * Find source code breakpoints equivalents in .lis file
   * @param breakpoints source code breakpoints to find in .lis file
   * @param sourceFilePath breakpoint source code path
   * @param lisFilePath .lis file path
   * @returns breakpoint if found, undefined otherwise
   */
  abstract getMappedBreakpointsInLisFile(
    breakpoints: vscode.SourceBreakpoint[],
    sourceFilePath: string,
    lisFilePath: string
  ): Promise<[vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][]>;
}

export class BreakpointsCLanguageStrategy extends BreakpointsLanguageStrategy {
  async getMappedBreakpointsInLisFile(
    breakpoints: vscode.SourceBreakpoint[],
    _sourceFilePath: string,
    lisFilePath: string
  ): Promise<[vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][]> {
    // Remarks: For find 'c' breakpoint equivalent in .lis file, we need to find c label in .lis file
    // and check if next line is valid assembler code

    var result: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][] = [];
    const lisFileTextLines = await FileHelpers.readFileSplittedByNewLine(lisFilePath);

    for (const breakpoint of breakpoints) {
      const breakpointFilePath = this.getBreakpointRelativeFilePath(breakpoint);

      // c label in .lis file line is in base 0, so add 1 (label generated (ie: src/main.c:10:)
      const clabelInLisFile = `${breakpointFilePath}:${breakpoint.location.range.start.line + 1}:`;
      let lineNumber = FileHelpers.getLineNumberOfRegex(lisFileTextLines, new RegExp(clabelInLisFile));

      // find c label in lis file (in lis file only valid c comments are followed by assembler code, so add 1)
      lineNumber += 1;

      const mappedBreakpoint: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined] =
        lineNumber && this.isValidLisFileLineForBreakpoint(lisFileTextLines[lineNumber])
          ? [breakpoint, this.createBreakpointFromLineNumber(lisFilePath, lineNumber)]
          : [breakpoint, undefined];

      result.push(mappedBreakpoint);
    }

    return result;
  }
}

export class BreakpointsAsmLanguageStrategy extends BreakpointsLanguageStrategy {
  async getMappedBreakpointsInLisFile(
    breakpoints: vscode.SourceBreakpoint[],
    sourceFilePath: string,
    lisFilePath: string
  ): Promise<[vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][]> {
    // Remarks: For find 'asm' breakpoint equivalent in .lis file, we need to find assembler source code in .lis file, is same.
    var result: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][] = [];

    const lisFileTextLines = await FileHelpers.readFileSplittedByNewLine(lisFilePath);
    const sourceFileTextLines = await FileHelpers.readFileSplittedByNewLine(sourceFilePath);

    for (const breakpoint of breakpoints) {
      // get asm code from breakpoint (line is in base 0, so add 1)
      const asmLineText = sourceFileTextLines[breakpoint.location.range.start.line];

      const lineNumber = lisFileTextLines.findIndex((item) => item.includes(asmLineText));

      const mappedBreakpoint: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined] =
        lineNumber && this.isValidLisFileLineForBreakpoint(lisFileTextLines[lineNumber])
          ? [breakpoint, this.createBreakpointFromLineNumber(lisFilePath, lineNumber)]
          : [breakpoint, undefined];

      result.push(mappedBreakpoint);
    }

    return result;
  }
}
