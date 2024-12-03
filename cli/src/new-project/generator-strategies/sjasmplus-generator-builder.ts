import { NewProjectModel } from '../new-project.models';
import { GeneratorBuilder } from './generator-builder';

export class SjasmplusGeneratorBuilder extends GeneratorBuilder {
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

  ConfigureProject(): Promise<void> {
    return Promise.resolve();
  }
}
