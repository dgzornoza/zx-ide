import { Disposable } from '@core/abstractions/disposable';
import * as vscode from 'vscode';

export class BreakpointService extends Disposable {
  constructor() {
    super();

    this._subscriptions.push(vscode.debug.onDidChangeBreakpoints(this.onBreakpointsChange));
  }

  private onBreakpointsChange(event: vscode.BreakpointsChangeEvent) {
    const { added, removed, changed } = event;
    if (added.length > 0) {
      for (const bp of added) {
        if (bp instanceof vscode.SourceBreakpoint) {
          const location = bp.location;
          vscode.window.showInformationMessage(`Breakpoint añadido en ${location.uri.fsPath}:${location.range.start.line}`);
        } else if (bp instanceof vscode.FunctionBreakpoint) {
          vscode.window.showInformationMessage(`Function breakpoint añadido en ${bp.functionName}`);
        }
      }
    }
    if (removed.length > 0) {
      for (const bp of removed) {
        if (bp instanceof vscode.SourceBreakpoint) {
          const location = bp.location;
          vscode.window.showInformationMessage(`Breakpoint eliminado de ${location.uri.fsPath}:${location.range.start.line}`);
        } else if (bp instanceof vscode.FunctionBreakpoint) {
          vscode.window.showInformationMessage(`Function breakpoint eliminado de ${bp.functionName}`);
        }
      }
    }
    if (changed.length > 0) {
      for (const bp of changed) {
        if (bp instanceof vscode.SourceBreakpoint) {
          const location = bp.location;
          vscode.window.showInformationMessage(`Breakpoint cambiado en ${location.uri.fsPath}:${location.range.start.line}`);
        } else if (bp instanceof vscode.FunctionBreakpoint) {
          vscode.window.showInformationMessage(`Function breakpoint cambiado en ${bp.functionName}`);
        }
      }
    }
  }
}
