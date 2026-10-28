import * as assert from 'assert';
import * as vscode from 'vscode';

import { WebviewSession } from '../../commands/webview-session';

/** In-memory stand-in for a `vscode.WebviewPanel`: records posts and lets the test fire webview events. */
class FakeWebviewPanel {
  public readonly postedMessages: unknown[] = [];
  public isDisposed = false;
  private readonly receiveEmitter = new vscode.EventEmitter<unknown>();
  private readonly disposeEmitter = new vscode.EventEmitter<void>();

  public readonly webview = {
    postMessage: (message: unknown): Thenable<boolean> => {
      this.postedMessages.push(message);
      return Promise.resolve(true);
    },
    onDidReceiveMessage: this.receiveEmitter.event,
  };

  public readonly onDidDispose = this.disposeEmitter.event;

  public receive(message: unknown): void {
    this.receiveEmitter.fire(message);
  }

  /** Simulates the user closing the panel. */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.disposeEmitter.fire();
  }

  public asPanel(): vscode.WebviewPanel {
    return this as unknown as vscode.WebviewPanel;
  }
}

/** Echoes every received message back to the session that received it. */
function echoTo(received: unknown[]) {
  return (message: unknown, session: WebviewSession<unknown>): void => {
    received.push(message);
    session.post({ echo: message });
  };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

suite('WebviewSession', () => {
  test('answers each message on the panel that sent it', async () => {
    const firstPanel = new FakeWebviewPanel();
    const secondPanel = new FakeWebviewPanel();
    const received: unknown[] = [];
    new WebviewSession(firstPanel.asPanel(), echoTo(received));
    new WebviewSession(secondPanel.asPanel(), echoTo(received));

    firstPanel.receive('from first');
    secondPanel.receive('from second');
    await flush();

    assert.deepStrictEqual(received, ['from first', 'from second']);
    assert.deepStrictEqual(firstPanel.postedMessages, [{ echo: 'from first' }]);
    assert.deepStrictEqual(secondPanel.postedMessages, [{ echo: 'from second' }]);
  });

  test('stops handling messages and posting once the panel is closed', async () => {
    const panel = new FakeWebviewPanel();
    const received: unknown[] = [];
    let disposedSessions = 0;
    const session = new WebviewSession(panel.asPanel(), echoTo(received), () => disposedSessions++);

    panel.dispose();
    panel.receive('after close');
    session.post('late reply');
    await flush();

    assert.deepStrictEqual(received, []);
    assert.deepStrictEqual(panel.postedMessages, []);
    assert.strictEqual(disposedSessions, 1);
  });

  test('dispose closes the panel and runs the close callback once', () => {
    const panel = new FakeWebviewPanel();
    let disposedSessions = 0;
    const session = new WebviewSession(panel.asPanel(), echoTo([]), () => disposedSessions++);

    session.dispose();
    session.dispose();

    assert.strictEqual(panel.isDisposed, true);
    assert.strictEqual(disposedSessions, 1);
  });
});
