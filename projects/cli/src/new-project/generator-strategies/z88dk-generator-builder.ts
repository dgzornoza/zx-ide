import * as path from 'path';
import { ISettingsJsonFile, ITasksJsonFile, ProjectConfigurationType } from 'src/infrastructure';
import { FileHelpers } from '../../helpers/file.helpers';
import { NewProjectModel } from '../new-project.models';
import { GeneratorBuilder } from './generator-builder';

export class Z88dkGeneratorBuilder extends GeneratorBuilder {
  private projectConfigurationStrategy: IProjectConfigurationStrategy;

  constructor(newProjectModel: NewProjectModel) {
    super(newProjectModel);

    if (newProjectModel.projectConfigurationType === undefined) {
      throw new Error('Project configuration type is required for z88dk project generator.');
    }

    this.projectConfigurationStrategy = ProjectConfigurationStrategyFactory.create(newProjectModel.projectConfigurationType);
  }

  async copyTemplateBase(): Promise<void> {
    const path = FileHelpers.getAbsolutePath(`./templates/${this.newProjectModel.projectType}_base.zip`);
    await FileHelpers.copyTemplate(path, this.newProjectModel.projectPath);
  }

  async copyTemplateSample(): Promise<void> {
    const path = FileHelpers.getAbsolutePath(
      `./templates/${this.newProjectModel.projectType}_${this.newProjectModel.machineType}_sample.zip`
    );

    await FileHelpers.copyTemplate(path, this.newProjectModel.projectPath);
  }

  configureProject(): Promise<void> {
    this.configureProjectName();
    this.configureVscodeFiles();
    this.configureSourceHeaderFiles();

    return Promise.resolve();
  }

  private configureProjectName(): void {
    // set project name as output name in files, project name in templates should be {ZX-IDE_PROJECT_NAME}.
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, 'Makefile'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, '.vscode', 'launch.json'),
      '{ZX-IDE_PROJECT_NAME}',
      this.newProjectModel.projectName
    );
  }

  private configureVscodeFiles(): void {
    // Include files in vscode are in settings.json, (z88dk compiler currently not require set include paths)
    let absolutePath = path.join(this.newProjectModel.projectPath, '.vscode', 'settings.json');
    const settingsJson = FileHelpers.readJsonFile<ISettingsJsonFile>(absolutePath);
    settingsJson['C_Cpp.default.includePath'].push(...this.projectConfigurationStrategy.includePaths);
    FileHelpers.writeJsonFile(settingsJson, absolutePath);

    // compiler arguments are in .vscode/tasks.json (with label 'Build' and command 'make')
    absolutePath = path.join(this.newProjectModel.projectPath, '.vscode', 'tasks.json');
    const taskJson = FileHelpers.readJsonFile<ITasksJsonFile>(absolutePath);
    const task = taskJson.tasks.find((task) => task.label === 'Build' && task.command === 'make');
    if (!task) {
      throw new Error('tasks.json is not valid zx-ide file.');
    }

    task.args = this.projectConfigurationStrategy.compilerArguments;
    FileHelpers.writeJsonFile(taskJson, absolutePath);
  }

  private configureSourceHeaderFiles(): void {
    // set includes in main headers file
    FileHelpers.replaceValueInFile(
      path.join(this.newProjectModel.projectPath, 'src', 'z88dk_headers.h'),
      '{ZX-IDE_PROJECT_INCLUDES}',
      this.projectConfigurationStrategy.includes.join('\n')
    );
  }
}

class ProjectConfigurationStrategyFactory {
  static create(projectConfiguration: ProjectConfigurationType): IProjectConfigurationStrategy {
    switch (projectConfiguration) {
      case 'z88dk_sdcc_classic_lib':
        return new SdccClassicLibConfigurationStrategy();
      case 'z88dk_sdcc_new_lib':
        return new SdccNewLibConfigurationStrategy();
      case 'z88dk_sccz80_classic_lib':
        return new Sccz80ClassicLibConfigurationStrategy();
      case 'z88dk_sccz80_new_lib':
        return new Sccz80NewLibConfigurationStrategy();
    }
  }
}

interface IProjectConfigurationStrategy {
  includePaths: string[];
  compilerArguments: string[];
  includes: string[];
}

class SdccClassicLibConfigurationStrategy implements IProjectConfigurationStrategy {
  includePaths = ['/opt/z88dk/include'];
  compilerArguments = ['COMPILER=-compiler=sdcc', 'C_OPT_FLAGS=-SO3 --opt-code-size', 'CREATE_SNA=-Cz"--sna"'];
  includes = ['#include <arch/zx/spectrum.h>'];
}

class Sccz80ClassicLibConfigurationStrategy implements IProjectConfigurationStrategy {
  includePaths = ['/opt/z88dk/include'];
  compilerArguments = ['COMPILER=-compiler=sccz80', 'C_OPT_FLAGS=-O3', 'CREATE_SNA=-Cz"--sna"'];
  includes = ['#include <arch/zx/spectrum.h>'];
}

class SdccNewLibConfigurationStrategy implements IProjectConfigurationStrategy {
  includePaths = ['/opt/z88dk/include/_DEVELOPMENT/sdcc'];
  compilerArguments = [
    'COMPILER=-compiler=sdcc',
    'CLIB=-clib=sdcc_iy',
    'CRT=-startup=31',
    'C_OPT_FLAGS=-SO3 --opt-code-size',
    'CREATE_SNA=-Cz"--sna"',
  ];
  includes = ['#include <arch/zx.h>'];
}

class Sccz80NewLibConfigurationStrategy implements IProjectConfigurationStrategy {
  includePaths = ['/opt/z88dk/include/_DEVELOPMENT/sccz80'];
  compilerArguments = ['COMPILER=-compiler=sccz80', 'CLIB=-clib=sdcc_iy', 'CRT=-startup=31', 'C_OPT_FLAGS=-O3', 'CREATE_SNA=-Cz"--sna"'];
  includes = ['#include <arch/zx.h>'];
}
