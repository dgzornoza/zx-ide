import * as prompts from '@inquirer/prompts';
import { MachineType, ProjectConfigurationType } from 'src/new-project/new-project.models';
import { IWizardStrategy } from 'src/new-project/wizard-strategies/wizard-strategy-factory';

export class SjasmplusWizardStrategy implements IWizardStrategy {
  async selectMachine(): Promise<MachineType | undefined> {
    return await prompts.select({
      message: 'Select machine type',
      choices: [
        {
          name: 'Universal',
          value: 'universal',
          description: 'without machine specific settings',
        },
        {
          name: 'Zx Spectrum',
          value: 'zxspectrum',
          description: 'Zx Spectrum machine',
        },
      ],
    });
  }

  selectProjectConfiguration(): Promise<ProjectConfigurationType | undefined> {
    return Promise.resolve(undefined);
  }
}
