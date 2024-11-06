import { Disposable } from '@core/abstractions/disposable';
import * as fs from 'fs';
import { injectable } from 'inversify';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Wrapper class for executing commands in the terminal, waiting for the command to finish and returning the output.
 * This class pipe result to temp file and wait for a trigger file to be created, then return result and remove temp files.
 */
@injectable()
export class TerminalWrapper extends Disposable {
  constructor() {
    super();
  }

  async executeCommand(terminalName: string, command: string): Promise<string> {
    const date = new Date().toISOString().replace(/:/g, '_');
    const outputTempFilePath = path.join(os.tmpdir(), `zx_ide_terminal_wrapper_${date}.txt`);
    const triggerTempFilePath = path.join(os.tmpdir(), `zx_ide_terminal_wrapper_${date}.txt`);

    const terminal = vscode.window.createTerminal({
      name: terminalName,
    });
    terminal.show();

    // BASH
    //command + ` > ${outputFile} || pwd > ${triggerFile}`
    // PowerShell
    // command + ` > $outputFile -or (pwd > $triggerFile)`
    // CMD
    // command + ` > %outputFile% || (pwd > %triggerFile%)`

    terminal.sendText(command + ` > ${outputTempFilePath} || pwd > ${triggerTempFilePath}`);
    return this.waitForFileUpdate(outputTempFilePath, triggerTempFilePath);
  }

  private waitForFileUpdate(outputFile: string, triggerFile: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const watcher = fs.watch(triggerFile);
      watcher.on('change', () => {
        watcher.close();
        fs.readFile(outputFile, 'utf8', (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      watcher.on('error', reject);
    });
  }
}
