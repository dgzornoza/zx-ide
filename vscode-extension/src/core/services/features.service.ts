import { FileHelpers } from '@core/helpers/file-helpers';
import { ProjectType } from '@core/infrastructure';
import * as vscode from 'vscode';

interface IZxideFile {
  'template-version': string;
  project: {
    type: ProjectType;
  };
}

export class FeaturesService {
  static zxideFile?: IZxideFile;

  static async isZ88dkProject(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project?.type === 'ZxSpectrumZ88dk';
  }

  static async isSjasmplusProject(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project?.type === 'ZxSpectrumSjasmplus';
  }

  private static async initialize(): Promise<void> {
    FeaturesService.zxideFile = await FileHelpers.readJsonFile('.zxide');    
    vscode.commands.executeCommand('setContext', 'ZxIdeProjectType', FeaturesService.zxideFile?.project?.type);
  }
}
