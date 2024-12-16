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

export interface ZxideFile {
  'template-version': string;
  project: {
    type: ProjectType;
  };
}

export interface ISettingsJsonFile {
  'C_Cpp.default.includePath': string[];
}

export interface ITasksJsonFile {
  version: string;
  tasks: ITask[];
}

interface ITask {
  label: string;
  type: string;
  command: string;
  args?: string[];
  problemMatcher: any[];
  detail: string;
  group?: {
    kind: string;
    isDefault: boolean;
  };
}
