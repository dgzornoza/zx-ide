import { Command } from '@core/abstractions/command';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { AssetsHelpers } from '@core/helpers/assets-helpers';
import { FileHelpers } from '@core/helpers/file-helpers';
import { WebviewHelpers } from '@core/helpers/webview-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import {
  AssetsListMessage,
  InitMessage,
  ReadAssetRequestMessage,
  ReadAssetResponseMessage,
  SaveMapMessage,
  WriteFilesMessage,
} from '../../../shared/extract-graphics/extract-graphics-dtos';

/**
 * Abstract base for all "webview" commands.
 *
 * Handles the common lifecycle: create WebviewPanel → send InitMessage → send
 * AssetsListMessage (when the subclass opts in) → receive WriteFilesMessage
 * and write files to the workspace.
 *
 * Subclasses must implement:
 *  - `getCommandName()` (from Command)
 *  - `viewType` — unique panel view-type string
 *  - `panelTitle` — already-localised title shown in the tab
 *  - `htmlPageName` — e.g. `"extract-tiles.html"`
 *
 * Subclasses may override `onSaveMap` when saveMap handling is needed.
 * Subclasses may override `requiresAssetsList()` to opt into the assets
 * directory scan + `AssetsListMessage` post on panel open.
 */
@injectable()
export abstract class WebviewBaseCommand extends Command<unknown> {
  protected panel: vscode.WebviewPanel | undefined;

  constructor(@inject(Types.ExtensionContext) protected readonly extensionContext: vscode.ExtensionContext) {
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
      const initMessage: InitMessage = { messageType: 'initFromExtension', projectType };
      this.panel.webview.postMessage(initMessage);

      if (this.requiresAssetsList()) {
        await this.postAssetsList();
      }
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error opening {0}: {1}', this.panelTitle, String(error)));
    }
  }

  /**
   * Subclasses override to declare whether they consume `AssetsListMessage`.
   * Default is `false` to keep the existing flows free of any assets scan.
   */
  protected requiresAssetsList(): boolean {
    return false;
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

  private async postAssetsList(): Promise<void> {
    if (!this.panel) {
      return;
    }
    const result = await AssetsHelpers.scanAssetsDirectory();
    if (result.missing) {
      vscode.window.showErrorMessage('Project requires the assets/ directory at the workspace root');
    }
    const message: AssetsListMessage = {
      messageType: 'assetsListFromExtension',
      assets: result.assets,
      ...(result.missing ? { missing: true } : {}),
    };
    this.panel.webview.postMessage(message);
  }

  private async handleReadAssetRequest(request: ReadAssetRequestMessage): Promise<void> {
    if (!this.panel) {
      return;
    }
    try {
      const pathSegments = FileHelpers.splitRelativePath(request.path);
      const bytes = await WorkspaceHelpers.readWorkspaceFileBytes('assets', ...pathSegments);

      this.panel.webview.postMessage({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        contentBase64: Buffer.from(bytes).toString('base64'),
      } satisfies ReadAssetResponseMessage);
    } catch (error) {
      this.panel.webview.postMessage({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        error: error instanceof Error ? error.message : String(error),
      } satisfies ReadAssetResponseMessage);
    }
  }

  @BindThis
  protected async onDidReceiveMessage(message: WriteFilesMessage | SaveMapMessage | ReadAssetRequestMessage | undefined): Promise<void> {
    if (!this.panel || !message) {
      return;
    }

    if (message.messageType === 'saveMapFromWebview') {
      await this.onSaveMap(message);
      return;
    }

    if (message.messageType === 'readAssetRequestFromWebview') {
      await this.handleReadAssetRequest(message);
      return;
    }

    if (message.messageType !== 'writeFilesFromWebview') {
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
