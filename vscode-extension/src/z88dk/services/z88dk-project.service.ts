import { ProjectService } from '@core/abstractions/project.service';
import { injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class Z88dkProjectService extends ProjectService {
  constructor() {
    super();

    this._subscriptions.push(vscode.tasks.onDidEndTaskProcess(this.onDidEndTaskProcess));
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
