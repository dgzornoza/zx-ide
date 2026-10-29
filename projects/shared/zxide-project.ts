import { ProjectType } from "./infrastructure";

export type ProjectConfigurationType =
  | "z88dk_sdcc_classic_lib"
  | "z88dk_sdcc_new_lib"
  | "z88dk_sccz80_classic_lib"
  | "z88dk_sccz80_new_lib";

export type MachineType = "zxspectrum";

/** Folder of a new project where the graphics assets are stored. */
export const DEFAULT_ASSETS_GRAPHICS_PATH = "assets";

/** Folder of a new project where the generated graphics data source files are stored. */
export const DEFAULT_GRAPHICS_DATA_FOLDER_PATH = "src/data";

/** Structure of the `.zxide.json` file at the root of a zx-ide project. */
export interface ZxideFile {
  /** Version of the cli that created the project. */
  "zx-ide-cli-version": string;
  /** Version of the project template the project was created from. */
  "template-version": string;
  project: {
    type: ProjectType;
    /** Array of Paths to asset graphics files */
    assetsGraphicsPaths?: string[];
    /** Folder where graphics data source code files is stored */
    graphicsDataFolderPath?: string;
  };
}

/** New project chosen in the cli; the cli writes it as JSON to its `--output` file for the extension. */
export interface NewProjectModel {
  /** Absolute folder path where the project is created. */
  readonly targetPath: string;
  readonly projectType: ProjectType;
  /** Absolute path of the created project folder. */
  readonly projectPath: string;
  readonly projectName: string;
  readonly useSample?: boolean;
  readonly projectConfigurationType?: ProjectConfigurationType;
  readonly machineType?: MachineType;
}
