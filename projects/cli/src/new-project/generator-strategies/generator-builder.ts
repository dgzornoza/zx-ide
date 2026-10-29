import * as path from 'path';
import { FileHelpers } from '../../helpers/file.helpers';
import {
  DEFAULT_ASSETS_GRAPHICS_PATH,
  DEFAULT_GRAPHICS_DATA_FOLDER_PATH,
  NewProjectModel,
  ZxideFile,
} from '../../../../shared/zxide-project';
import { ZX_IDE_TEMPLATE_VERSION, ZX_ZXIDE_CLI_VERSION } from '../../infrastructure';

export abstract class GeneratorBuilder {
  protected readonly newProjectModel: NewProjectModel;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
  }

  abstract copyTemplateBase(): Promise<void>;
  abstract copyTemplateSample(): Promise<void>;
  abstract configureProject(): Promise<void>;

  createZxIdeProjectFile(): Promise<void> {
    const fileConfiguration: ZxideFile = {
      'zx-ide-cli-version': ZX_ZXIDE_CLI_VERSION,
      'template-version': ZX_IDE_TEMPLATE_VERSION,
      project: {
        type: this.newProjectModel.projectType,
        assetsGraphicsPaths: [DEFAULT_ASSETS_GRAPHICS_PATH],
        graphicsDataFolderPath: DEFAULT_GRAPHICS_DATA_FOLDER_PATH,
      },
    };

    FileHelpers.writeJsonFile(fileConfiguration, path.join(this.newProjectModel.projectPath, '.zxide.json'));

    return Promise.resolve();
  }
}
