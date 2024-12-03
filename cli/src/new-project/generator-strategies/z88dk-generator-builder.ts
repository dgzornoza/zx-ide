import * as path from 'path';
import { NewProjectModel } from '../new-project.models';
import { GeneratorBuilder } from './generator-builder';

export class Z88dkGeneratorBuilder extends GeneratorBuilder {
  constructor(newProjectModel: NewProjectModel) {
    super(newProjectModel);
  }

  async CopyTemplateBase(): Promise<void> {
    const path = this.getAbsolutePath(`./templates/${this.newProjectModel.projectType}_base.zip`);
    this.copyTemplate(path);
  }

  async CopyTemplateSample(): Promise<void> {
    const path = this.getAbsolutePath(`./templates/${this.newProjectModel.projectType}_sample.zip`);
    this.copyTemplate(path);
  }

  async ConfigureProject(): Promise<void> {
    this.setProjectName();
    // TODO: dgzornoza - configurar includes, defines y argumentos de compilador.
  }

  private setProjectName(): void {
    // set project name as output name in files, project name in templates is {ZX-IDE_PROJECT_NAME}.
    this.replaceValueInFile(path.join(this.targetFolder, 'Makefile'), '{ZX-IDE_PROJECT_NAME}', this.newProjectModel.projectName);
    this.replaceValueInFile(
      path.join(this.targetFolder, '.vscode', 'launch.json'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
  }
}
