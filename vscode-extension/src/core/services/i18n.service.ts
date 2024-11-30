const vscode = require('vscode');
const nls = require('vscode-nls');
const localize = nls.config({ locale: process.env.VSCODE_NLS_CONFIG })();

export class I18nService {
  static localize(key, message) {
    return localize(key, message);
  }
}

function activate(context) {
  let disposableHello = vscode.commands.registerCommand('extension.helloWorld', function () {
    vscode.window.showInformationMessage(localize('extension.helloWorld', 'Hello World'));
  });

  let disposableGoodbye = vscode.commands.registerCommand('extension.goodbyeWorld', function () {
    vscode.window.showInformationMessage(localize('extension.goodbyeWorld', 'Goodbye World'));
  });

  context.subscriptions.push(disposableHello);
  context.subscriptions.push(disposableGoodbye);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
