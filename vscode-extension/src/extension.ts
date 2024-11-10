// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { CreateProjectCmd } from '@commands/create-project.cmd';
import { Types } from '@core/types';
import { FeaturesService } from '@services/features.service';
import { ProjectService } from '@services/project.service';
import * as vscode from 'vscode';
import { InversifyConfig } from './inversify.config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  InversifyConfig.initialize(context);

  // Comando para crear proyecto nuevo
  InversifyConfig.container.get<CreateProjectCmd>(Types.CreateProjectCmd);

  FeaturesService.canUseBreakpointService().then((canUse) => {
    if (canUse) {
      InversifyConfig.container.get<CreateProjectCmd>(Types.BreakpointService);
    }
  });

  FeaturesService.isValidZxideProject().then((isValid) => {
    if (isValid) {
      InversifyConfig.container.get<ProjectService>(Types.ProjectService);
    }
  });

  //  InversifyConfig.container.get<CreateProjectCmd>('IStatusBar');

  // // Use the console to output diagnostic information (console.log) and errors (console.error)
  // // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "zxide" is now active!');

  // // The command has been defined in the package.json file
  // // Now provide the implementation of the command with registerCommand
  // // The commandId parameter must match the command field in package.json
  // let disposable = vscode.commands.registerCommand('zxide.helloWorld', () => {
  // 	// The code you place here will be executed every time your command is executed
  // 	// Display a message box to the user
  // 	vscode.window.showInformationMessage('Hello World from zxide!');
  // });

  // context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
