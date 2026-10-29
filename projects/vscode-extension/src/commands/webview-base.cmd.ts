import { Command } from '@core/abstractions/command';
import { routeGeneratedFile, splitWorkspaceRelativePath } from '@core/domain/generated-file-routing';
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
} from 'externalShared/bridge-messages';
import type { ReadAssetRequestMessage, WriteFilesMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { WebviewSession } from './webview-session';

/**
 * Abstract base for all "webview" commands.
 *
 * Handles the common lifecycle: create WebviewPanel → wait for ReadyMessage →
 * send InitMessage and AssetsListMessage (when the subclass opts in) → receive
 * WriteFilesMessage and write files to the workspace.
 *
 * Subclasses must implement:
 *  - `getCommandName()` (from Command)
 *  - `viewType` — unique panel view-type string
 *  - `panelTitle` — already-localised title shown in the tab
 *  - `htmlPageName` — e.g. `"extract-tiles.html"`
 *
 * Each open panel gets its own `WebviewSession`: replies go to the panel that
 * sent the request, and the session is released when the panel closes.
 *
 * Subclasses may override `requiresAssetsList()` to opt into the assets
 * directory scan + `AssetsListMessage` post on panel open.
 */
@injectable()
export abstract class WebviewBaseCommand extends Command<unknown> {
  /** Open panels of this command, one session each. */
  private readonly sessions = new Set<WebviewSession<ExtensionToWebviewMessage>>();

  constructor(@inject(Types.ExtensionContext) protected readonly extensionContext: vscode.ExtensionContext) {
    super();
  }

  protected abstract get viewType(): string;
  protected abstract get panelTitle(): string;
  protected abstract get htmlPageName(): string;

  public async execute(..._params: unknown[]): Promise<void> {
    try {
      const panel = await this.createWebViewPanel();
      // The initial messages are sent when the page answers `readyFromWebview`.
      const session: WebviewSession<ExtensionToWebviewMessage> = new WebviewSession(
        panel,
        async (message, messageSession) => {
          await dispatchMessage(message, this.createMessageHandlers(messageSession));
        },
        () => this.sessions.delete(session)
      );
      this.sessions.add(session);
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error opening {0}: {1}', this.panelTitle, String(error)));
    }
  }

  public override dispose(): void {
    [...this.sessions].forEach((session) => session.dispose());
    super.dispose();
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

  /** Dispatcher for the webview → extension contract: one handler per message type, replying on `session`. */
  private createMessageHandlers(session: WebviewSession<ExtensionToWebviewMessage>): MessageHandlers<WebviewToExtensionMessage> {
    return {
      readyFromWebview: () => this.postInitialMessages(session),
      writeFilesFromWebview: (message) => this.writeFiles(session, message),
      readAssetRequestFromWebview: (message) => this.handleReadAssetRequest(session, message),
    };
  }

  /** Sends the messages a page needs on start. Runs on every `readyFromWebview`, so a reloaded page is initialised again. */
  private async postInitialMessages(session: WebviewSession<ExtensionToWebviewMessage>): Promise<void> {
    try {
      const projectType = await FeaturesService.getProjectType();
      session.post({ messageType: 'initFromExtension', projectType });

      if (this.requiresAssetsList()) {
        await this.postAssetsList(session);
      }
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error opening {0}: {1}', this.panelTitle, String(error)));
    }
  }

  private async postAssetsList(session: WebviewSession<ExtensionToWebviewMessage>): Promise<void> {
    const result = await AssetsHelpers.scanAssetsDirectory();
    if (result.missing) {
      vscode.window.showErrorMessage('Project requires the assets/ directory at the workspace root');
    }
    session.post({
      messageType: 'assetsListFromExtension',
      assets: result.assets,
      ...(result.missing ? { missing: true } : {}),
    });
  }

  private async handleReadAssetRequest(
    session: WebviewSession<ExtensionToWebviewMessage>,
    request: ReadAssetRequestMessage
  ): Promise<void> {
    try {
      const pathSegments = splitWorkspaceRelativePath(request.path);
      const bytes = await WorkspaceHelpers.readWorkspaceFileBytes('assets', ...pathSegments);

      session.post({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        contentBase64: Buffer.from(bytes).toString('base64'),
      });
    } catch (error) {
      session.post({
        messageType: 'readAssetResponseFromExtension',
        path: request.path,
        requestId: request.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async writeFiles(session: WebviewSession<ExtensionToWebviewMessage>, message: WriteFilesMessage): Promise<void> {
    try {
      for (const file of message.codeFiles) {
        const target = routeGeneratedFile(file);
        const targetUri = await WorkspaceHelpers.getWorkspaceUri(target.rootFolder, ...target.pathSegments);
        const targetParentUri = vscode.Uri.joinPath(targetUri, '..');
        await vscode.workspace.fs.createDirectory(targetParentUri);

        await FileHelpers.writeFile(file.content, targetUri, { binary: target.isBinary });
      }

      session.post({ messageType: 'writeFilesResultFromExtension', success: true });
    } catch (error) {
      session.post({
        messageType: 'writeFilesResultFromExtension',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
