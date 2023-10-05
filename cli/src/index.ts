import { Command } from 'commander';
import * as figlet from 'figlet';
import inquirer from 'inquirer';
var pjson = require('../package.json');

// @ts-ignore
import { default as standard } from 'figlet/importable-fonts/Standard';

const devilmalUrl = 'devimalplanet.com';


class Main {

    private program;

    constructor() {

        figlet.parseFont("Standard", standard);
        console.log(figlet.textSync("Dir Manager"));

        this.program = this.setupCommander();

        this.init();
    }


    async init() {
        var options = this.program.opts();
        const ranWithArgs = options.skipPrompts || options.url;
        if (!ranWithArgs) { return this.interactiveRun(); }

        const url = typeof ranWithArgs === 'string' ? ranWithArgs : devilmalUrl;
    }

    async interactiveRun() {
        console.log('Hi! 👋  Welcome devimal-cli!');

        const { openDevimal } = await inquirer.prompt({
            type: 'confirm',
            name: 'openDevimal',
            message: 'Would you like to visit devimalplanet.com?',
            default: true
        });

        const urlToVisit = openDevimal
            ? devilmalUrl
            : (
                await inquirer.prompt({
                    type: 'input',
                    name: 'someFunUrl',
                    message: '😢  No? Which URL would you like to visit?',
                    validate: function (input) {
                        return (
                            /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/.test(
                                input
                            ) || 'Please enter a valid URL.'
                        );
                    }
                })
            ).someFunUrl;
    }

    setupCommander() {

        const program = new Command();

        program
            .version(pjson.version)
            .option(
                '-y, --skip-prompts',
                'skips questions, directly opens devimalplanet.com'
            )
            .option('-u, --url <URL>', 'skips questions, directly opens provided URL')
            .parse(process.argv);

        return program;
    }
}

new Main();