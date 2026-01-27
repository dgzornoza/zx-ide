import * as prompts from '@inquirer/prompts';
import { IWizardStrategy } from 'src/new-project/wizard-strategies/wizard-strategy-factory';
import { MachineType, ProjectConfigurationType } from '../../infrastructure';

export class Z88dkWizardStrategy implements IWizardStrategy {
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

  async selectProjectConfiguration(): Promise<ProjectConfigurationType | undefined> {
    return await prompts.select({
      message: 'Select configuration type',
      choices: [
        {
          name: 'sdcc new lib (iy registers)',
          value: 'z88dk_sdcc_new_lib',
          description: 'sdcc compiler using new library',
        },
        {
          name: 'sccz80 new lib',
          value: 'z88dk_sccz80_new_lib',
          description: 'sccz80 compiler using new library',
        },
        {
          name: 'sdcc classic lib',
          value: 'z88dk_sdcc_classic_lib',
          description: 'sdcc compiler using classic library',
        },
        {
          name: 'sccz80 classic lib (unable debug)',
          value: 'z88dk_sccz80_classic_lib',
          description: 'sccz80 compiler using classic library',
        },
      ],
    });
  }
}
