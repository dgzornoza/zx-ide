import { FileHelpers } from '@core/helpers/file-helpers';
import { Logger } from '@core/logger';
import { Edit, modify, parse } from 'jsonc-parser';
import * as vscode from 'vscode';

export class WorkspaceHelpers {
  private static _zxideWorkspaceFolder?: vscode.WorkspaceFolder;

  /**
   * Get workspace path ended with slash
   */
  public static async getWorkspacePath(): Promise<string> {
    const folder = await WorkspaceHelpers.findZxideWorkspaceFolder();
    return folder.uri.path.replace(/\/?$/, '/');
  }

  public static async getWorkspaceUri(...relativePathSegments: string[]): Promise<vscode.Uri> {
    const folder = await WorkspaceHelpers.findZxideWorkspaceFolder();
    return vscode.Uri.joinPath(folder.uri, ...relativePathSegments);
  }

  public static async workspaceFileExists(...relativePathSegments: string[]): Promise<boolean> {
    const fileUri = await WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    return await FileHelpers.fileExists(fileUri);
  }

  public static async readWorkspaceFile(...relativePathSegments: string[]): Promise<string> {
    const fileUri = await WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    return await FileHelpers.readFile(fileUri);
  }

  public static async readWorkspaceJsonFile<T>(...relativePathSegments: string[]): Promise<T> {
    const fileText = await WorkspaceHelpers.readWorkspaceFile(...relativePathSegments);
    try {
      return parse(fileText);
    } catch (error) {
      Logger.error(`Error parse json data in file '${relativePathSegments.at(-1)}': ${error}`);
      throw error;
    }
  }

  public static async writeWorkspaceFile(content: string, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = await WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
    await FileHelpers.writeFile(content, fileUri);
  }

  /**
   * Modifies a JSONC file in the workspace, modifing only the specified path if provided.
   * @param instance The value to set at the given path (or the whole document if path is not provided)
   * @param relativePathSegments Path segments to the file
   * @param path Optional path (array of string|number) to the property to modify. If omitted, replaces the whole document.
   */
  public static async writeWorkspaceJsonFile(instance: unknown, relativePathSegments: string[], path?: (string | number)[]): Promise<void> {
    // Local helper to apply edits to text
    function applyEdits(text: string, edits: Edit[]): string {
      let offset = 0;
      for (const edit of edits) {
        text = text.slice(0, edit.offset + offset) + edit.content + text.slice(edit.offset + edit.length + offset);
        offset += edit.content.length - edit.length;
      }
      return text;
    }

    const fileUri = await WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);

    if (await FileHelpers.fileExists(fileUri)) {
      const originalText = await FileHelpers.readFile(fileUri);
      // Use the provided path or [] (whole document)
      const edits = modify(originalText, path ?? [], instance, { formattingOptions: { insertSpaces: true, tabSize: 4, eol: '\n' } });
      const newText = applyEdits(originalText, edits);
      await FileHelpers.writeFile(newText, fileUri);
    } else {
      // file not exists, create new file with content
      const content = JSON.stringify(instance, null, 4);
      await FileHelpers.writeFile(content, fileUri);
    }
  }

  // Overload for backward compatibility (old signature)
  public static async writeWorkspaceJsonFile_Compat(instance: unknown, ...relativePathSegments: string[]): Promise<void> {
    return WorkspaceHelpers.writeWorkspaceJsonFile(instance, relativePathSegments);
  }

  public static async openWorkspaceFile(findLineRegex?: RegExp, ...relativePathSegments: string[]): Promise<void> {
    const fileUri = await WorkspaceHelpers.getWorkspaceUri(...relativePathSegments);
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

  /**
   * Finds the workspace folder containing the .zxide.json file. Caches the result for future calls.
   * @returns The workspace folder containing the .zxide.json file.
   */
  private static async findZxideWorkspaceFolder(): Promise<vscode.WorkspaceFolder> {
    if (WorkspaceHelpers._zxideWorkspaceFolder) {
      return WorkspaceHelpers._zxideWorkspaceFolder;
    }
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      throw new Error(vscode.l10n.t('No workspace folders found'));
    }
    for (const folder of vscode.workspace.workspaceFolders) {
      const zxideUri = vscode.Uri.joinPath(folder.uri, '.zxide.json');
      if (await FileHelpers.fileExists(zxideUri)) {
        WorkspaceHelpers._zxideWorkspaceFolder = folder;
        return folder;
      }
    }
    throw new Error(vscode.l10n.t('No workspace folder containing .zxide.json was found'));
  }
}
