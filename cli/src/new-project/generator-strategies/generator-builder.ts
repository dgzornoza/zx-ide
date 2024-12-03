import * as fs from 'fs';
import * as StreamZip from 'node-stream-zip';
import * as path from 'path';
import { NewProjectModel } from 'src/new-project/new-project.models';

export abstract class GeneratorBuilder {
  public readonly targetFolder;
  protected readonly newProjectModel: NewProjectModel;

  constructor(newProjectModel: NewProjectModel) {
    this.newProjectModel = newProjectModel;
    this.targetFolder = path.join(newProjectModel.projectPath, newProjectModel.projectName);
  }

  abstract CopyTemplateBase(): Promise<void>;
  abstract CopyTemplateSample(): Promise<void>;
  abstract ConfigureProject(): Promise<void>;

  protected getAbsolutePath(relativePath: string): string {
    return path.join(__dirname, relativePath);
  }

  protected async copyTemplate(templateFilePath: string): Promise<void> {
    const templateFileName = path.basename(templateFilePath);
    const targetTemplatePath = path.join(this.targetFolder, templateFileName);

    // ensure exists target directory
    if (!fs.existsSync(this.targetFolder)) {
      fs.mkdirSync(this.targetFolder, { recursive: true });
    }

    // Copy the ZIP file to the target directory
    fs.copyFileSync(templateFilePath, targetTemplatePath);

    // Unzip the ZIP file into the target directory
    const zip = new StreamZip.async({ file: targetTemplatePath });
    await zip.extract(null, this.targetFolder);
    await zip.close();

    // Delete the ZIP file
    fs.unlinkSync(targetTemplatePath);
  }

  protected replaceValueInFile(filePath: string, oldValue: string, newValue: string): void {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const newContent = fileContent.replace(oldValue, newValue);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}
