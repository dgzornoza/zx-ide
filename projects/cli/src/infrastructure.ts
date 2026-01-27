export const ZX_ZXIDE_CLI_VERSION = '1.2.0';

export type ProjectReplacementConstants =
  | '{ZX-IDE_PROJECT_NAME}'
  | '{ZX-IDE_PROJECT_INCLUDES}'
  | '{ZX-IDE_PROJECT_MACHINE}'
  | '{ZX-IDE_PROJECT_OUTPUT_FILE}';
export type ProjectType = 'sjasmplus' | 'z88dk';
export type ProjectConfigurationType =
  | 'z88dk_sdcc_classic_lib'
  | 'z88dk_sdcc_new_lib'
  | 'z88dk_sccz80_classic_lib'
  | 'z88dk_sccz80_new_lib';
export type MachineType = 'zxspectrum';

/** Modelo para definir la estructura del archivo zxide */
export interface ZxideFile {
  'zx-ide-cli-version': string;
  project: {
    type: ProjectType;
  };
}

/** modelo para definir la estructura del archivo settings.json de vscode */
export interface ISettingsJsonFile {
  'C_Cpp.default.includePath': string[];
}

/** Modelo para definir la estructura del archivo tasks.json de vscode */
export interface ITasksJsonFile {
  version: string;
  tasks: {
    label: string;
    type: string;
    command: string;
    args?: string[];
    detail: string;
    group?: {
      kind: string;
      isDefault: boolean;
    };
    problemMatcher: any[];
  }[];
}
