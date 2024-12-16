import * as path from 'path';
import { MachineType, ProjectConfigurationType, ProjectType } from 'src/infrastructure';

export class NewProjectModel {
  readonly targetFolder: string;
  readonly projectType: ProjectType;
  readonly projectPath: string;
  readonly projectName: string;
  readonly useSample?: boolean;
  readonly projectConfigurationType?: ProjectConfigurationType;
  readonly machineType?: MachineType;

  constructor(
    projectType: ProjectType,
    projectPath: string,
    projectName: string,
    machineType?: MachineType,
    projectConfigurationType?: ProjectConfigurationType,
    useSample?: boolean
  ) {
    this.projectType = projectType;
    this.projectPath = projectPath;
    this.projectName = projectName;
    this.targetFolder = path.join(projectPath, projectName);
    this.machineType = machineType;
    this.projectConfigurationType = projectConfigurationType;
    this.useSample = useSample;
  }
}

export interface ProjectTemplates {
  baseTemplate: string;
  sampleTemplate?: string;
}
