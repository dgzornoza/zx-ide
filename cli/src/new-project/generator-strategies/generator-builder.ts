import * as path from 'path';
import { FileHelpers } from '../../helpers/file.helpers';
import { ZxideFile } from '../../infrastructure';
import { NewProjectModel } from '../new-project.models';

export abstract class GeneratorBuilder {
  protected readonly newProjectModel: NewProjectModel;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
  }

  abstract copyTemplateBase(): Promise<void>;
  abstract copyTemplateSample(): Promise<void>;
  abstract configureProject(): Promise<void>;

  createProjectFile(): Promise<void> {
    const fileConfiguration = {
      'template-version': '1.0.0',
      project: {
        type: this.newProjectModel.projectType,
      },
    } as ZxideFile;

    FileHelpers.writeJsonFile(fileConfiguration, path.join(this.newProjectModel.targetFolder, '.zxide.json'));

    return Promise.resolve();
  }
}
