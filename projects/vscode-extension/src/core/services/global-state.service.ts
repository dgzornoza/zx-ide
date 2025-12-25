import { Types } from '@core/types';
import * as vscode from 'vscode';
import { InversifyConfig } from '../../inversify.config';

export type GlobalStateKeys = '';

export class GlobalStateService {
  private static _context: vscode.ExtensionContext;

  private static get context(): vscode.ExtensionContext {
    if (!GlobalStateService._context) {
      GlobalStateService._context = InversifyConfig.container.get<vscode.ExtensionContext>(Types.ExtensionContext);
    }
    return GlobalStateService._context;
  }

  static setGlobalStateItem(key: GlobalStateKeys, value: string): void {
    GlobalStateService.context.globalState.update(key, value);
  }

  static getGlobalStateItem(key: GlobalStateKeys): string | undefined {
    return GlobalStateService.context.globalState.get(key);
  }

  static setGlobalStateBoolean(key: GlobalStateKeys, value: boolean): void {
    GlobalStateService.setGlobalStateItem(key, JSON.stringify(value));
  }

  static getGlobalStateAsBoolean(key: GlobalStateKeys): boolean {
    return GlobalStateService.getGlobalStateItem(key) === 'true';
  }

  static setGlobalStateObject<T>(key: GlobalStateKeys, value: T): void {
    GlobalStateService.setGlobalStateItem(key, JSON.stringify(value));
  }

  static getGlobalStateObject<T>(key: GlobalStateKeys): T | undefined {
    const value = GlobalStateService.getGlobalStateItem(key);
    return value ? JSON.parse(value) : undefined;
  }
}
