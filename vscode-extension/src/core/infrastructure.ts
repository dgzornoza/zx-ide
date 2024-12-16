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

export interface NewProjectModel {
  readonly targetFolder: string;
  readonly projectType: ProjectType;
  readonly projectPath: string;
  readonly projectName: string;
  readonly useSample?: boolean;
  readonly projectConfigurationType?: ProjectConfigurationType;
  readonly machineType?: MachineType;
}
