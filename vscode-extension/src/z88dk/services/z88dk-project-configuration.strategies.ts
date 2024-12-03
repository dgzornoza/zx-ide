import { FileHelpers } from '@core/helpers/file-helpers';
import { ISettingsJsonFile, ITasksJsonFile } from '@core/infrastructure';
import { ProjectConfigurationOptions } from '@z88dk/services/z88dk-project.service';
import * as vscode from 'vscode';

const CLASSIC_LIB_INCLUDE_PATH = ['/opt/z88dk/include'];
const NEW_LIB_SDCC_INCLUDE_PATH = ['/opt/z88dk/include/_DEVELOPMENT/sdcc'];
const NEW_LIB_SCCZ80_INCLUDE_PATH = ['/opt/z88dk/include/_DEVELOPMENT/sccz80'];
const Z88DK_INCLUDE_PATHS = [...CLASSIC_LIB_INCLUDE_PATH, ...NEW_LIB_SDCC_INCLUDE_PATH, ...NEW_LIB_SCCZ80_INCLUDE_PATH];

export class ProjectConfigurationStrategyFactory {
  static create(projectConfiguration: ProjectConfigurationOptions): ProjectConfigurationStrategy {
    switch (projectConfiguration) {
      case 'sdccClassicLib':
        return new SdccClassicLibConfigurationStrategy();
      case 'sdccNewLib':
        return new SdccNewLibConfigurationStrategy();
      case 'sccz80ClassicLib':
        return new Sccz80ClassicLibConfigurationStrategy();
      case 'sccz80NewLib':
        return new Sccz80NewLibConfigurationStrategy();
    }
  }
}

export abstract class ProjectConfigurationStrategy {
  abstract includePaths: string[];
  abstract compilerArguments: string[];
  abstract replaceDefinitions(headerFileContent: string): string;

  async configureIncludePaths(): Promise<void> {
    // Include files in vscode are in settings.json, (z88dk compiler currently not require set include paths)
    const path = ['.vscode', 'settings.json'];
    const json = await FileHelpers.readJsonFile<ISettingsJsonFile>(...path);
    if (json) {
      // remove all z88dk include paths
      json['C_Cpp.default.includePath'] = json['C_Cpp.default.includePath'].filter((path: string) => !Z88DK_INCLUDE_PATHS.includes(path));
      // add new include paths and save
      json['C_Cpp.default.includePath'].push(...this.includePaths);
      await FileHelpers.writeJsonFile(json, ...path);
    }
  }

  async configureCompilerArguments(): Promise<void> {
    // compiler arguments are in .vscode/tasks.json (with label 'compile' and command 'make')
    const path = ['.vscode', 'tasks.json'];
    const json = await FileHelpers.readJsonFile<ITasksJsonFile>(...path);
    if (json) {
      const task = json.tasks.find((task) => task.label === 'Compile' && task.command === 'make');
      if (!task) {
        vscode.window.showErrorMessage(vscode.l10n.t('task.json is not valid zx-ide file. The file has been modified'));
        return;
      }

      // add new compiler arguments and save
      task.args = this.compilerArguments;
      await FileHelpers.writeJsonFile(json, ...path);
    }
  }

  async configureDefinitions(): Promise<void> {
    // z88dk headers in new/classic libs are in src/z88dk_headers.h
    const path = ['src', 'z88dk_headers.h'];
    const content = await FileHelpers.readFile(...path);
    if (content) {
      const newContent = this.replaceDefinitions(content);
      await FileHelpers.writeFile(newContent, ...path);
    }
  }
}

class SdccClassicLibConfigurationStrategy extends ProjectConfigurationStrategy {
  includePaths = CLASSIC_LIB_INCLUDE_PATH;
  compilerArguments = ['COMPILER=-compiler=sdcc', 'C_OPT_FLAGS=-SO3 --opt-code-size', 'CREATE_SNA=-Cz"--sna"'];

  replaceDefinitions(headerFileContent: string): string {
    return headerFileContent.replace('#define USE_NEW_LIB', '#define USE_CLASSIC_LIB');
  }
}

class SdccNewLibConfigurationStrategy extends ProjectConfigurationStrategy {
  includePaths = NEW_LIB_SDCC_INCLUDE_PATH;
  compilerArguments = [
    'COMPILER=-compiler=sdcc',
    'CLIB=-clib=sdcc_iy',
    'CRT=-startup=31',
    'C_OPT_FLAGS=-SO3 --opt-code-size',
    'CREATE_SNA=-Cz"--sna"',
  ];

  replaceDefinitions(headerFileContent: string): string {
    return headerFileContent.replace('#define USE_CLASSIC_LIB', '#define USE_NEW_LIB');
  }
}

class Sccz80ClassicLibConfigurationStrategy extends ProjectConfigurationStrategy {
  includePaths = CLASSIC_LIB_INCLUDE_PATH;
  compilerArguments = ['COMPILER=-compiler=sccz80', 'C_OPT_FLAGS=-O3', 'CREATE_SNA=-Cz"--sna"'];

  replaceDefinitions(headerFileContent: string): string {
    return headerFileContent.replace('#define USE_NEW_LIB', '#define USE_CLASSIC_LIB');
  }
}

class Sccz80NewLibConfigurationStrategy extends ProjectConfigurationStrategy {
  includePaths = NEW_LIB_SCCZ80_INCLUDE_PATH;
  compilerArguments = ['COMPILER=-compiler=sccz80', 'CLIB=-clib=sdcc_iy', 'CRT=-startup=31', 'C_OPT_FLAGS=-O3', 'CREATE_SNA=-Cz"--sna"'];

  replaceDefinitions(headerFileContent: string): string {
    return headerFileContent.replace('#define USE_CLASSIC_LIB', '#define USE_NEW_LIB');
  }
}
