export const WikiUri = 'https://github.com/dgzornoza/zx-ide/wiki';

export enum CommandName {
  CreateProject = 'zx-ide.create-project',
  OpenHelp = 'zx-ide.open-help',
  AttachProjectTiles = 'zx-ide.extract-tiles',
  AttachProjectSprites = 'zx-ide.extract-sprites',
  AttachProjectMapTileset = 'zx-ide.extract-map-tileset',
  CreateSprites = 'zx-ide.create-sprites',
}

/**
 * Extension configuration model interface.
 * Configuration values should be same as defined in package.json
 */
export interface ExtensionConfigurationModel {
  // debug in assembler code (with the embedded C‑code comments) using 'Z88dkAsmBreakpointService'
  useAsmDebug: boolean;
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

  z88dkv2: Z88dkv2ConfigurationModel[];

  commandsAfterLaunch?: string[];
}

export interface Z88dkv2ConfigurationModel {
  path: string;
  mapFile: string;
  srcDirs: string[];
}
