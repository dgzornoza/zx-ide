import { FileHelpers } from '@core/helpers/file-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import * as vscode from 'vscode';
import {
  findAsmBreakpointLineInLisFile,
  findCBreakpointLineInLisFile,
  getBreakpointLanguage,
  getWorkspaceRelativePath,
} from '@z88dk/domain/breakpoint-mapping';

export class BreakpointsLanguageFactory {
  static getInstance(breakpointPath: string): BreakpointsLanguageStrategy | undefined {
    switch (getBreakpointLanguage(breakpointPath)) {
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
  protected async getBreakpointRelativeFilePath(breakpoint: vscode.SourceBreakpoint): Promise<string> {
    return getWorkspaceRelativePath(await WorkspaceHelpers.getWorkspacePath(), breakpoint.location.uri.path);
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

    const result: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][] = [];
    const lisFileTextLines = await FileHelpers.readFileSplittedByNewLine(lisFilePath);

    for (const breakpoint of breakpoints) {
      const breakpointFilePath = await this.getBreakpointRelativeFilePath(breakpoint);

      const lineNumber = findCBreakpointLineInLisFile(lisFileTextLines, breakpointFilePath, breakpoint.location.range.start.line);

      const mappedBreakpoint: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined] =
        lineNumber !== undefined ? [breakpoint, this.createBreakpointFromLineNumber(lisFilePath, lineNumber)] : [breakpoint, undefined];

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
    const result: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][] = [];

    const lisFileTextLines = await FileHelpers.readFileSplittedByNewLine(lisFilePath);
    const sourceFileTextLines = await FileHelpers.readFileSplittedByNewLine(sourceFilePath);

    for (const breakpoint of breakpoints) {
      const lineNumber = findAsmBreakpointLineInLisFile(lisFileTextLines, sourceFileTextLines, breakpoint.location.range.start.line);

      const mappedBreakpoint: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined] =
        lineNumber !== undefined ? [breakpoint, this.createBreakpointFromLineNumber(lisFilePath, lineNumber)] : [breakpoint, undefined];

      result.push(mappedBreakpoint);
    }

    return result;
  }
}
