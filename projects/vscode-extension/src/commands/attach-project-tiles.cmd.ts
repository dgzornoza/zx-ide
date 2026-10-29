import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { WebviewBaseCommand } from './webview-base.cmd';

@injectable()
export class AttachProjectTilesCmd extends WebviewBaseCommand {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectTiles;
  }

  constructor(@inject(Types.ExtensionContext) extensionContext: vscode.ExtensionContext) {
    super(extensionContext);
  }

  protected get viewType(): string {
    return 'zxide.attachProjectTiles';
  }
  protected get panelTitle(): string {
    return vscode.l10n.t('Extract tiles');
  }
  protected get htmlPageName(): string {
    return 'extract-tiles.html';
  }

  protected override requiresAssetsList(): boolean {
    return true;
  }
}
