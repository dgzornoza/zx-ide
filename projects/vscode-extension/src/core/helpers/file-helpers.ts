import { Logger } from '@core/logger';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

export class FileHelpers {
  public static getTempFolder(): string {
    const tempFolder = path.join(os.tmpdir(), 'zxide');
    fs.existsSync(tempFolder) || fs.mkdirSync(tempFolder);
    return FileHelpers.pathNormalized(tempFolder);
  }

  public static clearTempFolder(): void {
    const tempFolder = FileHelpers.getTempFolder();
    fs.rm(tempFolder, { recursive: true, force: true }, (err) => {
      if (err) throw err;
    });
  }

  public static async fileExists(absolutePath: string | vscode.Uri): Promise<boolean> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    try {
      await vscode.workspace.fs.stat(fileUri);
      return true;
    } catch (error) {
      return false;
    }
  }

  public static async readFileSplittedByNewLine(absolutePath: string | vscode.Uri): Promise<string[]> {
    const content = await this.readFile(absolutePath);
    return content.split(FileHelpers.getNewLineSeparator(content));
  }

  public static async readFile(absolutePath: string | vscode.Uri): Promise<string> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    try {
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      return Buffer.from(fileContent).toString('utf8');
    } catch (error) {
      Logger.error(`Error reading file '${fileUri}': ${error}`);
      throw error;
    }
  }

  /**
   * Writes a file with the given content.
   * @param content The content to write
   * @param absolutePath The path to the file
   * @param options Options for the write operation
   *  option 'binary === true' content` is decoded from base64 and written
   *  as raw bytes, else content is write in utf8
   */
  public static async writeFile(content: string, absolutePath: string | vscode.Uri, options: { binary?: boolean } = {}): Promise<void> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    if (!fileUri) {
      return;
    }
    try {
      const bytes = options.binary ? Buffer.from(content, 'base64') : Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(fileUri, bytes);
    } catch (error) {
      Logger.error(`Error writting file '${absolutePath}': ${error}`);
    }
  }

  public static getLineNumberOfRegex(textLines: string[], regex: RegExp): number {
    for (let i = 0; i < textLines.length; i++) {
      if (regex.test(textLines[i].trim())) {
        return i;
      }
    }
    return -1;
  }

  private static pathNormalized(fpath: string): string {
    return fpath.replace(/\\/g, '/');
  }

  private static getNewLineSeparator(content: string): string {
    return content.includes('\r\n') ? '\r\n' : '\n';
  }
}
