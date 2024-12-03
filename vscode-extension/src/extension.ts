// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ConfigureZ88dkProjectCmd } from '@commands/configure-z88dk-project.cmd';
import { CreateProjectCmd } from '@commands/create-project.cmd';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { SjasmPlusProjectService } from '@sjasmplus/services/sjasmplus-project.service';
import * as vscode from 'vscode';
import { InversifyConfig } from './inversify.config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  InversifyConfig.initialize(context);

  // Comando para crear proyecto nuevo
  InversifyConfig.container.get<CreateProjectCmd>(Types.CreateProjectCmd);

  FeaturesService.isZ88dkProject().then((result) => {
    if (result) {
      InversifyConfig.container.get<ConfigureZ88dkProjectCmd>(Types.ConfigureZ88dkProjectCmd);
    }
  });

  FeaturesService.isSjasmplusProject().then((result) => {
    if (result) {
      InversifyConfig.container.get<SjasmPlusProjectService>(Types.SjasmPlusProjectService);
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
