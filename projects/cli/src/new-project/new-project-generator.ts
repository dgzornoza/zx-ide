import { GeneratorBuilder } from './generator-strategies/generator-builder';
import { SjasmplusGeneratorBuilder } from './generator-strategies/sjasmplus-generator-builder';
import { Z88dkGeneratorBuilder } from './generator-strategies/z88dk-generator-builder';
import { NewProjectModel } from './new-project.models';

export class NewProjectGenerator {
  constructor() {}

  public async execute(newProjectModel: NewProjectModel): Promise<void> {
    console.log('Generating new project...' + newProjectModel.projectName);

    let builder: GeneratorBuilder;
    switch (newProjectModel.projectType) {
      case 'sjasmplus':
        builder = new SjasmplusGeneratorBuilder(newProjectModel);
        break;
      case 'z88dk':
        builder = new Z88dkGeneratorBuilder(newProjectModel);
        break;
      default:
        throw new Error('Project type not supported');
    }

    try {
      await builder.configureWorkspace();

      await builder.copyTemplateBase();

      if (newProjectModel.useSample) {
        await builder.copyTemplateSample();
      }

      await builder.configureProject();

      console.log('Project generated in: ' + newProjectModel.projectPath);
    } catch (err) {
      console.error('Error creating project:', err);
    }
  }
}
