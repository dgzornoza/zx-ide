import { Command } from 'commander';
import * as figlet from 'figlet';
import { osLocale } from 'os-locale';
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
    const ranWithArgs = options.projectType && options.output && options.name;

    let newProjectModel: NewProjectModel;
    if (!ranWithArgs) {
      newProjectModel = await new NewProjectWizard().execute();
    } else {
      newProjectModel = {
        projectType: options.projectType,
        projectPath: options.output,
        projectName: options.name,
        useSample: options.useSample,
      };
    }

    await new NewProjectGenerator().execute(newProjectModel);
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
      .option('-p, --project-type <PROYECT>', 'Set project type ("ZxSpectrumSjasmplus", "ZxSpectrumZ88dk")')
      .option('-o, --output <PATH>', 'Set target directory')
      .option('-n, --name <NAME>', 'Set project name')
      .option('-s, --use-sample', 'Use sample project')
      .parse(process.argv);

    return program;
  }
}

new Main();
