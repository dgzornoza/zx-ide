import { Command } from '@core/abstractions/command';
import { FileHelpers } from '@core/helpers/file-helpers';
import { CommandName, NewProjectModel } from '@core/infrastructure';
import { TerminalService } from '@core/services/terminal.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

@injectable()
export class CreateProjectCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.CreateProject;
  }

  constructor(
    @inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext,
    @inject(Types.TerminalService) private terminalService: TerminalService
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const outputFile = path.join(FileHelpers.getTempFolder(), 'output.txt');

    const cliPath = path.join(__dirname, 'zx-ide-cli.js');

    try {
      const result = await this.terminalService.executeCommand(`node ${cliPath} -o ${outputFile}`, outputFile);
      const jsonResult: NewProjectModel = JSON.parse(result);

      vscode.window.showInformationMessage(vscode.l10n.t('Project created successfully, wait to open!'));
      // reopen vscode
      const projectPathUri = vscode.Uri.file(jsonResult.projectPath);
      await vscode.commands.executeCommand('vscode.openFolder', projectPathUri, { forceReuseWindow: true });
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
    }
  }
}
