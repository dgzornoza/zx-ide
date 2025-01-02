import * as prompts from '@inquirer/prompts';
import { ProjectType } from 'src/infrastructure';
import { FileHelpers } from '../helpers/file.helpers';
import { NewProjectModel } from './new-project.models';
import { WizardStrategyFactory } from './wizard-strategies/wizard-strategy-factory';

export class NewProjectWizard {
  constructor() {}

  public async execute(): Promise<NewProjectModel> {
    const projectType = await this.selectProjectType();
    let projectPath = await this.selectProjectPath();
    projectPath = FileHelpers.getRealSystemPath(projectPath);
    const projectName = await this.selectProjectName();

    // configure specific project type configurations
    const strategy = WizardStrategyFactory.createStragegy(projectType);
    const machineType = await strategy.selectMachine();
    const projectConfigurationType = await strategy.selectProjectConfiguration();
    const useSample = await this.selectUseSample();

    return new NewProjectModel(projectType, projectPath, projectName, machineType, projectConfigurationType, useSample);
  }

  private async selectProjectType(): Promise<ProjectType> {
    return await prompts.select({
      message: 'Select project type',
      choices: [
        {
          name: 'sjasmplus (asm language)',
          value: 'sjasmplus',
          description: 'sjasmplus assembly language project',
        },
        {
          name: 'z88dk (c language)',
          value: 'z88dk',
          description: 'z88dk C language project',
        },
      ],
    });
  }

  private async selectProjectPath(): Promise<string> {
    return await prompts.input({
      message: 'Project path?',
    });
  }

  private async selectProjectName(): Promise<string> {
    return await prompts.input({
      message: 'Project name (should be unique in docker containers) ?',
    });
  }

  private async selectUseSample(): Promise<boolean> {
    return await prompts.confirm({
      message: 'Use sample project?',
      default: true,
    });
  }
}
