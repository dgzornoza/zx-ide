import { Disposable } from '@core/abstractions/disposable';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { getMappedBreakpointAction, isBreakpointSourceFile } from '@z88dk/domain/breakpoint-mapping';
import { BUILD_DIRECTORY } from '@z88dk/infrastructure';
import { MappedBreakpointsModel } from '@z88dk/models/mapped-breakpoints.model';
import { OwnBreakpointChanges } from '@z88dk/models/own-breakpoint-changes';
import { BreakpointsLanguageFactory } from '@z88dk/services/z88dk-asm-breakpoints-language.strategy';
import { injectable } from 'inversify';
import * as path from 'node:path';
import * as vscode from 'vscode';

/**
 * This service provides the ability to debug C code at the assembly level using .lis files, which contain comments with the original C code.
 * The service will only be active if the useAsmDebug configuration property is enabled.
 *
 * NOTE: When this service is enabled, standard C‑level debugging will be disabled, and only assembly‑level debugging (with the embedded C‑code comments) will be available.
 * So, this service observes c nd asm files breackpoint and put it in the .lis file for debug in asssembler with c and asm source code comments.
 */
@injectable()
export class Z88dkAsmBreakpointService extends Disposable {
  private lisFilePath?: string;
  // breakpoints added/removed by this service; their change events are ignored
  private readonly ownBreakpointChanges = new OwnBreakpointChanges();
  // debug listeners, registered only while the service is enabled
  private debugSubscriptions: vscode.Disposable[] = [];

  // dictionary with mapped breakpoints, key is source breakpoint and value is .lis file breakpoint
  private readonly mappedBreakpoints = new MappedBreakpointsModel();
  private isDebugging = false;

  constructor() {
    super();
  }

  /** Starts listening to debug sessions and breakpoint changes. Calling it again while enabled does nothing. */
  enable(): void {
    if (this.debugSubscriptions.length > 0) {
      return;
    }
    this.debugSubscriptions = [
      vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession),
      vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession),
      vscode.debug.onDidChangeBreakpoints(this.onBreakpointsChange),
    ];
  }

  /** Stops listening and forgets the mapped breakpoints. Calling it again while disabled does nothing. */
  disable(): void {
    this.mappedBreakpoints.clear();
    this.ownBreakpointChanges.clear();
    this.debugSubscriptions.splice(0).forEach((subscription) => subscription.dispose());
  }

  public override dispose(): void {
    this.disable();
    super.dispose();
  }

  @BindThis
  private async onDidStartDebugSession(_event: vscode.DebugSession): Promise<void> {
    this.isDebugging = true;

    // only clear mapped breakpoints, lis file is recreated on build and not required to clear
    this.mappedBreakpoints.clear();

    const sourceBreakpoints = vscode.debug.breakpoints.filter((item) => item instanceof vscode.SourceBreakpoint);
    await this.mapSourceBreakpointsToLisFileBreakpoints(sourceBreakpoints);
    this.updateMappedBreakpointsInFiles();
  }

  @BindThis
  private onDidTerminateDebugSession(_event: vscode.DebugSession): void {
    this.isDebugging = false;
  }

  @BindThis
  private async onBreakpointsChange(event: vscode.BreakpointsChangeEvent): Promise<void> {
    if (!this.isDebugging) return;

    const added = this.ownBreakpointChanges.takeExternal(event.added);
    const removed = this.ownBreakpointChanges.takeExternal(event.removed);
    const { changed } = event;
    // skip only events that carry nothing but the service's own changes
    if (added.length === 0 && removed.length === 0 && changed.length === 0) return;

    if (added.length > 0) {
      const breakpoints = added.filter((breakpoint) => breakpoint instanceof vscode.SourceBreakpoint);
      await this.mapSourceBreakpointsToLisFileBreakpoints(breakpoints);
    }
    if (removed.length > 0) {
      const breakpoints = removed.filter((breakpoint) => breakpoint instanceof vscode.SourceBreakpoint);
      // only remove source breakpoints (lis breakpoints will be removed on updateMappedBreakpointsInFiles)
      this.mappedBreakpoints.removeSourceBreakpoints(breakpoints);
    }
    if (changed.length > 0) {
      // Currently it is not necessary, if the code is modified it has to be recompiled and the debug restarted.
    }

    this.updateMappedBreakpointsInFiles();
  }

  /** Applies each mapped breakpoint pair to vscode (see `getMappedBreakpointAction`). */
  private updateMappedBreakpointsInFiles(): void {
    // iterate a copy: invalid and removed entries are deleted from the model while looping
    for (const [sourceBreakpoint, lisBreakpoint] of [...this.mappedBreakpoints.mappedBreakpoints]) {
      const action = getMappedBreakpointAction({
        hasSourceBreakpoint: sourceBreakpoint !== undefined,
        hasLisBreakpoint: lisBreakpoint !== undefined,
        isLisBreakpointRegistered: lisBreakpoint !== undefined && vscode.debug.breakpoints.includes(lisBreakpoint),
      });

      if (action === 'add-lis-breakpoint' && lisBreakpoint) {
        this.changeBreakpoint('add', lisBreakpoint);
      } else if (action === 'remove-source-breakpoint' && sourceBreakpoint) {
        this.changeBreakpoint('remove', sourceBreakpoint);
        this.mappedBreakpoints.removeMappedBreakpoint(sourceBreakpoint, lisBreakpoint);
      } else if (action === 'remove-lis-breakpoint' && lisBreakpoint) {
        this.changeBreakpoint('remove', lisBreakpoint);
        this.mappedBreakpoints.removeMappedBreakpoint(sourceBreakpoint, lisBreakpoint);
      }
    }
  }

  /** Adds or removes `breakpoint` in vscode, recording it so the resulting change event is ignored. */
  private changeBreakpoint(action: 'add' | 'remove', breakpoint: vscode.SourceBreakpoint): void {
    this.ownBreakpointChanges.track([breakpoint]);
    if (action === 'add') {
      vscode.debug.addBreakpoints([breakpoint]);
    } else {
      vscode.debug.removeBreakpoints([breakpoint]);
    }
  }

  private async getLisFilePath(): Promise<string> {
    if (!this.lisFilePath) {
      const projectName = path.basename(await WorkspaceHelpers.getWorkspacePath());
      this.lisFilePath = (await WorkspaceHelpers.getWorkspaceUri(BUILD_DIRECTORY, `${projectName}.source.lis`)).fsPath;
    }

    return this.lisFilePath;
  }

  /**
   * Function to map source breakpoints to .lis file breakpoints, if breakpoint is invalid, mapped to undefined.
   * @param breakpoints List of source breakpoints
   */
  private async mapSourceBreakpointsToLisFileBreakpoints(breakpoints: vscode.SourceBreakpoint[]): Promise<void> {
    const lisFilePath = await this.getLisFilePath();

    const groupedBreakpoints = breakpoints
      .filter((item) => isBreakpointSourceFile(item.location.uri.fsPath))
      .groupBy((item) => item.location.uri.fsPath);

    for (const breakpointsPath in groupedBreakpoints) {
      if (!Object.hasOwn(groupedBreakpoints, breakpointsPath)) continue;

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
