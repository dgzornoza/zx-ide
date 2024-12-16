import * as prompts from '@inquirer/prompts';
import { IWizardStrategy } from 'src/new-project/wizard-strategies/wizard-strategy-factory';
import { MachineType, ProjectConfigurationType } from '../../infrastructure';

export class SjasmplusWizardStrategy implements IWizardStrategy {
  async selectMachine(): Promise<MachineType | undefined> {
    return await prompts.select({
      message: 'Select machine type',
      choices: [
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
