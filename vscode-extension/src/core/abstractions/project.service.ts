import { Disposable } from '@core/abstractions/disposable';
import * as vscode from 'vscode';

export abstract class ProjectService extends Disposable {
  constructor(protected context: vscode.ExtensionContext) {
    super();
  }
}
