import * as path from 'path';
import { FileHelpers } from '../../helpers/file.helpers';
import { ZX_ZXIDE_CLI_VERSION, ZxideFile } from '../../infrastructure';
import { NewProjectModel } from '../new-project.models';

export abstract class GeneratorBuilder {
  protected readonly newProjectModel: NewProjectModel;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
  }

  abstract copyTemplateBase(): Promise<void>;
  abstract copyTemplateSample(): Promise<void>;
  abstract configureProject(): Promise<void>;

  createZxIdeProjectFile(): Promise<void> {
    const fileConfiguration = {
      'zx-ide-cli-version': ZX_ZXIDE_CLI_VERSION,
      project: {
        type: this.newProjectModel.projectType,
      },
    } as ZxideFile;

    FileHelpers.writeJsonFile(fileConfiguration, path.join(this.newProjectModel.projectPath, '.zxide.json'));

    return Promise.resolve();
  }
}
