import { Command, OptionValues } from 'commander';
import { NewProjectModel } from '../../shared/zxide-project';
import { createNewProjectModel } from './new-project/new-project.models';

/** Command line options of the cli; `--project-path` is the folder where the project folder is created. */
export function createCommandLineProgram(version: string): Command {
  return new Command()
    .version(version)
    .option('-o, --output <path>', 'Set script output result path')
    .option('-t, --project-type <TYPE>', 'Set project type (sjasmplus, z88dk)')
    .option('-p, --project-path <PATH>', 'Set the directory where the project folder is created')
    .option('-n, --project-name <NAME>', 'Set project name')
    .option('-m, --machine-type <MACHINE>', 'Set machine type (universal, zxspectrum)')
    .option(
      '-c, --project-configuration <CONFIG>',
      'Set project configuration, currently only z88dk (z88dk_sdcc_classic_lib, z88dk_sdcc_new_lib, z88dk_sccz80_classic_lib, z88dk_sccz80_new_lib)'
    )
    .option('-s, --use-sample', 'Use sample project (only specific machines has samples)');
}

/** New project described by the parsed options, or `undefined` when type, project path or name is missing (the wizard asks for it). */
export function readNewProjectArguments(options: OptionValues): NewProjectModel | undefined {
  if (!options.projectType || !options.projectPath || !options.projectName) {
    return undefined;
  }
  return createNewProjectModel(
    options.projectType,
    options.projectPath,
    options.projectName,
    options.machineType,
    options.projectConfiguration,
    options.useSample
  );
}
