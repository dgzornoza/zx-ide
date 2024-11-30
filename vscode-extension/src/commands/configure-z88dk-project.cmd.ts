import { Command } from '@core/abstractions/command';
import { FileHelpers } from '@core/helpers/file-helpers';
import { ISettingsJsonFile } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

const COMMAND_NAME: string = 'zx-ide.configure-z88dk-project';
const SETTINGS_JSON_INCLUDE_PATH_PROPERTY: string = 'C_Cpp.default.includePath';

type ProjectConfigurationOptions =
  | 'Help'
  | 'sdcc classic lib'
  | 'sdcc new lib (iy registers)'
  | 'sccz80 classic lib'
  | 'sccz80 new lib (iy registers)';

@injectable()
export class ConfigureZ88dkProjectCmd extends Command<unknown> {
  public getCommandName(): string {
    return COMMAND_NAME;
  }

  constructor(@inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const projectConfiguration = await this.chooseConfiguration();
    if (projectConfiguration === undefined) return;

    try {
      await this.configureProject(projectConfiguration);
      vscode.window.showInformationMessage('Project configured successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
    }
  }

  public canExecute(): boolean {
    return true;
  }

  private async chooseConfiguration(): Promise<ProjectConfigurationOptions | undefined> {
    const options: ProjectConfigurationOptions[] = [
      'Help',
      'sdcc classic lib',
      'sdcc new lib (iy registers)',
      'sccz80 classic lib',
      'sccz80 new lib (iy registers)',
    ];
    const result = await vscode.window.showQuickPick(options, { placeHolder: 'Select project type' });
    return result as ProjectConfigurationOptions | undefined;
  }

  private async configureProject(_projectConfiguration: ProjectConfigurationOptions): Promise<void> {
    let json = await FileHelpers.readJsonFile<ISettingsJsonFile>('.vscode', 'settings.json');

    if (json) {
      json.C_Cpp.default.includePath = json.C_Cpp.default.includePath.filter((path: string) => path === '/opt/z88dk/include');
      //ObjectHelpers.updateNestedProperty(json, 'z88dk.projectConfiguration', SETTINGS_JSON_INCLUDE_PATH_PROPERTY);
      await FileHelpers.writeJsonFile(json, '.vscode', 'settings.json');
    }
  }
}
