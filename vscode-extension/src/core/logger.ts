import { TypeHelpers } from '@core/helpers/type-helpers';
import log from 'loglevel';
import * as vscode from 'vscode';

export class Logger {
  static trace(message?: string | object): void {
    message = this.formatMessage(message);
    log.trace(message);
  }

  static debug(message?: string | object): void {
    message = this.formatMessage(message);
    log.debug(message);
  }

  static info(message?: string | object): void {
    message = this.formatMessage(message);
    log.info(message);
    vscode.window.showInformationMessage(message);
  }

  static log(message?: string | object): void {
    message = this.formatMessage(message);
    log.log(message);
  }

  static warn(message?: string | object): void {
    message = this.formatMessage(message);
    log.warn(message);
    vscode.window.showWarningMessage(message);
  }

  static error(message?: string | object): void {
    message = this.formatMessage(message);
    log.error(message);
    vscode.window.showErrorMessage(message);
  }

  private static formatMessage(message: unknown): string {
    return TypeHelpers.isString(message) ? (message as string) : JSON.stringify(message);
  }
}
