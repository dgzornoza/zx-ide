import * as prompts from '@inquirer/prompts';
import { NewProjectModel, ProjectType } from 'src/new-project/new-project.models';

export class NewProjectWizard {
  constructor() {}

  public async execute(): Promise<NewProjectModel> {
    return {
      projectType: await this.selectProjectType(),
      projectPath: await this.selectProjectPath(),
      projectName: await this.selectProjectName(),
      useSample: await this.selectUseSample(),
    };
  }

  private async selectProjectType(): Promise<ProjectType> {
    return await prompts.select({
      message: 'Select project type',
      choices: [
        {
          name: 'Zx Spectrum sjasmplus',
          value: 'ZxSpectrumSjasmplus',
          description: 'Zx Spectrum sjasmplus assembly project',
        },
        {
          name: 'Zx Spectrum z88dk',
          value: 'ZxSpectrumZ88dk',
          description: 'Zx Spectrum z88dk C project',
        },
        new prompts.Separator(),
        {
          name: 'Zx Spectrum next z88dk',
          value: 'ZxSpectrumZ88dkNext',
          disabled: true,
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
