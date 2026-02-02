import { Command } from '@core/abstractions/command';
import { CommandName } from '@core/infrastructure';
import { TerminalService } from '@core/services/terminal.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class AttachProjectGraphicsCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectGraphics;
  }

  constructor(
    @inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext,
    @inject(Types.TerminalService) private terminalService: TerminalService
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(..._params: unknown[]): Promise<void> {}
}
