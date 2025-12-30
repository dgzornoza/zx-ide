import * as path from 'path';
import { MachineType, ProjectConfigurationType, ProjectType } from 'src/infrastructure';

export class NewProjectModel {
  // main workspaces path (main folder where projects will be created)
  readonly workspacesPath: string;
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
    workspacesPath: string,
    projectName: string,
    machineType?: MachineType,
    projectConfigurationType?: ProjectConfigurationType,
    useSample?: boolean
  ) {
    this.projectType = projectType;
    this.workspacesPath = workspacesPath;
    this.projectName = projectName;
    this.projectPath = path.join(workspacesPath, projectName);
    this.machineType = machineType;
    this.projectConfigurationType = projectConfigurationType;
    this.useSample = useSample;
  }
}

export interface ProjectTemplates {
  baseTemplate: string;
  sampleTemplate?: string;
}
