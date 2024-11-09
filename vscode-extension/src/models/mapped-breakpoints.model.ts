import * as vscode from 'vscode';

/**
 * dictionary with mapped breakpoints, key is source breakpoint and value is .lis file breakpoint
 */
export class MappedBreakpointsModel {
  private readonly _mappedBreakpoints: [vscode.SourceBreakpoint | undefined, vscode.SourceBreakpoint | undefined][] = [];

  get mappedBreakpoints(): [vscode.SourceBreakpoint | undefined, vscode.SourceBreakpoint | undefined][] {
    return this._mappedBreakpoints;
  }

  addMappedBreakpoint(sourceBreakpoint: vscode.SourceBreakpoint | undefined, lisBreakpoint: vscode.SourceBreakpoint | undefined) {
    // Verifica si el sourceBreakpoint ya existe en el array
    const exists = this.mappedBreakpoints.some(([sb, lb]) => sb === sourceBreakpoint && lb === lisBreakpoint);
    if (!exists) {
      this.mappedBreakpoints.push([sourceBreakpoint, lisBreakpoint]);
    }
  }

  removeMappedBreakpoint(sourceBreakpoint: vscode.SourceBreakpoint | undefined, lisBreakpoint: vscode.SourceBreakpoint | undefined) {
    const index = this.mappedBreakpoints.findIndex(([sb, lb]) => sb === sourceBreakpoint && lb === lisBreakpoint);
    if (index !== -1) {
      this.mappedBreakpoints.splice(index, 1);
    }
  }

  removeSourceBreakpoints(sourceBreakpoints: vscode.SourceBreakpoint[]) {
    for (const breakpoint of sourceBreakpoints) {
      const index = this.mappedBreakpoints.findIndex(([sb, _]) => sb === breakpoint);
      if (index !== -1) {
        this.mappedBreakpoints[index][0] = undefined;
      }
    }
  }

  removeLisBreakpoints(lisBreakpoints: vscode.SourceBreakpoint[]) {
    for (const breakpoint of lisBreakpoints) {
      const index = this.mappedBreakpoints.findIndex(([_, lb]) => lb === breakpoint);
      if (index !== -1) {
        this.mappedBreakpoints[index][1] = undefined;
      }
    }
  }
}
