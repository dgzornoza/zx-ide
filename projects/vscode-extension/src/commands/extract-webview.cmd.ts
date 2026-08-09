import { Command } from '@core/abstractions/command';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { FileHelpers } from '@core/helpers/file-helpers';
import { WebviewHelpers } from '@core/helpers/webview-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import type { InitMessage, SaveMapMessage, WriteFilesMessage } from '../../../shared/extract-graphics/extract-graphics-dtos';

/**
 * Abstract base for all "extract-webview" commands.
 *
 * Handles the common lifecycle: create WebviewPanel → send InitMessage →
 * receive WriteFilesMessage and write files to the workspace.
 *
 * Subclasses must implement:
 *  - `getCommandName()` (from Command)
 *  - `viewType` — unique panel view-type string
 *  - `panelTitle` — already-localised title shown in the tab
 *  - `htmlPageName` — e.g. `"extract-tiles.html"`
 *
 * Subclasses may override `onSaveMap` when saveMap handling is needed.
 */
@injectable()
export abstract class ExtractWebviewCommand extends Command<unknown> {
  protected panel: vscode.WebviewPanel | undefined;

  constructor(
    @inject(Types.ExtensionContext)
    protected readonly extensionContext: vscode.ExtensionContext
  ) {
    super();
  }

  protected abstract get viewType(): string;
  protected abstract get panelTitle(): string;
  protected abstract get htmlPageName(): string;

  public async execute(..._params: unknown[]): Promise<void> {
    try {
      this.panel = await this.createWebViewPanel();
      this._subscriptions.push(this.panel.webview.onDidReceiveMessage(this.onDidReceiveMessage));

      const projectType = await FeaturesService.getProjectType();
      const initMessage: InitMessage = { messageType: 'init', projectType };
      this.panel.webview.postMessage(initMessage);
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error opening {0}: {1}', this.panelTitle, String(error)));
    }
  }

  private async createWebViewPanel(): Promise<vscode.WebviewPanel> {
    const locale = vscode.env.language;

    const panel = vscode.window.createWebviewPanel(this.viewType, this.panelTitle, vscode.ViewColumn.Active, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media')],
    });

    panel.webview.html = await WebviewHelpers.buildWebviewHtml({
      webview: panel.webview,
      extensionUri: this.extensionContext.extensionUri,
      htmlPageName: this.htmlPageName,
      locale,
    });

    return panel;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onSaveMap(_message: SaveMapMessage): Promise<void> {
    // no-op by default; override in subclasses that need save-map logic
  }

  @BindThis
  protected async onDidReceiveMessage(message: WriteFilesMessage | SaveMapMessage | undefined): Promise<void> {
    if (!this.panel || !message) {
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

        const isBinary = file.fileType === 'png' || file.fileType === 'binary';
        await FileHelpers.writeFile(file.content, targetUri, { binary: isBinary });
      }

      this.panel.webview.postMessage({
        type: 'status',
        ok: true,
        text: vscode.l10n.t('Files written successfully'),
      });
    } catch (error) {
      this.panel.webview.postMessage({
        type: 'status',
        ok: false,
        text: String(error),
      });
    }
  }
}
