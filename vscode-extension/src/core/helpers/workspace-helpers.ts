import { FileHelpers } from '@core/helpers/file-helpers';
import { Logger } from '@core/logger';
import * as vscode from 'vscode';

export class WorkspaceHelpers {
  /**
   * Get workspace path ended with slash
   */
  public static get workspacePath(): string {
    return vscode.workspace.workspaceFolders![0].uri.path.replace(/\/?$/, '/');
  }

  public static getWorkspaceUri(...relativePathSegments: string[]): vscode.Uri {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      throw new Error(vscode.l10n.t('No workspace folders found'));
    }
    return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ...relativePathSegments);
  }

  public static async readWorkspaceFile(...relativePathSegments: string[]): Promise<string> {
    const fileUri = WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    return await FileHelpers.readFile(fileUri);
  }

  public static async readWorkspaceJsonFile<T>(...relativePathSegments: string[]): Promise<T> {
    const fileText = await WorkspaceHelpers.readWorkspaceFile(...relativePathSegments);
    try {
      return JSON.parse(fileText);
    } catch (error) {
      Logger.error(`Error parse json data in file '${relativePathSegments.at(-1)}': ${error}`);
      throw error;
    }
  }

  public static async writeWorkspaceFile(content: string, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    await FileHelpers.writeFile(content, fileUri);
  }

  public static async writeWorkspaceJsonFile(instance: unknown, ...relativePathSegments: string[]): Promise<void> {
    const content = JSON.stringify(instance, null, 4);
    await WorkspaceHelpers.writeWorkspaceFile(content, ...relativePathSegments);
  }

  public static async openWorkspaceFile(findLineRegex?: RegExp, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    if (fileUri) {
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      if (editor && findLineRegex) {
        const text = document.getText();
        const targetLine = FileHelpers.getLineNumberOfRegex(text.split('\n'), findLineRegex);

        if (targetLine !== -1) {
          const range = new vscode.Range(targetLine, 0, targetLine, 0);
          // const editor = vscode.window.activeTextEditor;
          editor.selection = new vscode.Selection(range.start, range.end);
          editor?.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
      }
    }
  }
}
