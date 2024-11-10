import { Disposable } from '@core/abstractions/disposable';
import { injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class ProjectService extends Disposable {
  constructor() {
    super();

    this._subscriptions.push(vscode.tasks.onDidEndTaskProcess(this.onDidEndTaskProcess));

    void this.tryOpenReadmeFile();
  }

  async tryOpenReadmeFile(): Promise<void> {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'readme.md');

      try {
        // Open in editor preview mode
        await vscode.commands.executeCommand('markdown.showPreview', filePath);
      } catch (error) {
        console.error('can not open readme.md file', error);
      }
    }
  }

  private onDidEndTaskProcess(event: vscode.TaskProcessEndEvent): void {
    if (event.execution.task.name === 'Compile') {
      // Obtener el terminal activo
      const terminal = vscode.window.activeTerminal;
      // if (terminal) {
      //   // Enviar una línea al terminal
      //   terminal.sendText('echo La tarea de compilación ha finalizado.');
      //   terminal.sendText('asfdasfdasdf', false);
      //   terminal.sendText('asfdasfdasdf', false);
      // } else {
      // Crear un nuevo terminal si no hay uno activo
      // const newTerminal = vscode.window.createTerminal('Build Terminal');
      // newTerminal.show();
      // newTerminal.sendText('echo La tarea de compilación ha finalizado.');
      // newTerminal.sendText('asfdasfdasdf', false);
      // newTerminal.sendText('asfdasfdasdf', false);
      //}
    }
  }
}
