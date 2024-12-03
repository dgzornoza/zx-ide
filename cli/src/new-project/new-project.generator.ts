import * as fs from 'fs';
import * as StreamZip from 'node-stream-zip';
import * as path from 'path';
import { NewProjectTemplateFactory } from './new-project-template.factory';
import { NewProjectModel, ProjectType } from './new-project.models';

export class NewProjectGenerator {
  constructor() {}

  public async execute(newProjectModel: NewProjectModel): Promise<void> {
    console.log('Generating new project...' + newProjectModel);

    let targetFolder: string | undefined = undefined;
    try {
      const projectTemplates = NewProjectTemplateFactory.create(newProjectModel.projectType);
      const targetFolder = path.join(newProjectModel.projectPath, newProjectModel.projectName);

      // 1.- template base
      await this.copyTemplate(projectTemplates.baseTemplate, targetFolder);

      // 2.- template sample
      if (newProjectModel.useSample && projectTemplates.sampleTemplate) {
        await this.copyTemplate(projectTemplates.sampleTemplate, targetFolder);
      }

      // 3.- template configuration
      if (projectTemplates.configurationTemplate) {
        await this.copyTemplate(projectTemplates.configurationTemplate, targetFolder);
      }

      // 4.- set output project name (in makefile)
      this.setProjectName(newProjectModel.projectType, targetFolder, newProjectModel.projectName);

      console.log('Project generated in: ' + targetFolder);
    } catch (err) {
      console.error('Error creating project:', err);
    }
  }

  private async copyTemplate(templateFilePath: string, targetFolder: string): Promise<void> {
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

  private setProjectName(projectType: ProjectType, targetFolder: string, projectName: string): void {
    switch (projectType) {
      case 'ZxSpectrumZ88dk':
        // z88dk set project name in makefile
        this.replaceValueInFile(path.join(targetFolder, 'Makefile'), '{ZX-IDE_PROJECT_NAME}', projectName);
        break;
    }
  }

  private replaceValueInFile(filePath: string, oldValue: string, newValue: string): void {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const newContent = fileContent.replace(oldValue, newValue);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}
