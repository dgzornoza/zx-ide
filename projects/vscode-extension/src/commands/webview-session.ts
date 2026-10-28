import * as vscode from 'vscode';

/**
 * One open webview panel and everything scoped to it.
 *
 * Every message the panel sends reaches `onMessage` together with this
 * session, so replies go back to the same panel even when several panels of
 * the same command are open. When the panel closes, the message subscription
 * is released, later `post` calls are ignored and `onClosed` runs once.
 *
 * Depends only on `vscode` so the extension test host can load it directly.
 */
export class WebviewSession<TOutgoingMessage> implements vscode.Disposable {
  private readonly subscriptions: vscode.Disposable[] = [];
  private isClosed = false;

  constructor(
    private readonly panel: vscode.WebviewPanel,
    onMessage: (message: unknown, session: WebviewSession<TOutgoingMessage>) => void | Promise<void>,
    private readonly onClosed: () => void = () => undefined
  ) {
    this.subscriptions.push(
      panel.webview.onDidReceiveMessage((message: unknown) => onMessage(message, this)),
      panel.onDidDispose(() => this.close())
    );
  }

  /** Posts `message` to this session's panel; ignored once the panel is closed. */
  public post(message: TOutgoingMessage): void {
    if (this.isClosed) {
      return;
    }
    void this.panel.webview.postMessage(message);
  }

  /** Closes the panel (for example on extension deactivation). */
  public dispose(): void {
    if (this.isClosed) {
      return;
    }
    this.close();
    this.panel.dispose();
  }

  private close(): void {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    this.subscriptions.splice(0).forEach((subscription) => subscription.dispose());
    this.onClosed();
  }
}
