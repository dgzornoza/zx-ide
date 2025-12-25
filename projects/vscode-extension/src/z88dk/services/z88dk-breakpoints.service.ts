import { Disposable } from '@core/abstractions/disposable';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { BUILD_DIRECTORY, SOURCE_FILE_EXTENSIONS } from '@z88dk/infrastructure';
import { MappedBreakpointsModel } from '@z88dk/models/mapped-breakpoints.model';
import { BreakpointsLanguageFactory } from '@z88dk/services/z88dk-breakpoints-language.strategy';
import { injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Z88dk currently not generate debugger info, but is posible generate .lis file with assembler info and attach to DeZog debugger.
 * So, this service observes c nd asm files breackpoint and put it in the .lis file for debug in asssembler with c and asm source code comments.
 */
@injectable()
export class Z88dkBreakpointService extends Disposable {
  private lisFilePath?: string;
  private isUpdatingBreakpoints = false;

  // dictionary with mapped breakpoints, key is source breakpoint and value is .lis file breakpoint
  private mappedBreakpoints = new MappedBreakpointsModel();
  private isDebugging = false;

  constructor() {
    super();

    this._subscriptions.push(vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession));
    this._subscriptions.push(vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession));
    this._subscriptions.push(vscode.debug.onDidChangeBreakpoints(this.onBreakpointsChange));
  }

  @BindThis
  private async onDidStartDebugSession(_event: vscode.DebugSession): Promise<void> {
    this.isDebugging = true;

    // only clear mapped breakpoints, lis file is recreated on build and not required to clear
    this.mappedBreakpoints.clear();

    const sourceBreakpoints = vscode.debug.breakpoints.filter((item) => item instanceof vscode.SourceBreakpoint);
    await this.mapSourceBreakpointsToLisFileBreakpoints(sourceBreakpoints);
    await this.updateMappedBreakpointsInFiles();
  }

  @BindThis
  private async onDidTerminateDebugSession(_event: vscode.DebugSession): Promise<void> {
    this.isDebugging = false;
  }

  @BindThis
  private async onBreakpointsChange(event: vscode.BreakpointsChangeEvent): Promise<void> {
    if (!this.isDebugging || this.isUpdatingBreakpoints) return;

    const { added, removed, changed } = event;
    if (added.length > 0) {
      const breakpoints = added.filter((bp) => bp instanceof vscode.SourceBreakpoint);
      await this.mapSourceBreakpointsToLisFileBreakpoints(breakpoints);
    }
    if (removed.length > 0) {
      const breakpoints = removed.filter((bp) => bp instanceof vscode.SourceBreakpoint);
      // only remove source breakpoints (lis breakpoints will be removed on updateMappedBreakpointsInFiles)
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

  private getLisFilePath(): string {
    if (!this.lisFilePath) {
      const projectName = path.basename(WorkspaceHelpers.workspacePath);
      this.lisFilePath = WorkspaceHelpers.getWorkspaceUri(BUILD_DIRECTORY, `${projectName}.source.lis`).fsPath;
    }

    return this.lisFilePath;
  }

  private isBreakpointInSourceFile(breakpoint: vscode.SourceBreakpoint): boolean {
    return SOURCE_FILE_EXTENSIONS.includes(this.getBreakpointFileExtension(breakpoint));
  }

  private getBreakpointFileExtension(breakpoint: vscode.SourceBreakpoint): string {
    return breakpoint.location.uri.fsPath.split('.').pop() || '';
  }

  /**
   * Function to map source breakpoints to .lis file breakpoints, if breakpoint is invalid, mapped to undefined.
   * @param breakpoints List of source breakpoints
   */
  private async mapSourceBreakpointsToLisFileBreakpoints(breakpoints: vscode.SourceBreakpoint[]): Promise<void> {
    const lisFilePath = this.getLisFilePath();

    const groupedBreakpoints = breakpoints
      .filter((item) => this.isBreakpointInSourceFile(item))
      .groupBy((item) => item.location.uri.fsPath);

    for (const breakpointsPath in groupedBreakpoints) {
      if (!groupedBreakpoints.hasOwnProperty(breakpointsPath)) continue;

      const languageStrategy = BreakpointsLanguageFactory.getInstance(breakpointsPath);
      if (languageStrategy) {
        const breakpoints = await languageStrategy.getMappedBreakpointsInLisFile(
          groupedBreakpoints[breakpointsPath],
          breakpointsPath,
          lisFilePath
        );

        this.mappedBreakpoints.addMappedBreakpoints(breakpoints);
      }
    }
  }
}
