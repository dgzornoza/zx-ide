import { FileHelpers } from '@core/helpers/file-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { ProjectType, ZxideFile } from '@core/infrastructure';
import * as vscode from 'vscode';

export class FeaturesService {
  static zxideFile?: ZxideFile;
  private static fileWatcher?: vscode.FileSystemWatcher;

  static async getProjectType(): Promise<ProjectType | undefined> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project?.type;
  }

  private static async initialize(): Promise<void> {
    const fileUri = WorkspaceHelpers.getWorkspaceUri('.zxide.json');

    if (await FileHelpers.fileExists(fileUri)) {
      FeaturesService.zxideFile = await WorkspaceHelpers.readWorkspaceJsonFile('.zxide.json');
      vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
      FeaturesService.setupFileWatcher();
    }
  }

  /** Watch for changes in the .zxide.json file */
  private static setupFileWatcher(): void {
    if (FeaturesService.fileWatcher) {
      return;
    }

    const fileUri = WorkspaceHelpers.getWorkspaceUri('.zxide.json');
    FeaturesService.fileWatcher = vscode.workspace.createFileSystemWatcher(fileUri.fsPath);

    FeaturesService.fileWatcher.onDidChange(async () => {
      FeaturesService.zxideFile = await WorkspaceHelpers.readWorkspaceJsonFile('.zxide.json');
      vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
    });
  }
}
