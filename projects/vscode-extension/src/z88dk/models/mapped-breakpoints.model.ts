import * as vscode from 'vscode';

/**
 * dictionary with mapped breakpoints, key is source breakpoint and value is .lis file breakpoint
 */
export class MappedBreakpointsModel {
  private readonly _mappedBreakpoints: [vscode.SourceBreakpoint | undefined, vscode.SourceBreakpoint | undefined][] = [];

  get mappedBreakpoints(): [vscode.SourceBreakpoint | undefined, vscode.SourceBreakpoint | undefined][] {
    return this._mappedBreakpoints;
  }

  addMappedBreakpoints(breakpoints: [vscode.SourceBreakpoint, vscode.SourceBreakpoint | undefined][]) {
    for (const [sourceBreakpoint, lisBreakpoint] of breakpoints) {
      this.addMappedBreakpoint(sourceBreakpoint, lisBreakpoint);
    }
  }

  addMappedBreakpoint(sourceBreakpoint: vscode.SourceBreakpoint, lisBreakpoint: vscode.SourceBreakpoint | undefined) {
    const exists = this._mappedBreakpoints.some(([sb, lb]) => sb === sourceBreakpoint && lb === lisBreakpoint);
    if (!exists) {
      this._mappedBreakpoints.push([sourceBreakpoint, lisBreakpoint]);
    }
  }

  removeMappedBreakpoint(sourceBreakpoint: vscode.SourceBreakpoint | undefined, lisBreakpoint: vscode.SourceBreakpoint | undefined) {
    const index = this._mappedBreakpoints.findIndex(([sb, lb]) => sb === sourceBreakpoint && lb === lisBreakpoint);
    if (index !== -1) {
      this._mappedBreakpoints.splice(index, 1);
    }
  }

  removeSourceBreakpoints(sourceBreakpoints: vscode.SourceBreakpoint[]) {
    for (const breakpoint of sourceBreakpoints) {
      const index = this._mappedBreakpoints.findIndex(([sb, _]) => sb === breakpoint);
      if (index !== -1) {
        this._mappedBreakpoints[index][0] = undefined;
      }
    }
  }

  clear() {
    this._mappedBreakpoints.length = 0;
  }
}
