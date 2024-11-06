import * as fs from 'fs';
import * as StreamZip from 'node-stream-zip';
import * as path from 'path';
import { NewProjectTemplateFactory } from './new-project-template.factory';
import { NewProjectModel } from './new-project.models';

export class NewProjectGenerator {
  constructor() {}

  public async execute(newProjectModel: NewProjectModel): Promise<void> {
    console.log('Generating new project...' + newProjectModel);

    try {
      const projectTemplates = NewProjectTemplateFactory.create(newProjectModel.projectType);
      // template base
      await this.copyTemplate(projectTemplates.baseTemplate, newProjectModel.projectPath, newProjectModel.projectName);

      // template sample
      if (newProjectModel.useSample && projectTemplates.sampleTemplate) {
        await this.copyTemplate(projectTemplates.sampleTemplate, newProjectModel.projectPath, newProjectModel.projectName);
      }

      // template configuration
      if (projectTemplates.configurationTemplate) {
        await this.copyTemplate(projectTemplates.configurationTemplate, newProjectModel.projectPath, newProjectModel.projectName);
      }

      console.log('template copied.');
    } catch (err) {
      console.error('Error creating project:', err);
    }
  }

  private async copyTemplate(templateFilePath: string, targetDir: string, targetName: string): Promise<void> {
    const targetFolder = path.join(targetDir, targetName);
    const templateFileName = path.basename(templateFilePath);
    const targetTemplatePath = path.join(targetFolder, templateFileName);

    // ensure exists target directory
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Copy the ZIP file to the target directory
    fs.copyFileSync(templateFilePath, targetTemplatePath);

    // Unzip the ZIP file into the target directory
    const zip = new StreamZip.async({ file: targetTemplatePath });
    await zip.extract(null, targetFolder);
    await zip.close();

    // Delete the ZIP file
    fs.unlinkSync(targetTemplatePath);
  }
}
