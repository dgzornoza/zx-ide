import { Logger } from '@core/logger';
import * as vscode from 'vscode';

export class FileHelpers {
  public static getFileUri(...relativePathSegments: string[]): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ...relativePathSegments)
      : undefined;
  }

  public static async readFile(...relativePathSegments: string[]): Promise<string | undefined> {
    const fileUri = FileHelpers.getFileUri(...relativePathSegments);
    if (fileUri) {
      try {
        // read file
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        return Buffer.from(fileContent).toString('utf8');
      } catch (error) {
        Logger.error(`Error reading file: ${error}`);
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
        Logger.error(`Error parse json data: ${error}`);
      }
    }

    return undefined;
  }

  public static async writeFile(content: string, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = FileHelpers.getFileUri(...relativePathSegments);
    if (fileUri) {
      try {
        // write file
        const fileText = Buffer.from(content);
        await vscode.workspace.fs.writeFile(fileUri, fileText);
      } catch (error) {
        Logger.error(`Error writting file: ${error}`);
      }
    }
  }

  public static async writeJsonFile(instance: unknown, ...relativePathSegments: string[]): Promise<void> {
    const content = JSON.stringify(instance);
    await FileHelpers.writeFile(content, ...relativePathSegments);
  }
}
