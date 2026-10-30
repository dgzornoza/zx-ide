import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { createCommandLineProgram, readNewProjectArguments } from './command-line';

function parse(...cliArguments: string[]) {
  return createCommandLineProgram('1.4.0')
    .parse(['node', 'zx-ide-cli.js', ...cliArguments])
    .opts();
}

describe('createCommandLineProgram', () => {
  it('offers in the help only the machine types the generators accept', () => {
    const help = createCommandLineProgram('1.4.0').helpInformation();

    expect(help).toContain('Set machine type (zxspectrum)');
    expect(help).not.toContain('universal');
  });
});

describe('readNewProjectArguments', () => {
  it('creates the project from the arguments when type, project path and name are given', () => {
    const options = parse('-t', 'z88dk', '-p', '/projects', '-n', 'game', '-m', 'zxspectrum', '-c', 'z88dk_sdcc_new_lib', '-s');

    expect(readNewProjectArguments(options)).toEqual({
      targetPath: '/projects',
      projectPath: path.join('/projects', 'game'),
      projectType: 'z88dk',
      projectName: 'game',
      useSample: true,
      projectConfigurationType: 'z88dk_sdcc_new_lib',
      machineType: 'zxspectrum',
    });
  });

  it('accepts the long option names', () => {
    const options = parse('--project-type', 'sjasmplus', '--project-path', '/projects', '--project-name', 'game');

    expect(readNewProjectArguments(options)).toMatchObject({ projectType: 'sjasmplus', targetPath: '/projects', projectName: 'game' });
  });

  it('returns undefined so the wizard runs when a required argument is missing', () => {
    expect(readNewProjectArguments(parse())).toBeUndefined();
    expect(readNewProjectArguments(parse('-t', 'z88dk', '-n', 'game'))).toBeUndefined();
    expect(readNewProjectArguments(parse('-o', '/tmp/output.txt'))).toBeUndefined();
  });

  it('keeps the output path option', () => {
    expect(parse('-o', '/tmp/output.txt').output).toBe('/tmp/output.txt');
  });
});
