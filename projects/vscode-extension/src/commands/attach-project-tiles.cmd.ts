import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import type { SaveMapMessage } from '../../../shared/extract-graphics/extract-graphics-dtos';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onSaveMap(_message: SaveMapMessage): Promise<void> {
    // TODO: implement save map logic
  }
}
