import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { createNewProjectModel } from './new-project.models';

describe('createNewProjectModel', () => {
  it('derives the project path from the target path and the project name', () => {
    const model = createNewProjectModel('z88dk', '/projects', 'game', 'zxspectrum', 'z88dk_sdcc_new_lib', true);

    expect(model.projectPath).toBe(path.join('/projects', 'game'));
  });

  it('serializes to the JSON the extension reads from the cli output file', () => {
    const model = createNewProjectModel('z88dk', '/projects', 'game', 'zxspectrum', 'z88dk_sdcc_new_lib', true);

    expect(JSON.stringify(model)).toBe(
      JSON.stringify({
        targetPath: '/projects',
        projectPath: path.join('/projects', 'game'),
        projectType: 'z88dk',
        projectName: 'game',
        useSample: true,
        projectConfigurationType: 'z88dk_sdcc_new_lib',
        machineType: 'zxspectrum',
      })
    );
  });

  it('leaves the optional values out of the JSON when they are not given', () => {
    const model = createNewProjectModel('sjasmplus', '/projects', 'game');

    expect(JSON.parse(JSON.stringify(model))).toEqual({
      projectType: 'sjasmplus',
      targetPath: '/projects',
      projectName: 'game',
      projectPath: path.join('/projects', 'game'),
    });
  });
});
