import inquirer from 'inquirer';

class Main {
    constructor() {
        this.init();
    }

    private async init() {
        const { openDevimal } = await inquirer.prompt({
            type: 'confirm',
            name: 'openDevimal',
            message: 'Would you like to visit devimalplanet.com?',
            default: true
        });
        console.log(openDevimal);
    }
}

new Main();