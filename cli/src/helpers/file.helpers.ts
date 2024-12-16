import * as fs from 'fs';
import * as StreamZip from 'node-stream-zip';
import * as path from 'path';
import { ProjectReplacementConstants } from 'src/infrastructure';

export class FileHelpers {
  public static getAbsolutePath(relativePath: string): string {
    return path.join(__dirname, relativePath);
  }

  public static readFile(absolutePath: string): string {
    const result = fs.readFileSync(absolutePath, 'utf8');
    if (!result) {
      throw new Error(`not found file: ${absolutePath}`);
    }
    return result;
  }

  public static readJsonFile<T>(absolutePath: string): T {
    const fileText = FileHelpers.readFile(absolutePath);
    return JSON.parse(fileText);
  }

  public static async writeFile(content: string, absolutePath: string): Promise<void> {
    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  public static async writeJsonFile(instance: unknown, absolutePath: string): Promise<void> {
    const content = JSON.stringify(instance, null, 4);
    await FileHelpers.writeFile(content, absolutePath);
  }

  public static replaceValueInFile(absoluteFilePath: string, oldValue: ProjectReplacementConstants, newValue: string): void {
    const fileContent = FileHelpers.readFile(absoluteFilePath);
    const newContent = fileContent.replace(new RegExp(oldValue, 'g'), newValue);
    FileHelpers.writeFile(newContent, absoluteFilePath);
  }

  public static async copyTemplate(templateFilePath: string, targetFolder: string): Promise<void> {
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
