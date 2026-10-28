import type * as vscode from 'vscode';

/**
 * Breakpoints the extension added or removed itself.
 *
 * `vscode.debug.addBreakpoints` / `removeBreakpoints` fire
 * `onDidChangeBreakpoints` asynchronously, after the call returns, so a
 * synchronous "updating" flag cannot tell those events apart from the user's.
 * Tracking the changed breakpoints lets the listener drop exactly its own
 * changes.
 */
export class OwnBreakpointChanges {
  private readonly breakpoints = new Set<vscode.Breakpoint>();

  /** Records breakpoints about to be added or removed by the extension. */
  track(breakpoints: readonly vscode.Breakpoint[]): void {
    breakpoints.forEach((breakpoint) => this.breakpoints.add(breakpoint));
  }

  /** Returns the breakpoints not changed by the extension and forgets the tracked ones it consumed. */
  takeExternal<TBreakpoint extends vscode.Breakpoint>(breakpoints: readonly TBreakpoint[]): TBreakpoint[] {
    return breakpoints.filter((breakpoint) => !this.breakpoints.delete(breakpoint));
  }

  clear(): void {
    this.breakpoints.clear();
  }
}
