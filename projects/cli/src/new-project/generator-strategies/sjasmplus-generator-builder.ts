import * as path from 'path';
import { MachineType } from 'src/infrastructure';
import { FileHelpers } from '../../helpers/file.helpers';
import { NewProjectModel } from '../new-project.models';
import { GeneratorBuilder } from './generator-builder';

export class SjasmplusGeneratorBuilder extends GeneratorBuilder {
  private projectConfigurationStrategy: IProjectConfigurationStrategy;

  constructor(newProjectModel: NewProjectModel) {
    super(newProjectModel);
    this.projectConfigurationStrategy = ProjectConfigurationStrategyFactory.create(newProjectModel.machineType!);
  }

  async copyTemplateBase(): Promise<void> {
    const path = FileHelpers.getAbsolutePath(`./templates/${this.newProjectModel.projectType}_base.zip`);
    await FileHelpers.copyTemplate(path, this.newProjectModel.projectPath);
  }

  async copyTemplateSample(): Promise<void> {
    const path = FileHelpers.getAbsolutePath(
      `./templates/${this.newProjectModel.projectType}_${this.newProjectModel.machineType}_sample.zip`
    );

    await FileHelpers.copyTemplate(path, this.newProjectModel.projectPath);
  }

  configureProject(): Promise<void> {
    this.configureProjectName();
    this.configureSourceFiles();

    return Promise.resolve();
  }

  private configureSourceFiles(): void {
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, 'src', '_sjasmplus.asm'),
      '{ZX-IDE_PROJECT_MACHINE}',
      this.projectConfigurationStrategy.machines.join('\n')
    );

    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, 'src', '_sjasmplus.asm'),
      '{ZX-IDE_PROJECT_OUTPUT_FILE}',
      this.projectConfigurationStrategy.ouputFile(this.newProjectModel.projectName).join('\n')
    );
  }

  private configureProjectName(): void {
    // set project name as output name in files, project name in templates should be {ZX-IDE_PROJECT_NAME}.
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, 'src', '_sjasmplus.asm'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, '.vscode', 'launch.json'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, '.vscode', 'tasks.json'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, '.devcontainer', 'devcontainer.json'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
  }
}

class ProjectConfigurationStrategyFactory {
  static create(projectConfiguration: MachineType): IProjectConfigurationStrategy {
    switch (projectConfiguration) {
      case 'zxspectrum':
        return new ZxSpectrumConfigurationStrategy();
      default:
        throw new Error(`Unsupported machine type: ${projectConfiguration}`);
    }
  }
}

interface IProjectConfigurationStrategy {
  machines: string[];
  ouputFile(projectName: string): string[];
}

class ZxSpectrumConfigurationStrategy implements IProjectConfigurationStrategy {
  machines = ['DEVICE ZXSPECTRUM48', '\t;DEVICE ZXSPECTRUM128'];
  ouputFile(projectName: string): string[] {
    return ['; SET Program name', `\tSAVESNA "bin/${projectName}.sna", Main`];
  }
}
