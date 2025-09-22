import { Command } from '@core/abstractions/command';
import { CommandName, WikiUri } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

// TODO: dgzornoza prueba zesarux
@injectable()
export class OpenHelpCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.OpenHelp;
  }

  constructor(@inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const wikiUri = vscode.Uri.parse(WikiUri);
    vscode.env.openExternal(wikiUri);

    // exec('D:/ZxSpectrumDevelop/ZEsarUX_windows-12.0/zesarux.exe -smartload', (err, stdout, stderr) => {
    //   if (err) {
    //     vscode.window.showErrorMessage(`Error al abrir la aplicación: ${err.message}`);
    //     return;
    //   }
    //   vscode.window.showInformationMessage('Aplicación abierta correctamente');
    // });
  }
}
