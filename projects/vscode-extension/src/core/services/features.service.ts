import { FileHelpers } from '@core/helpers/file-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { Logger } from '@core/logger';
import * as vscode from 'vscode';
import { ProjectType } from 'externalShared/infrastructure';
import { ZxideFile } from 'externalShared/zxide-project';

export class FeaturesService {
  static zxideFile?: ZxideFile;
  private static fileWatcher?: vscode.FileSystemWatcher;

  /** Project type from `.zxide.json`; `undefined` when the workspace has no readable `.zxide.json`. */
  static async getProjectType(): Promise<ProjectType | undefined> {
    if (!FeaturesService.zxideFile) {
      try {
        await FeaturesService.initialize();
      } catch (error) {
        Logger.log(`No zx-ide project type available: ${error}`);
      }
    }

    return FeaturesService.zxideFile?.project?.type;
  }

  private static async initialize(): Promise<void> {
    const fileUri = await WorkspaceHelpers.getWorkspaceUri('.zxide.json');

    if (await FileHelpers.fileExists(fileUri)) {
      FeaturesService.zxideFile = await WorkspaceHelpers.readWorkspaceJsonFile('.zxide.json');
      vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
      await FeaturesService.setupFileWatcher();
    }
  }

  /** Watch for changes in the .zxide.json file */
  private static async setupFileWatcher(): Promise<void> {
    if (FeaturesService.fileWatcher) {
      return;
    }

    const fileUri = await WorkspaceHelpers.getWorkspaceUri('.zxide.json');
    FeaturesService.fileWatcher = vscode.workspace.createFileSystemWatcher(fileUri.fsPath);

    FeaturesService.fileWatcher.onDidChange(async () => {
      try {
        FeaturesService.zxideFile = await WorkspaceHelpers.readWorkspaceJsonFile('.zxide.json');
        vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
      } catch (error) {
        // keep the last valid content while the file is being edited
        Logger.error(`Error reading .zxide.json: ${error}`);
      }
    });
  }
}
