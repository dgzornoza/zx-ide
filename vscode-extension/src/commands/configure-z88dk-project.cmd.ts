import { Command } from '@core/abstractions/command';
import { Types } from '@core/types';
import { ProjectConfigurationOptions, Z88dkProjectService } from '@z88dk/services/z88dk-project.service';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

const COMMAND_NAME: string = 'zx-ide.configure-z88dk-project';

@injectable()
export class ConfigureZ88dkProjectCmd extends Command<unknown> {
  public getCommandName(): string {
    return COMMAND_NAME;
  }

  constructor(
    @inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext,
    @inject(Types.Z88dkProjectService) private z88dkProjectService: Z88dkProjectService
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const projectConfiguration = await this.chooseConfiguration();
    if (projectConfiguration === undefined) return;

    if ((await this.showConfirmDialog()) === false) return;

    try {
      await this.z88dkProjectService.configureProject(projectConfiguration);
      vscode.window.showInformationMessage('Project configured successfully');
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
    }
  }

  private async showConfirmDialog(): Promise<boolean> {
    // Muestra el diálogo de aceptar/cancelar
    const result = await vscode.window.showInformationMessage(
      vscode.l10n.t(
        'This action will modify some configuration files in the project. Also, if you switch between classic/new lib, some symbols may change and the project may not compile. Are you sure you want to continue?'
      ),
      { modal: true },
      vscode.l10n.t('Accept'),
      vscode.l10n.t('Cancel')
    );
    // Maneja la respuesta del usuario
    return result === vscode.l10n.t('Accept') ? true : false;
  }

  private async chooseConfiguration(): Promise<ProjectConfigurationOptions | undefined> {
    const options = [
      vscode.l10n.t('Help'),
      vscode.l10n.t('sdcc classic lib'),
      vscode.l10n.t('sdcc new lib (iy registers)'),
      vscode.l10n.t('sccz80 classic lib'),
      vscode.l10n.t('sccz80 new lib (iy registers)'),
    ];
    const result = await vscode.window.showQuickPick(options, { placeHolder: vscode.l10n.t('Select configuration') });

    switch (result) {
      case options[0]:
        await this.openExternalHelp();
        return undefined;
      case options[1]:
        return 'sdccClassicLib';
      case options[2]:
        return 'sdccNewLib';
      case options[3]:
        return 'sccz80ClassicLib';
      case options[3]:
        return 'sccz80NewLib';
      default:
        return undefined;
    }
  }

  private async openExternalHelp(): Promise<void> {
    const url = vscode.Uri.parse('https://github.com/dgzornoza/zx-ide/wiki');
    await vscode.env.openExternal(url);
  }
}
