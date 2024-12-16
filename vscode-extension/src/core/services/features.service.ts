import { FileHelpers } from '@core/helpers/file-helpers';
import { ZxideFile } from '@core/infrastructure';
import * as vscode from 'vscode';

export class FeaturesService {
  static zxideFile?: ZxideFile;

  static async isZ88dkProject(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project?.type === 'z88dk';
  }

  static async isSjasmplusProject(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project?.type === 'sjasmplus';
  }

  private static async initialize(): Promise<void> {
    const fileUri = FileHelpers.getRelativePathsUri('.zxide.json');

    if (await FileHelpers.fileExists(fileUri)) {
      FeaturesService.zxideFile = await FileHelpers.readWorkspaceJsonFile('.zxide.json');
      vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
    }
  }
}
