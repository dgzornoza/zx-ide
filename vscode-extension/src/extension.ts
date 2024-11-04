// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { IStatusBar } from '@components/statusBar.component';
import * as vscode from 'vscode';
import { InversifyConfig } from './inversify.config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // TODO: añadir validacion para activacion
  // activate extension with IOC container
  const activated = true;
  let log: string = 'zx-ide extension is ' + (activated ? 'activated' : 'deactivated (not exists project)');
  if (activated) {
    InversifyConfig.initialize(context);
    InversifyConfig.container.get<IStatusBar>('IStatusBar');
  }

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
