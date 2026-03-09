import { Command } from '@core/abstractions/command';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { FileHelpers } from '@core/helpers/file-helpers';
import { WebviewHelpers } from '@core/helpers/webview-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { CommandName } from '@core/infrastructure';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { InitMessage, SaveMapMessage, WriteFilesMessage } from '../../../shared/extract-graphics/extract-graphics-dtos';

@injectable()
export class AttachProjectGraphicsCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectGraphics;
  }

  private _panel: vscode.WebviewPanel | null = null;
  constructor(@inject(Types.ExtensionContext) private readonly extensionContext: vscode.ExtensionContext) {
    super();
  }

  public async execute(..._params: unknown[]): Promise<void> {
    try {
      this._panel = await this.createWebViewPanel();

      this._subscriptions.push(this._panel.webview.onDidReceiveMessage(this.onDidReceiveMessage));

      const projectType = await FeaturesService.getProjectType();
      const initMessage: InitMessage = { messageType: 'init', projectType };
      this._panel.webview.postMessage(initMessage);
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error attaching Asset-Graphics file: {0}', String(error)));
    }
  }

  private async createWebViewPanel(): Promise<vscode.WebviewPanel> {
    const locale = vscode.env.language;

    let panel = vscode.window.createWebviewPanel(
      'zxide.attachProjectGraphics',
      vscode.l10n.t('Attach project graphics'),
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media')],
      }
    );

    panel.webview.html = await WebviewHelpers.buildWebviewHtml({
      webview: panel.webview,
      extensionUri: this.extensionContext.extensionUri,
      htmlPageName: 'extract-graphics.html',
      locale,
    });

    return panel;
  }

  @BindThis
  private async onDidReceiveMessage(message: WriteFilesMessage | SaveMapMessage | undefined): Promise<void> {
    if (!this._panel || !message) {
      return;
    }

    if (message.messageType === 'saveMap') {
      await this.onSaveMap(message);
      return;
    }

    if (message.messageType !== 'writeFiles') {
      return;
    }

    try {
      for (const file of message.codeFiles) {
        const targetUri = await WorkspaceHelpers.getWorkspaceUri(file.fileName);
        const targetParentUri = vscode.Uri.joinPath(targetUri, '..');
        await vscode.workspace.fs.createDirectory(targetParentUri);
        await FileHelpers.writeFile(file.content, targetUri);
      }

      this._panel.webview.postMessage({
        type: 'status',
        ok: true,
        text: vscode.l10n.t('Files written successfully'),
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: 'status',
        ok: false,
        text: String(error),
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async onSaveMap(_message: SaveMapMessage): Promise<void> {
    // TODO: implement save map logic
  }
}
