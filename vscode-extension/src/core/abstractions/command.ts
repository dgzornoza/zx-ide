import { Disposable } from '@core/abstractions/disposable';
import { injectable } from 'inversify';
import 'reflect-metadata';
import * as vscode from 'vscode';

/**
 * base class for declare commands
 */
@injectable()
export abstract class Command<TParams> extends Disposable {
  protected _isEnabled: boolean;

  protected abstract getCommandName(): string;

  constructor() {
    super();
    this._isEnabled = true;

    this._subscriptions.push(
      vscode.commands.registerCommand(this.getCommandName(), () => {
        this.execute();
      })
    );
  }

  public abstract execute(...params: TParams[]): void | Promise<void>;

  public isEnabled(): boolean {
    return this._isEnabled;
  }

  public dispose(): void {
    super.dispose();
  }
}
