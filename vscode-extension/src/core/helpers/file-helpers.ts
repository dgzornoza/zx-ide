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

  public static pathNormalized(fpath: string): string {
    return fpath.replace(/\\/g, '/');
  }

  public static getRelativePathsUri(...relativePathSegments: string[]): vscode.Uri {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      throw new Error(vscode.l10n.t('No workspace folders found'));
    }
    return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ...relativePathSegments);
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

  public static async readWorkspaceFile(...relativePathSegments: string[]): Promise<string> {
    const fileUri = FileHelpers.getRelativePathsUri(...relativePathSegments);
    return await FileHelpers.readFile(fileUri);
  }

  public static async readWorkspaceJsonFile<T>(...relativePathSegments: string[]): Promise<T> {
    const fileText = await FileHelpers.readWorkspaceFile(...relativePathSegments);
    try {
      return JSON.parse(fileText);
    } catch (error) {
      Logger.error(`Error parse json data in file '${relativePathSegments.at(-1)}': ${error}`);
      throw error;
    }
  }

  public static async writeFile(content: string, absolutePath: string | vscode.Uri): Promise<void> {
    const fileUri = absolutePath instanceof vscode.Uri ? absolutePath : vscode.Uri.file(absolutePath);
    if (fileUri) {
      try {
        const fileText = Buffer.from(content);
        await vscode.workspace.fs.writeFile(fileUri, fileText);
      } catch (error) {
        Logger.error(`Error writting file '${absolutePath}': ${error}`);
      }
    }
  }

  public static async writeWorkspaceFile(content: string, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = FileHelpers.getRelativePathsUri(...relativePathSegments);
    await FileHelpers.writeFile(content, fileUri);
  }

  public static async writeWorkspaceJsonFile(instance: unknown, ...relativePathSegments: string[]): Promise<void> {
    const content = JSON.stringify(instance, null, 4);
    await FileHelpers.writeWorkspaceFile(content, ...relativePathSegments);
  }

  public static async openWorkspaceFile(findLineRegex?: RegExp, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = FileHelpers.getRelativePathsUri(...relativePathSegments);
    if (fileUri) {
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      if (editor && findLineRegex) {
        const targetLine = FileHelpers.getLineNumberOfRegex(document, findLineRegex);

        if (targetLine !== -1) {
          const range = new vscode.Range(targetLine, 0, targetLine, 0);
          // const editor = vscode.window.activeTextEditor;
          editor.selection = new vscode.Selection(range.start, range.end);
          editor?.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
      }
    }
  }

  private static getLineNumberOfRegex(document: vscode.TextDocument, regex: RegExp): number {
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i].trim())) {
        return i;
      }
    }
    return -1;
  }
}
