import { Disposable } from '@core/abstractions/disposable';
import { injectable } from 'inversify';
import 'reflect-metadata';

/**
 * base class for declare commands
 */
@injectable()
export abstract class Command<TParams> extends Disposable {
  protected _isEnabled: boolean;

  constructor() {
    super();
    this._isEnabled = true;
  }

  public abstract execute(...params: TParams[]): void | Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canExecute(..._params: TParams[]): boolean {
    // default value
    return true;
  }

  public isEnabled(): boolean {
    return this._isEnabled;
  }

  public abstract getCommandName(): string;

  public dispose(): void {
    super.dispose();
  }
}
