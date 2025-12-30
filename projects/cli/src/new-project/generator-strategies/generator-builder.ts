import * as path from 'path';
import { FileHelpers } from '../../helpers/file.helpers';
import { IWorkspaceJsonFile, ZX_ZXIDE_CLI_VERSION, ZxideFile } from '../../infrastructure';
import { NewProjectModel } from '../new-project.models';

export abstract class GeneratorBuilder {
  protected readonly newProjectModel: NewProjectModel;

  private zxIdeFilePath: string;
  private vsCodeDevContainerPath: string;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
    this.zxIdeFilePath = path.join(this.newProjectModel.workspacesPath, '.zxide.json');
    this.vsCodeDevContainerPath = path.join(this.newProjectModel.workspacesPath, '.devcontainer', 'devcontainer.json');
  }

  abstract copyTemplateBase(): Promise<void>;
  abstract copyTemplateSample(): Promise<void>;
  abstract configureProject(): Promise<void>;

  /** Configure workspace */
  configureWorkspace(): Promise<void> {
    // update workspace files if is new workspace or zxide-cli version has changed
    let needsUpdate = true;
    if (FileHelpers.exists(this.zxIdeFilePath)) {
      const zxideWorkspaceConfiguration = FileHelpers.readJsonFile<ZxideFile>(this.zxIdeFilePath);
      needsUpdate = zxideWorkspaceConfiguration['zx-ide-cli-version'] !== ZX_ZXIDE_CLI_VERSION;
    }

    if (needsUpdate) {
      this.updateDevContainerConfiguration();
      this.updateZxideWorkspaceConfiguration();
    }

    this.createVscodeWorkspaceProjectFile();
    return Promise.resolve();
  }

  private updateDevContainerConfiguration(): void {
    const fileContent = {
      name: this.newProjectModel.workspacesPath.split(path.sep).pop(),
      image: 'dgzornoza/zxide-dev:latest',
      runArgs: ['--name=${localWorkspaceFolderBasename}'],
      customizations: {
        vscode: {
          extensions: [
            // common extensions
            'dgzornoza.zxide',
            'dbaeumer.vscode-eslint',
            'esbenp.prettier-vscode',
            'editorconfig.editorconfig',
            // asm extensions
            'mutantdino.resourcemonitor',
            'maziac.dezog',
            'maziac.asm-code-lens',
            'maziac.hex-hover-converter',
            'maziac.sna-fileviewer',
            'maziac.z80-instruction-set',
            'theNestruo.z80-asm-meter',
            // c/c++ extensions
            'ms-vscode.cpptools-extension-pack',
            'ms-vscode.makefile-tools',
          ],
        },
      },
    };

    FileHelpers.writeJsonFile(fileContent, this.vsCodeDevContainerPath);
  }

  private updateZxideWorkspaceConfiguration(): void {
    const fileConfiguration = {
      'zx-ide-cli-version': ZX_ZXIDE_CLI_VERSION,
    } as ZxideFile;

    // create or update .zxide.json
    FileHelpers.writeJsonFile(fileConfiguration, this.zxIdeFilePath);
  }

  private createVscodeWorkspaceProjectFile(): void {
    const workspaceFilePath = path.join(this.newProjectModel.workspacesPath, `${this.newProjectModel.projectName}.code-workspace`);

    if (FileHelpers.exists(workspaceFilePath)) {
      throw new Error(`Project ${workspaceFilePath} already exists.`);
    }

    const workspaceFileContent = {
      folders: [
        {
          name: this.newProjectModel.projectName,
          path: this.newProjectModel.projectName,
        },
      ],
      settings: {
        'eslint.workingDirectories': [
          {
            directory: `${this.newProjectModel.projectName}`,
          },
        ],
      },
    } as IWorkspaceJsonFile;

    FileHelpers.writeJsonFile(workspaceFileContent, workspaceFilePath);
  }
}
