export const WikiUri = 'https://github.com/dgzornoza/zx-ide/wiki';

export enum CommandName {
  CreateProject = 'zx-ide.create-project',
  OpenHelp = 'zx-ide.open-help',
}

/**
 * Extension configuration model interface.
 * Configuration values should be same as defined in package.json
 */
export interface ExtensionConfigurationModel {
  // debug in assembler code (with the embedded C‑code comments) using 'Z88dkAsmBreakpointService'
  useAsmDebug: boolean;
}

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
  readonly targetPath: string;
  readonly projectType: ProjectType;
  readonly projectPath: string;
  readonly projectName: string;
  readonly useSample?: boolean;
  readonly projectConfigurationType?: ProjectConfigurationType;
  readonly machineType?: MachineType;
}

/**
 * Model for launch.json configuration file
 */
export interface LaunchConfigFileModel {
  version: string;
  configurations: DezogConfigurationModel[];
}

export interface DezogConfigurationModel {
  type: string;
  remoteType: 'zsim' | 'zrcp' | 'cspect';

  zsim?: {
    memoryModel: 'ZX48K' | 'ZX128K' | string;
    visualMemory: boolean;
    ulaScreen: 'spectrum' | string;
    zxKeyboard: 'spectrum' | string;
    zxBeeper: boolean;
  };
  zrcp?: {
    port: number;
    hostname: string;
    loadDelay?: number;
  };
  cspect?: {
    port: number;
    hostname: string;
  };

  z88dkv2: z88dkv2ConfigurationModel[];

  commandsAfterLaunch?: string[];
}

export interface z88dkv2ConfigurationModel {
  path: string;
  mapFile: string;
  srcDirs: string[];
}
