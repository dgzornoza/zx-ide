import { Command } from '@core/abstractions/command';
import { CommandName, WikiUri } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class OpenHelpCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.OpenHelp;
  }

  constructor(@inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {
    const wikiUri = vscode.Uri.parse(WikiUri);
    vscode.env.openExternal(wikiUri);
  }
}
