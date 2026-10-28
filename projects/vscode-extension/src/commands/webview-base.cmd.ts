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
  dispatchMessage,
  type ExtensionToWebviewMessage,
  type MessageHandlers,
  type WebviewToExtensionMessage,
} from '../../../shared/bridge-messages';
import type { ReadAssetRequestMessage, SaveMapMessage, WriteFilesMessage } from '../../../shared/extract-graphics/extract-graphics-dtos';

/**
 * Workspace root folder for a generated file.
 *
 * Resource files (`.cfg`, `.png`) live next to the source image under
 * `assets/`. Code files (`.h`, `.asm`, `.bin`) live under `src/data/'.
 */
function resolveCodeFileRoot(fileType: WriteFilesMessage['codeFiles'][number]['fileType']): 'assets' | 'src/data' {
  switch (fileType) {
    case 'map':
    case 'png':
      return 'assets';
    case 'c-header':
    case 'asm':
    case 'binary':
      return 'src/data';
  }
}

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
      this.postToWebview({ messageType: 'initFromExtension', projectType });

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

  protected async onSaveMap(_message: SaveMapMessage): Promise<void> {
    // no-op by default; override in subclasses that need save-map logic
  }

  /** Posts a message of the extension → webview contract to the open panel. */
  protected postToWebview(message: ExtensionToWebviewMessage): void {
    void this.panel?.webview.postMessage(message);
  }

  private async postAssetsList(): Promise<void> {
    if (!this.panel) {
      return;
    }
    const result = await AssetsHelpers.scanAssetsDirectory();
    if (result.missing) {
      vscode.window.showErrorMessage('Project requires the assets/ directory at the workspace root');
    }
    this.postToWebview({
      messageType: 'assetsListFromExtension',
      assets: result.assets,
      ...(result.missing ? { missing: true } : {}),
    });
  }

  private async handleReadAssetRequest(request: ReadAssetRequestMessage): Promise<void> {
    try {
      const pathSegments = FileHelpers.splitRelativePath(request.path);
      const bytes = await WorkspaceHelpers.readWorkspaceFileBytes('assets', ...pathSegments);

      this.postToWebview({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        contentBase64: Buffer.from(bytes).toString('base64'),
      });
    } catch (error) {
      this.postToWebview({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** Single dispatcher for the webview → extension contract: one handler per message type. */
  private readonly webviewMessageHandlers: MessageHandlers<WebviewToExtensionMessage> = {
    writeFilesFromWebview: (message) => this.writeFiles(message),
    saveMapFromWebview: (message) => this.onSaveMap(message),
    readAssetRequestFromWebview: (message) => this.handleReadAssetRequest(message),
  };

  @BindThis
  protected async onDidReceiveMessage(message: unknown): Promise<void> {
    if (!this.panel) {
      return;
    }
    await dispatchMessage(message, this.webviewMessageHandlers);
  }

  private async writeFiles(message: WriteFilesMessage): Promise<void> {
    try {
      for (const file of message.codeFiles) {
        const rootFolder = resolveCodeFileRoot(file.fileType);
        const targetUri = await WorkspaceHelpers.getWorkspaceUri(rootFolder, ...FileHelpers.splitRelativePath(file.fileName));
        const targetParentUri = vscode.Uri.joinPath(targetUri, '..');
        await vscode.workspace.fs.createDirectory(targetParentUri);

        const isBinary = file.fileType === 'png' || file.fileType === 'binary';
        await FileHelpers.writeFile(file.content, targetUri, { binary: isBinary });
      }

      this.postToWebview({
        messageType: 'writeFilesResultFromExtension',
        success: true,
        text: vscode.l10n.t('Files written successfully'),
      });
    } catch (error) {
      this.postToWebview({
        messageType: 'writeFilesResultFromExtension',
        success: false,
        text: String(error),
      });
    }
  }
}
