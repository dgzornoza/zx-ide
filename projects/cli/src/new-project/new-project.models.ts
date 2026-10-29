import * as path from 'path';
import { ProjectType } from 'externalShared/infrastructure';
import { MachineType, NewProjectModel, ProjectConfigurationType } from 'externalShared/zxide-project';

/** Returns the new project model; the project folder is `projectName` inside `targetPath`. */
export function createNewProjectModel(
  projectType: ProjectType,
  targetPath: string,
  projectName: string,
  machineType?: MachineType,
  projectConfigurationType?: ProjectConfigurationType,
  useSample?: boolean
): NewProjectModel {
  // key order kept from the previous class (field declaration order), so the --output JSON is unchanged
  return {
    targetPath,
    projectPath: path.join(targetPath, projectName),
    projectType,
    projectName,
    useSample,
    projectConfigurationType,
    machineType,
  };
}
