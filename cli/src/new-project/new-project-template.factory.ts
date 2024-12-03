import * as path from 'path';
import { ProjectTemplates, ProjectType } from 'src/new-project/new-project.models';

export class NewProjectTemplateFactory {
  public static create(projectType: ProjectType): ProjectTemplates {
    return {
      baseTemplate: this.getBaseTemplatePath(projectType),
      sampleTemplate: this.getSampleTemplatePath(projectType),
      configurationTemplate: this.getConfigurationTemplatePath(projectType),
    };
  }

  private static getAbsolutePath(relativePath: string): string {
    return path.join(__dirname, relativePath);
  }

  private static getBaseTemplatePath(projectType: ProjectType): string {
    const path = `./templates/${projectType}_base.zip`;
    return this.getAbsolutePath(path);
  }

  private static getSampleTemplatePath(projectType: ProjectType): string | undefined {
    switch (projectType) {
      case 'ZxSpectrumZ88dkNext':
        return undefined;
      default:
        return this.getAbsolutePath(`./templates/${projectType}_sample.zip`);
    }
  }

  private static getConfigurationTemplatePath(projectType: ProjectType): string | undefined {
    switch (projectType) {
      case 'ZxSpectrumSjasmplus':
      case 'ZxSpectrumZ88dk':
      case 'ZxSpectrumZ88dkNext':
        return undefined;
      default:
        return this.getAbsolutePath(`./templates/${projectType}_configuration.zip`);
    }
  }
}
