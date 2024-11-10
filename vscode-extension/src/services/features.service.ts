import { Logger } from '@core/logger';
import * as path from 'path';
import * as vscode from 'vscode';

type ProjectType = 'ZxSpectrumSjasmplus' | 'ZxSpectrumZ88dk' | 'ZxSpectrumZ88dkNext';
type Compiler = 'sjasmplus' | 'z88dk';

interface IZxideFile {
  'template-version': string;
  project: {
    type: ProjectType;
    compiler: Compiler;
  };
}

export class FeaturesService {
  static zxideFile?: IZxideFile;

  static async isValidZxideProject(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return !!FeaturesService.zxideFile?.project.type;
  }

  static async canUseBreakpointService(): Promise<boolean> {
    if (!FeaturesService.zxideFile) {
      await FeaturesService.initialize();
    }

    return FeaturesService.zxideFile?.project.compiler === 'z88dk';
  }

  private static async initialize(): Promise<void> {
    FeaturesService.zxideFile = await this.readZxideFile();
  }

  private static async readZxideFile(): Promise<IZxideFile | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      // read .zxide file
      const fileUri = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, '.zxide'));

      try {
        // Leer el archivo
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const fileText = Buffer.from(fileContent).toString('utf8');

        const json: IZxideFile = JSON.parse(fileText);
        return json;
      } catch (error) {
        Logger.error(`Error reading .zxide properties file: ${error}`);
      }
    }

    return undefined;
  }
}
