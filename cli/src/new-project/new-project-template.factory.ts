import { ProjectTemplates, ProjectType } from 'src/new-project/new-project.models';

export class NewProjectTemplateFactory {
  public static create(projectType: ProjectType): ProjectTemplates {
    return {
      baseTemplate: this.getBaseTemplatePath(projectType),
      configurationTemplate: this.getConfigurationTemplatePath(projectType),
      sampleTemplate: this.getSampleTemplatePath(projectType),
    };
  }

  private static getBaseTemplatePath(projectType: ProjectType): string {
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
        return './templates/z80asm_dev_environment_base.zip';
      case 'ZxSpectrumZ88dk':
        return './templates/z88dk_dev_environment_base.zip';
      case 'ZxSpectrumZ88dkNext':
        return './templates/z88dk_dev_environment_base.zip';
      default:
        throw new Error('Invalid project type');
    }
  }

  private static getConfigurationTemplatePath(projectType: ProjectType): string | undefined {
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
        return undefined;
      case 'ZxSpectrumZ88dk':
        return undefined;
      case 'ZxSpectrumZ88dkNext':
        return undefined;
      default:
        throw new Error('Invalid project type');
    }
  }

  private static getSampleTemplatePath(projectType: ProjectType): string | undefined {
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
        return './templates/z80asm_dev_environment_sample.zip';
      case 'ZxSpectrumZ88dk':
        return './templates/z88dk_dev_environment_sample.zip';
      case 'ZxSpectrumZ88dkNext':
        return './templates/z88dk_dev_environment_sample.zip';
      default:
        throw new Error('Invalid project type');
    }
  }
}
