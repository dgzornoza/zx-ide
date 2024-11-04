import { inject, injectable } from 'inversify';
import * as path from 'path';
import 'reflect-metadata';
import * as vsc from 'vscode';

import { ICommand } from '@core/abstractions/command';
import { ViewsControllersService } from '@services/viewController.service';

const COMMAND_NAME: string = 'atse.changeViewController';

@injectable()
export class ChangeViewControllerCmd extends ICommand<unknown> {
  private _viewsControllersService: ViewsControllersService;

  constructor(@inject('ViewsControllersService') viewsControllersService: ViewsControllersService) {
    super();

    this._viewsControllersService = viewsControllersService;

    this._subscriptions.push(
      vsc.commands.registerCommand(COMMAND_NAME, () => {
        this.execute();
      })
    );
  }

  public execute(..._params: any[]): void {
    if (!vsc.window.activeTextEditor) {
      return;
    }

    let normalizedActiveEditorPath: string = path.normalize(vsc.window.activeTextEditor.document.fileName);

    // get view/controller path to open
    // let resolvedPath: string;
    // switch (vsc.window.activeTextEditor.document.languageId) {
    //   case 'typescript':
    //     resolvedPath = this._viewsControllersService.getViewFromControllerPath(normalizedActiveEditorPath);
    //     break;
    //   case 'html':
    //     resolvedPath = this._viewsControllersService.getControllerFromViewPath(normalizedActiveEditorPath);
    //     break;

    //   default:
    // }

    // if (resolvedPath !== normalizedActiveEditorPath) {
    //   vsc.workspace.openTextDocument(resolvedPath).then(
    //     (opened: vsc.TextDocument) => vsc.window.showTextDocument(opened),
    //     (reason: any) => {
    //       console.log(reason);
    //       vsc.window.showInformationMessage('Not found view/controller');
    //     }
    //   );
    // } else {
    //   vsc.window.showInformationMessage('Not found view/controller');
    // }
  }

  public canExecute(): boolean {
    let result: boolean = false;

    // Get the current text editor
    let editor: vsc.TextEditor | undefined = vsc.window.activeTextEditor;
    if (editor) {
      let doc: vsc.TextDocument = editor.document;

      // Only update status if an typescript/html file
      if (doc.languageId === 'typescript' || doc.languageId === 'html') {
        result = true;
      }
    }

    return result;
  }

  public getCommandName(): string {
    return COMMAND_NAME;
  }

  public dispose(): void {
    // not used
  }
}
