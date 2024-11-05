import { Command } from 'commander';
import * as figlet from 'figlet';
import { osLocale } from 'os-locale';
import { InteractiveWizard } from './interactive-wizard';
var pjson = require('../package.json');

// @ts-ignore
import { default as standard } from 'figlet/importable-fonts/Standard';

const devilmalUrl = 'devimalplanet.com';

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
    const ranWithArgs = options.skipPrompts || options.url;
    if (!ranWithArgs) {
      const result = await new InteractiveWizard().execute();
      console.log(JSON.stringify(result));
    }
  }

  async setCurrentLanguage(): Promise<void> {
    const language = await osLocale();
    console.log(`Current language is: ${language}`);
  }

  showTitle(): void {
    figlet.parseFont('Standard', standard);
    console.log(figlet.textSync('Zx-Ide'));
  }

  setupCommander(): Command {
    const program = new Command();

    program
      .version(pjson.version)
      .option('-y, --skip-prompts', 'skips questions, directly opens devimalplanet.com')
      .option('-u, --url <URL>', 'skips questions, directly opens provided URL')
      .parse(process.argv);

    return program;
  }
}

new Main();
