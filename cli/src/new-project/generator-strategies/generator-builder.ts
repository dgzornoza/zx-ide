import { NewProjectModel } from 'src/new-project/new-project.models';

export abstract class GeneratorBuilder {
  protected readonly newProjectModel: NewProjectModel;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
  }

  abstract copyTemplateBase(): Promise<void>;
  abstract copyTemplateSample(): Promise<void>;
  abstract configureProject(): Promise<void>;
}
