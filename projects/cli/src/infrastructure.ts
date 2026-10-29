export const ZX_ZXIDE_CLI_VERSION = '1.4.0';
/** Version of the project templates in `templates/`; increase it whenever a template zip changes. */
export const ZX_IDE_TEMPLATE_VERSION = '1.0.0';

export type ProjectReplacementConstants =
  '{ZX-IDE_PROJECT_NAME}' | '{ZX-IDE_PROJECT_INCLUDES}' | '{ZX-IDE_PROJECT_MACHINE}' | '{ZX-IDE_PROJECT_OUTPUT_FILE}';
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
    problemMatcher: unknown[];
  }[];
}
