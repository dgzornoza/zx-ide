import { Disposable } from '@core/abstractions/disposable';
import { injectable } from 'inversify';
import * as vscode from 'vscode';

export const DEFAULT_OUTPUT_CHANNEL_NAME = 'Zx-Ide';

@injectable()
export class OutputChannelService extends Disposable {
  private outputChannels: Record<string, vscode.OutputChannel> = {};

  constructor() {
    super();
  }

  public getDefaultOutputChannel(): vscode.OutputChannel {
    return this.getOutputChannel(DEFAULT_OUTPUT_CHANNEL_NAME);
  }

  private getOutputChannel(name: string): vscode.OutputChannel {
    if (!this.outputChannels[name]) {
      this.outputChannels[name] = vscode.window.createOutputChannel(name);
    }

    return this.outputChannels[name];
  }
}
