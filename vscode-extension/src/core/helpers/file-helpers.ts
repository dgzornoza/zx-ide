import { Logger } from '@core/logger';
import * as vscode from 'vscode';

export class FileHelpers {
  public static getRelativePathsUri(...relativePathSegments: string[]): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ...relativePathSegments)
      : undefined;
  }

  public static async readFile(...relativePathSegments: string[]): Promise<string | undefined> {
    const fileUri = FileHelpers.getRelativePathsUri(...relativePathSegments);
    if (fileUri) {
      try {
        // read file
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        return Buffer.from(fileContent).toString('utf8');
      } catch (error) {
        Logger.error(`Error reading file '${relativePathSegments.at(-1)}': ${error}`);
      }
    }

    return undefined;
  }

  public static async readJsonFile<T>(...relativePathSegments: string[]): Promise<T | undefined> {
    const fileText = await FileHelpers.readFile(...relativePathSegments);
    if (fileText) {
      try {
        return JSON.parse(fileText);
      } catch (error) {
        Logger.error(`Error parse json data in file '${relativePathSegments.at(-1)}': ${error}`);
      }
    }

    return undefined;
  }

  public static async writeFile(content: string, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = FileHelpers.getRelativePathsUri(...relativePathSegments);
    if (fileUri) {
      try {
        const fileText = Buffer.from(content);
        await vscode.workspace.fs.writeFile(fileUri, fileText);
      } catch (error) {
        Logger.error(`Error writting file '${relativePathSegments.at(-1)}': ${error}`);
      }
    }
  }

  public static async writeJsonFile(instance: unknown, ...relativePathSegments: string[]): Promise<void> {
    const content = JSON.stringify(instance, null, 4);
    await FileHelpers.writeFile(content, ...relativePathSegments);
  }

  public static async openFile(findLineRegex?: RegExp, ...relativePathSegments: string[]): Promise<void> {
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
