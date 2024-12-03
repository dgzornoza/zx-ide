export type ProjectType = 'ZxSpectrumSjasmplus' | 'ZxSpectrumZ88dk' | 'ZxSpectrumZ88dkNext';

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
