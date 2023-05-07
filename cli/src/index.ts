import inquirer from 'inquirer';

class Main {
    constructor() {
        this.init();
    }

    private async init() {

        console.log('Hi! 👋  Welcome devimal-cli!');
        let urlToVisit = 'devimalplanet.com';

        const { openDevimal } = await inquirer.prompt({
            type: 'confirm',
            name: 'openDevimal',
            message: 'Would you like to visit devimalplanet.com?',
            default: true
        });
        console.log(openDevimal);

        if (!openDevimal) {
            // not opening devimalplanet.com
            const { someFunUrl } = await inquirer.prompt({
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
            });
            urlToVisit = someFunUrl;
        }
        console.log(urlToVisit);
    }
}

new Main();