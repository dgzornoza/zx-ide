import { Command } from 'commander';
import { osLocale } from 'os-locale';
import { FileHelpers } from './helpers/file.helpers';
import { NewProjectGenerator } from './new-project/new-project-generator';
import { NewProjectWizard } from './new-project/new-project-wizard';
import { createCommandLineProgram, readNewProjectArguments } from './command-line';
import { renderTitle } from './title';
import packageJson from '../package.json';

class Main {
  private _program!: Command;

  constructor() {
    this.setCurrentLanguage()
      .then(async () => {
        this._program = this.setupCommander();

        await this.init();
      })
      .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
      });
  }

  async init() {
    this.showTitle();

    const options = this._program.opts();
    const newProjectModel = readNewProjectArguments(options) ?? (await new NewProjectWizard().execute());

    await new NewProjectGenerator().execute(newProjectModel);

    if (options.output) {
      FileHelpers.writeJsonFile(newProjectModel, options.output);
    }
  }

  async setCurrentLanguage(): Promise<void> {
    await osLocale();
    // TODO: 05/11/2024 - Implement language support
    //console.log(`Current language is: ${language}`);
  }

  showTitle(): void {
    console.log(renderTitle());
  }

  setupCommander(): Command {
    return createCommandLineProgram(packageJson.version).parse(process.argv);
  }
}

new Main();
