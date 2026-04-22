import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { ExtractWebviewCommand } from './extract-webview.cmd';

@injectable()
export class CreateSpritesCmd extends ExtractWebviewCommand {
  public getCommandName(): CommandName {
    return CommandName.CreateSprites;
  }

  constructor(@inject(Types.ExtensionContext) extensionContext: vscode.ExtensionContext) {
    super(extensionContext);
  }

  protected get viewType(): string {
    return 'zxide.createSprites';
  }
  protected get panelTitle(): string {
    return vscode.l10n.t('Create sprites');
  }
  protected get htmlPageName(): string {
    return 'create-sprites.html';
  }
}
