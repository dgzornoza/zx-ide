export type ProjectType = 'sjasmplus' | 'z88dk';
export type ProjectConfigurationType =
  | 'z88dk_sdcc_classic_lib'
  | 'z88dk_sdcc_new_lib'
  | 'z88dk_sccz80_classic_lib'
  | 'z88dk_sccz80_new_lib';
export type MachineType = 'universal' | 'zxspectrum';

export interface NewProjectModel {
  projectType: ProjectType;
  projectName: string;
  projectPath: string;
  useSample: boolean;

  projectConfigurationType?: ProjectConfigurationType;
  machineType?: MachineType;
}

export interface ProjectTemplates {
  baseTemplate: string;
  sampleTemplate?: string;
}
