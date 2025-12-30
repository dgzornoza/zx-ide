import * as path from 'path';
import { MachineType, ProjectConfigurationType, ProjectType } from 'src/infrastructure';

export class NewProjectModel {
  // target path (absolute folder path where project will be created)
  readonly targetPath: string;
  // target project path
  readonly projectPath: string;
  // target project type
  readonly projectType: ProjectType;
  // target project name
  readonly projectName: string;
  // (optional) flag to use sample project
  readonly useSample?: boolean;
  // (optional) project configuration type
  readonly projectConfigurationType?: ProjectConfigurationType;
  // (optional) machine type
  readonly machineType?: MachineType;

  constructor(
    projectType: ProjectType,
    targetPath: string,
    projectName: string,
    machineType?: MachineType,
    projectConfigurationType?: ProjectConfigurationType,
    useSample?: boolean
  ) {
    this.projectType = projectType;
    this.targetPath = targetPath;
    this.projectName = projectName;
    this.projectPath = path.join(targetPath, projectName);
    this.machineType = machineType;
    this.projectConfigurationType = projectConfigurationType;
    this.useSample = useSample;
  }
}

export interface ProjectTemplates {
  baseTemplate: string;
  sampleTemplate?: string;
}
