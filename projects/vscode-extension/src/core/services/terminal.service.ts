import { Disposable } from '@core/abstractions/disposable';
import { FileHelpers } from '@core/helpers/file-helpers';
import { waitForFileCreation } from '@core/helpers/wait-for-file';
import * as fs from 'fs';
import { injectable } from 'inversify';
import * as vscode from 'vscode';

const DEFAULT_TERMINAL_NAME = 'Zx-Ide';
// The command may run an interactive wizard, so the user gets a generous time to answer it.
const RESULT_FILE_TIMEOUT_MILLISECONDS = 30 * 60 * 1000;

@injectable()
export class TerminalService extends Disposable {
  private terminals: Record<string, vscode.Terminal> = {};
  //private lastWatcher: fs.FSWatcher | undefined;

  constructor() {
    super();
  }

  private getDefaultTerminal(): vscode.Terminal {
    return this.getTerminal(DEFAULT_TERMINAL_NAME);
  }

  private getTerminal(name: string): vscode.Terminal {
    if (!this.terminals[name]) {
      this.terminals[name] = vscode.window.createTerminal({
        name: DEFAULT_TERMINAL_NAME,
        shellPath: process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : 'bash'),
      });
    }

    return this.terminals[name];
  }

  executeCommand(command: string, outputFilePath: string): Promise<string> {
    const terminal = this.getDefaultTerminal();
    if (terminal) {
      terminal.show();
      terminal.sendText(command);
      return this.waitForResultFileUpdate(outputFilePath);
    }
    return Promise.reject(new Error(vscode.l10n.t('Could not select terminal')));
  }

  /** Waits (with a timeout) for the command to create `outputFilePath` and returns its content. */
  private async waitForResultFileUpdate(outputFilePath: string): Promise<string> {
    fs.rmSync(outputFilePath, { force: true });
    await waitForFileCreation(outputFilePath, RESULT_FILE_TIMEOUT_MILLISECONDS);
    const content = await FileHelpers.readFile(outputFilePath);
    FileHelpers.clearTempFolder();
    return content;
  }
}
