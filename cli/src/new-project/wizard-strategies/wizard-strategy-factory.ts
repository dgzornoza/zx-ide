import { MachineType, ProjectConfigurationType, ProjectType } from '../new-project.models';
import { SjasmplusWizardStrategy } from './sjasmplus-wizard-strategy';
import { Z88dkWizardStrategy } from './z88dk-wizard-strategy';

export class WizardStrategyFactory {
  public static createStragegy(ProjectType: ProjectType): IWizardStrategy {
    switch (ProjectType) {
      case 'sjasmplus':
        return new SjasmplusWizardStrategy();
      case 'z88dk':
        return new Z88dkWizardStrategy();
      default:
        throw new Error('Project type not supported');
    }
  }
}

export interface IWizardStrategy {
  selectMachine(): Promise<MachineType | undefined>;
  selectProjectConfiguration(): Promise<ProjectConfigurationType | undefined>;
}
