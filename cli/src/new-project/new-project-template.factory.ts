import * as path from 'path';
import { ProjectTemplates, ProjectType } from 'src/new-project/new-project.models';

export class NewProjectTemplateFactory {
  public static create(projectType: ProjectType): ProjectTemplates {
    return {
      baseTemplate: this.getBaseTemplatePath(projectType),
      configurationTemplate: this.getConfigurationTemplatePath(projectType),
      sampleTemplate: this.getSampleTemplatePath(projectType),
    };
  }

  private static getAbsolutePath(relativePath: string): string {
    const currentDirectory = process.cwd();
    return path.join(currentDirectory, 'dist', relativePath);
  }

  private static getBaseTemplatePath(projectType: ProjectType): string {
    let path: string;
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
        path = '/templates/z80asm_dev_environment_base.zip';
        break;
      case 'ZxSpectrumZ88dk':
        path = '/templates/z88dk_dev_environment_base.zip';
        break;
      case 'ZxSpectrumZ88dkNext':
        path = '/templates/z88dk_dev_environment_base.zip';
        break;
      default:
        throw new Error('Invalid project type');
    }

    return this.getAbsolutePath(path);
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
    let path: string;
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
        path = './templates/z80asm_dev_environment_sample.zip';
        break;
      case 'ZxSpectrumZ88dk':
        path = './templates/z88dk_dev_environment_sample.zip';
        break;
      case 'ZxSpectrumZ88dkNext':
        path = './templates/z88dk_dev_environment_sample.zip';
        break;
      default:
        throw new Error('Invalid project type');
    }

    return this.getAbsolutePath(path);
  }
}
