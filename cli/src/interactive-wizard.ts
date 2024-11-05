import * as prompts from '@inquirer/prompts';
import { CreateNewProjectModel, ProjectType } from 'src/models/CreateNewProjectModel';

export class InteractiveWizard {
  constructor() {}

  public async execute(): Promise<CreateNewProjectModel> {
    return {
      projectType: await this.selectProjectType(),
    };
  }

  private async selectProjectType(): Promise<ProjectType> {
    return await prompts.select({
      message: 'Select project type',
      choices: [
        {
          name: 'Zx Spectrum sjasmplus',
          value: 'ZxSpectrumsjasmplus',
          description: 'Zx Spectrum sjasmplus assembly project',
        },
        {
          name: 'Zx Spectrum z88dk',
          value: 'ZxSpectrumZ88dk',
          description: 'Zx Spectrum z88dk C project',
        },
        new prompts.Separator(),
        {
          name: 'Zx Spectrum PASMO',
          value: 'ZxSpectrumPASMO',
          disabled: true,
        },
      ],
    });
  }
}
