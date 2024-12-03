import * as prompts from '@inquirer/prompts';
import { NewProjectModel, ProjectType } from './new-project.models';
import { WizardStrategyFactory } from './wizard-strategies/wizard-strategy-factory';

export class NewProjectWizard {
  constructor() {}

  public async execute(): Promise<NewProjectModel> {
    const result = {
      projectType: await this.selectProjectType(),
      projectPath: await this.selectProjectPath(),
      projectName: await this.selectProjectName(),
      useSample: await this.selectUseSample(),
    } as NewProjectModel;

    // configure specific project type configurations
    const strategy = WizardStrategyFactory.createStragegy(result.projectType);
    result.machineType = await strategy.selectMachine();
    result.projectConfigurationType = await strategy.selectProjectConfiguration();

    return result;
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
