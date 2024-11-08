import { Disposable } from '@core/abstractions/disposable';
import { BindThis } from '@core/decorators/bind-this.decorator';
import * as vscode from 'vscode';

const SOURCE_FILE_EXTENSIONS = ['c', 'asm'];

/**
 * Z88dk currently not generate debugger info, but is posible generate .lis file with assembler info and attach to DeZog debugger.
 * So, this service observes c nd asm files breackpoint and put it in the .lis file for debug in asssembler with c and asm source code comments.
 */
export class Z88dkBreakpointService extends Disposable {
  private lisFilePath?: string;
  private isDebugging = false;
  private workspacePath: string;

  constructor() {
    super();

    this._subscriptions.push(vscode.debug.onDidChangeBreakpoints(this.onBreakpointsChange));
    this._subscriptions.push(vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession));

    // workspace with slash at the end for optimice generate c label in lis file
    this.workspacePath = vscode.workspace.workspaceFolders![0].uri.path.replace(/\/?$/, '/');
  }

  @BindThis
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async onDidStartDebugSession(_session: vscode.DebugSession): Promise<void> {
    await this.clearBreakpointsInLisFile();

    const sourceBreakpoints = vscode.debug.breakpoints.filter((item) => item instanceof vscode.SourceBreakpoint);
    this.updateBreakpoints(sourceBreakpoints);

    this.isDebugging = true;
  }

  @BindThis
  private onBreakpointsChange(event: vscode.BreakpointsChangeEvent) {
    const { added, removed, changed } = event;
    if (added.length > 0) {
      const breakpoints = added.filter((bp) => bp instanceof vscode.SourceBreakpoint);
      this.updateBreakpoints(breakpoints);
    }
    if (removed.length > 0) {
      // TODO: falta cambiar la funcion 'addBreakpointsInLisFile' para que obtenga el breakpoint mapeado en lugar de añadirlo directamente
      //const breakpoints = removed.filter((bp) => bp instanceof vscode.SourceBreakpoint);
    }
    if (changed.length > 0) {
      // TODO: falta implementar ¿el que se cambia es el antiguo o el nuevo?
      //const breakpoints = changed.filter((bp) => bp instanceof vscode.SourceBreakpoint);
    }
  }

  /**
   * Update valid breakpoints in .lis file and remove invalid breakpoints from source files.
   * @param breakpoints list of source code breakpoints
   */
  private async updateBreakpoints(breakpoints: vscode.SourceBreakpoint[]): Promise<void> {
    const invalidBreakpoints = await this.addBreakpointsInLisFile(breakpoints);

    if (invalidBreakpoints.length > 0) {
      vscode.debug.removeBreakpoints(invalidBreakpoints);
    }
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

  /**
   * Add breakpoints in .lis file for debug in assembler.
   * @param breakpoints source code breakpoint to add in .lis file
   * @returns invalid breakpoints (not added in .lis file)
   */
  private async addBreakpointsInLisFile(breakpoints: vscode.SourceBreakpoint[]): Promise<vscode.SourceBreakpoint[]> {
    const invalidBreakpoints: vscode.SourceBreakpoint[] = [];

    try {
      const lisFilePath = await this.getLisFilePath();
      if (!lisFilePath) return invalidBreakpoints;

      const lisFile = await vscode.workspace.openTextDocument(lisFilePath);
      const lisFileContent = lisFile.getText();

      const lisFileBreakpoints: vscode.SourceBreakpoint[] = [];
      for (const breakpoint of breakpoints) {
        const isSourceFile = SOURCE_FILE_EXTENSIONS.includes(breakpoint.location.uri.fsPath.split('.').pop() || '');
        if (!isSourceFile) continue;

        let isValidBreakpoint = false;

        // find c label in lis file
        const cLabel = this.generateLisFileCLabel(breakpoint);
        const index = lisFileContent.indexOf(cLabel);
        if (index !== -1) {
          const cLabelLine = lisFile.positionAt(index).line;

          // in lis file only valid c comments are followed by assembler code
          const breakpointLine = lisFile.lineAt(cLabelLine + 1);
          if (this.isValidLineForBreakpoint(breakpointLine.text)) {
            lisFileBreakpoints.push(new vscode.SourceBreakpoint(new vscode.Location(lisFile.uri, breakpointLine.range.start)));
            isValidBreakpoint = true;
          }
        }

        if (!isValidBreakpoint) {
          invalidBreakpoints.push(breakpoint);
        }
      }

      vscode.debug.addBreakpoints(lisFileBreakpoints);
    } catch (error) {
      vscode.window.showErrorMessage(`Error on read .lis file: ${error}`);
    }

    return invalidBreakpoints;
  }

  private isValidLineForBreakpoint(lineText: string): boolean {
    // valid assembler line contains at least line number, opcode and operands
    const regex = /\b[0-9a-fA-F]+\b/g;
    const numberGroups = lineText.match(regex);
    return (numberGroups && numberGroups.length >= 2) ?? false;
  }
}
