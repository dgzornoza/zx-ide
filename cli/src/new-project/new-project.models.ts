export type ProjectType = 'ZxSpectrumSjasmplus' | 'ZxSpectrumZ88dk' | 'ZxSpectrumZ88dkNext';

export interface NewProjectModel {
  projectType: ProjectType;
  projectName: string;
  projectPath: string;
  useSample: boolean;
}

export interface ProjectTemplates {
  baseTemplate: string;
  configurationTemplate?: string;
  sampleTemplate?: string;
}
