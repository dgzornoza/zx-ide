import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import type { SaveMapMessage } from '../../../shared/extract-graphics/extract-graphics-dtos';
import { ExtractWebviewCommand } from './extract-webview.cmd';

@injectable()
export class AttachProjectSpritesCmd extends ExtractWebviewCommand {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectSprites;
  }

  constructor(@inject(Types.ExtensionContext) extensionContext: vscode.ExtensionContext) {
    super(extensionContext);
  }

  protected get viewType(): string {
    return 'zxide.attachProjectSprites';
  }
  protected get panelTitle(): string {
    return vscode.l10n.t('Extract sprites');
  }
  protected get htmlPageName(): string {
    return 'extract-sprites.html';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onSaveMap(_message: SaveMapMessage): Promise<void> {
    // TODO: implement save map logic
  }
}
