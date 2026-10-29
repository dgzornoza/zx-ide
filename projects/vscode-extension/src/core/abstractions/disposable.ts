import { injectable } from 'inversify';
import 'reflect-metadata';
import * as vscode from 'vscode';

export interface IDisposable {
  dispose(): void;
}

/**
 * interface for implement disposable base class
 */
@injectable()
export abstract class Disposable implements IDisposable {
  protected _subscriptions: vscode.Disposable[];

  constructor() {
    this._subscriptions = [];
  }

  /** if override in child class, should be invoke this ('super.dispose()') */
  public dispose(): void {
    while (this._subscriptions.length) {
      this._subscriptions.pop()?.dispose();
    }
  }
}
