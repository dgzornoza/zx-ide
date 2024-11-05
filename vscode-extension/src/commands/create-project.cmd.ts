import { ICommand } from '@core/abstractions/command';
import { Logger } from '@core/logger';
import { Types } from '@core/types';
import * as prompts from '@inquirer/prompts';
import { ProjectsService } from '@services/projects.service';
import * as figlet from 'figlet';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Stream } from 'stream';
import * as vscode from 'vscode';

// @ts-expect-error Este archivo es una fuente y forma parte de figlet y debe exisitir segun la documentacion.
import { default as standard } from 'figlet/importable-fonts/Standard';

const COMMAND_NAME: string = 'zx-ide.create-project';

@injectable()
export class CreateProjectCmd extends ICommand<unknown> {
  private _projectsService: ProjectsService;

  constructor(@inject(Types.ProjectsService) projectsService: ProjectsService) {
    super();

    this._projectsService = projectsService;

    this._subscriptions.push(
      vscode.commands.registerCommand(COMMAND_NAME, () => {
        this.execute();
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    // Crear un terminal en VSCode
    const terminal = vscode.window.createTerminal('Inquirer Terminal');
    terminal.show();
    terminal.sendText('echo prueba de texto');

    figlet.parseFont('Standard', standard);

    figlet('Hello World!!', function (err, data) {
      if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
      }
      console.log(data);
      terminal.sendText(`echo ${data}`);
    });

    // const title = figlet.textSync('Dir Manager');
    // // Escapar el texto para evitar problemas con los saltos de línea
    // const escapedData = title.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '\\"').replace(/\n/g, '\r\n');
    // // Enviar el texto generado al terminal
    // terminal.sendText(`echo ${escapedData}`);

    const result = await this.interactiveCreateNewProject(terminal);
    Logger.log(result);

    this._projectsService.createNewProject();
  }

  public canExecute(): boolean {
    return true;
  }

  public getCommandName(): string {
    return COMMAND_NAME;
  }

  public dispose(): void {
    // not used
  }

  private async interactiveCreateNewProject(terminal: vscode.Terminal): Promise<string> {
    const nameAnswer = await prompts.input(
      { message: '¿Cuál es tu nombre?' },
      {
        output: new Stream.Writable({
          write(chunk, _encoding, next) {
            terminal.sendText(chunk.toString());
            next();
          },
        }),
        clearPromptOnDone: true,
      }
    );

    const packageAnswer = await prompts.select({
      message: 'Select a package manager',
      choices: [
        {
          name: 'npm',
          value: 'npm',
          description: 'npm is the most popular package manager',
        },
        {
          name: 'yarn',
          value: 'yarn',
          description: 'yarn is an awesome package manager',
        },
        new prompts.Separator(),
        {
          name: 'jspm',
          value: 'jspm',
          disabled: true,
        },
        {
          name: 'pnpm',
          value: 'pnpm',
          disabled: '(pnpm is not available)',
        },
      ],
    });

    // Mostrar el resultado en un mensaje de VSCode
    vscode.window.showInformationMessage(`Hola, 👋 ${nameAnswer}! your package manager ${packageAnswer}.`);
    Logger.log('Hi! 👋  Welcome devimal-cli!');

    return packageAnswer;
  }
}
