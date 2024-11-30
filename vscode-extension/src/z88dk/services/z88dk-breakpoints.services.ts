import { Disposable } from '@core/abstractions/disposable';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { MappedBreakpointsModel } from '@z88dk/models/mapped-breakpoints.model';
import * as vscode from 'vscode';

const SOURCE_FILE_EXTENSIONS = ['c', 'asm'];

/**
 * Z88dk currently not generate debugger info, but is posible generate .lis file with assembler info and attach to DeZog debugger.
 * So, this service observes c nd asm files breackpoint and put it in the .lis file for debug in asssembler with c and asm source code comments.
 */
export class Z88dkBreakpointService extends Disposable {
  private lisFilePath?: string;
  private workspacePath: string;
  private isUpdatingBreakpoints = false;

  // dictionary with mapped breakpoints, key is source breakpoint and value is .lis file breakpoint
  private mappedBreakpoints = new MappedBreakpointsModel();

  constructor() {
    super();

    this._subscriptions.push(vscode.debug.onDidChangeBreakpoints(this.onBreakpointsChange));
    this._subscriptions.push(vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession));

    // workspace with slash at the end for optimice generate c label in lis file
    this.workspacePath = vscode.workspace.workspaceFolders![0].uri.path.replace(/\/?$/, '/');
  }

  @BindThis
  private async onDidStartDebugSession(_session: vscode.DebugSession): Promise<void> {
    await this.clearBreakpointsInLisFile();

    const sourceBreakpoints = vscode.debug.breakpoints.filter((item) => item instanceof vscode.SourceBreakpoint);
    await this.mapSourceBreakpointsToLisFileBreakpoints(sourceBreakpoints);
    await this.updateMappedBreakpointsInFiles();
  }

  @BindThis
  private async onBreakpointsChange(event: vscode.BreakpointsChangeEvent): Promise<void> {
    if (this.isUpdatingBreakpoints) return;

    const { added, removed, changed } = event;
    if (added.length > 0) {
      const breakpoints = added.filter((bp) => bp instanceof vscode.SourceBreakpoint);
      await this.mapSourceBreakpointsToLisFileBreakpoints(breakpoints);
    }
    if (removed.length > 0) {
      const breakpoints = removed.filter((bp) => bp instanceof vscode.SourceBreakpoint);
      this.mappedBreakpoints.removeSourceBreakpoints(breakpoints);
    }
    if (changed.length > 0) {
      // Currently it is not necessary, if the code is modified it has to be recompiled and the debug restarted.
    }

    this.updateMappedBreakpointsInFiles();
  }

  /**
   * update mapped breakpoints in files:
   * - if has source and lis mapped breakpoint, add source breakpoint to lis file. (valid breakpoint)
   * - if not has lis mapped breakpoint, remove from source file and remove from mapped breakpoints (invalid breakpoint location in source file)
   * - if not has source mapped breakpoint, remove from lis file and remove from mapped breakpoints (removed breakpoint from source file)
   * @param breakpoints list of source code breakpoints
   */
  private async updateMappedBreakpointsInFiles(): Promise<void> {
    this.isUpdatingBreakpoints = true;

    for (const [sourceBreakpoint, lisBreakpoint] of this.mappedBreakpoints.mappedBreakpoints) {
      // valid breakpoint
      if (sourceBreakpoint && lisBreakpoint) {
        vscode.debug.addBreakpoints([lisBreakpoint]);

        // invalid breakpoint location in source file
      } else if (sourceBreakpoint && !lisBreakpoint) {
        vscode.debug.removeBreakpoints([sourceBreakpoint]);
        this.mappedBreakpoints.removeMappedBreakpoint(sourceBreakpoint, lisBreakpoint);

        // removed breakpoint from source file
      } else if (!sourceBreakpoint && lisBreakpoint) {
        vscode.debug.removeBreakpoints([lisBreakpoint]);
        this.mappedBreakpoints.removeMappedBreakpoint(sourceBreakpoint, lisBreakpoint);
      }
    }

    this.isUpdatingBreakpoints = false;
  }

  private async clearBreakpointsInLisFile(): Promise<void> {
    const lisFilePath = await this.getLisFilePath();

    for (const breakpoint of vscode.debug.breakpoints) {
      if (breakpoint instanceof vscode.SourceBreakpoint && breakpoint.location.uri.fsPath === lisFilePath) {
        vscode.debug.removeBreakpoints([breakpoint]);
      }
    }
  }

  private async getLisFilePath(): Promise<string | undefined> {
    if (!this.lisFilePath) {
      const files = await vscode.workspace.findFiles('src/*.lis');
      this.lisFilePath = files[0].fsPath;
    }

    return this.lisFilePath;
  }

  private isBreakpointInSourceFile(breakpoint: vscode.SourceBreakpoint): boolean {
    return SOURCE_FILE_EXTENSIONS.includes(breakpoint.location.uri.fsPath.split('.').pop() || '');
  }

  /**
   * Generate label similar to the one in the .lis file for c comments.
   * @param breakpoint breakpoint to generate label
   * @returns label generated (ie: ;src/main.c:10:)
   */
  private generateLisFileCLabel(breakpoint: vscode.SourceBreakpoint): string {
    let filePath: string = '';

    if (breakpoint.location.uri.path.indexOf(this.workspacePath) === 0) {
      filePath = breakpoint.location.uri.path.substring(this.workspacePath.length);
    }

    // line is in base 0, so add 1
    return `;${filePath}:${breakpoint.location.range.start.line + 1}:`;
  }

  private async openLisFile(): Promise<vscode.TextDocument | undefined> {
    const lisFilePath = await this.getLisFilePath();
    if (lisFilePath) {
      return await vscode.workspace.openTextDocument(lisFilePath);
    }

    vscode.window.showErrorMessage(`Lis file not found`);
    return undefined;
  }

  /**
   * Function to map source breakpoints to .lis file breakpoints, if breakpoint is invalid, mapped to undefined.
   * @param breakpoints List of source breakpoints
   */
  private async mapSourceBreakpointsToLisFileBreakpoints(breakpoints: vscode.SourceBreakpoint[]): Promise<void> {
    const lisFile: vscode.TextDocument | undefined = await this.openLisFile();
    if (!lisFile) return;

    const lisFileContent = lisFile.getText();

    for (const breakpoint of breakpoints) {
      if (!this.isBreakpointInSourceFile(breakpoint)) continue;

      let lisFileBreakpoint: vscode.SourceBreakpoint | undefined;

      // find c label in lis file
      const cLabel = this.generateLisFileCLabel(breakpoint);
      const index = lisFileContent.indexOf(cLabel);
      if (index !== -1) {
        const cLabelLine = lisFile.positionAt(index).line;

        // in lis file only valid c comments are followed by assembler code
        const breakpointLine = lisFile.lineAt(cLabelLine + 1);
        if (this.isValidLineForBreakpoint(breakpointLine.text)) {
          lisFileBreakpoint = new vscode.SourceBreakpoint(new vscode.Location(lisFile.uri, breakpointLine.range.start));
        }
      }

      this.mappedBreakpoints.addMappedBreakpoint(breakpoint, lisFileBreakpoint);
    }
  }

  private isValidLineForBreakpoint(lineText: string): boolean {
    // valid assembler line contains at least line number, opcode and operands
    const regex = /\b[0-9a-fA-F]+\b/g;
    const numberGroups = lineText.match(regex);
    return (numberGroups && numberGroups.length >= 2) ?? false;
  }
}
