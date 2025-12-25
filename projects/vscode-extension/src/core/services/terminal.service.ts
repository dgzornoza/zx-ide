import { Disposable } from '@core/abstractions/disposable';
import { FileHelpers } from '@core/helpers/file-helpers';
import * as fs from 'fs';
import { injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

const DEFAULT_TERMINAL_NAME = 'Zx-Ide';

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

  private async waitForResultFileUpdate(outputFilePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const outputFolder = path.dirname(outputFilePath);
      const outputFilename = path.basename(outputFilePath);
      fs.rmSync(outputFilePath, { force: true });

      const watcher = fs.watch(outputFolder, (eventType, filename) => {
        if (eventType === 'rename' && filename === outputFilename) {
          watcher.close();

          fs.access(outputFilePath, fs.constants.F_OK, (error) => {
            if (!error) {
              FileHelpers.readFile(outputFilePath)
                .then((content) => {
                  FileHelpers.clearTempFolder();
                  resolve(content);
                })
                .catch((error) => {
                  reject(error);
                });
            }
          });
        }
      });

      watcher.on('error', reject);
    });
  }
}
