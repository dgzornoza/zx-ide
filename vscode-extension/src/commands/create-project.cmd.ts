import { Command } from '@core/abstractions/command';
import { TerminalWrapper } from '@core/terminal-wrapper';
import { Types } from '@core/types';
import { exec } from 'child_process';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

const COMMAND_NAME: string = 'zx-ide.create-project';

@injectable()
export class CreateProjectCmd extends Command<unknown> {
  constructor(
    @inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext,
    @inject(Types.TerminalWrapper) private terminalWrapper: TerminalWrapper
  ) {
    super();

    this._subscriptions.push(
      vscode.commands.registerCommand(COMMAND_NAME, () => {
        this.execute();
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const projectType = await this.chooseProjectType();
    if (projectType === undefined) return;

    const projectName = await this.chooseProjectName();
    if (projectName === undefined) return;

    const useSample = await this.chooseUseSample();
    if (useSample === undefined) return;

    const projectPath = await this.choosePath();
    if (projectPath === undefined) return;

    try {
      await this.executeCliCommand(projectType, projectName, useSample, projectPath);
      vscode.window.showInformationMessage('Project created successfully, wait to open!');

      // reopen vscode
      const projectFolder = path.join(projectPath, projectName);
      await vscode.commands.executeCommand('vscode.openFolder', projectFolder, true);
      await vscode.commands.executeCommand('workbench.action.closeWindow');
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
    }
  }

  public canExecute(): boolean {
    return true;
  }

  public getCommandName(): string {
    return COMMAND_NAME;
  }

  private async chooseProjectType(): Promise<string | undefined> {
    const options = ['Zx Spectrum sjasmplus', 'Zx Spectrum z88dk'];
    const result = await vscode.window.showQuickPick(options, { placeHolder: 'Select project type' });

    switch (result) {
      case 'Zx Spectrum sjasmplus':
        return 'ZxSpectrumSjasmplus';
      case 'Zx Spectrum z88dk':
        return 'ZxSpectrumZ88dk';
      default:
        return undefined;
    }
  }

  private async chooseProjectName(): Promise<string | undefined> {
    return await vscode.window.showInputBox({ prompt: 'Insert project name (should be unique in docker containers)' });
  }

  private async chooseUseSample(): Promise<string | undefined> {
    const options = ['Yes', 'No'];
    return await vscode.window.showQuickPick(options, { placeHolder: 'Use sample project?' });
  }

  private async choosePath(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, openLabel: 'Choose path' });
    return result ? result[0].fsPath : undefined;
  }

  private executeCliCommand(projectType: string, projectName: string, useSample: string, path: string): Promise<void> {
    const useSampleOption = useSample === 'Yes' ? '-s' : '';

    return new Promise<void>((resolve, reject) => {
      const cliPath = this.extensionContext.asAbsolutePath('dist/zx-ide-cli.js');
      const command = `node ${cliPath} -p ${projectType} -n ${projectName} ${useSampleOption} -o ${path}`;

      exec(command, (error, _stdout, stderr) => {
        if (error) {
          reject(error.message);
        }
        if (stderr) {
          reject(stderr);
        }

        resolve();
      });
    });
  }
}
