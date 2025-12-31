import { Command } from 'commander';
import * as figlet from 'figlet';
import { osLocale } from 'os-locale';
import { FileHelpers } from './helpers/file.helpers';
import { NewProjectGenerator } from './new-project/new-project-generator';
import { NewProjectWizard } from './new-project/new-project-wizard';
import { NewProjectModel } from './new-project/new-project.models';
var pjson = require('../package.json');

// @ts-ignore
import { default as standard } from 'figlet/importable-fonts/Standard';

class Main {
  private _program!: Command;

  constructor() {
    this.setCurrentLanguage().then(async () => {
      this._program = this.setupCommander();

      await this.init();
    });
  }

  async init() {
    this.showTitle();

    var options = this._program.opts();
    const ranWithArgs = options.projectType && options.targetPath && options.projectName;

    let newProjectModel: NewProjectModel;
    if (!ranWithArgs) {
      newProjectModel = await new NewProjectWizard().execute();
    } else {
      newProjectModel = new NewProjectModel(
        options.projectType,
        options.targetPath,
        options.projectName,
        options.machineType,
        options.projectConfiguration,
        options.useSample
      );
    }

    await new NewProjectGenerator().execute(newProjectModel);

    if (options.output) {
      FileHelpers.writeJsonFile(newProjectModel, options.output);
    }
  }

  async setCurrentLanguage(): Promise<void> {
    const language = await osLocale();
    // TODO: 05/11/2024 - Implement language support
    //console.log(`Current language is: ${language}`);
  }

  showTitle(): void {
    figlet.parseFont('Standard', standard);
    console.log(figlet.textSync('Zx-Ide'));
  }

  setupCommander(): Command {
    const program = new Command();

    program
      .version(pjson.version)
      .option('-o, --output <path>', 'Set script output result path')
      .option('-t, --project-type <PROYECT>', 'Set project type (sjasmplus, z88dk)')
      .option('-p, --project-path <PATH>', 'Set target directory')
      .option('-n, --project-name <NAME>', 'Set project name')
      .option('-m, --machine-type <MACHINE>', 'Set machine type (universal, zxspectrum)')
      .option(
        '-c, --project-configuration <CONFIG>',
        'Set project configuration, currently only z88dk (z88dk_sdcc_classic_lib, z88dk_sdcc_new_lib, z88dk_sccz80_classic_lib, z88dk_sccz80_new_lib)'
      )
      .option('-s, --use-sample', 'Use sample project (only specific machines has samples)')
      .parse(process.argv);

    return program;
  }
}

new Main();
