import { Disposable } from '@core/abstractions/disposable';
import { nameofFactory } from '@core/helpers/type-helpers';
import { ExtensionConfigurationModel } from '@core/infrastructure';
import { injectable } from 'inversify';
import * as vscode from 'vscode';

const Z88DK_CONFIGURATION_SECTION = 'zxide.z88dk';
const configKey = nameofFactory<ExtensionConfigurationModel>();

@injectable()
export class ConfigurationService extends Disposable {
  constructor() {
    super();
  }

  /**
   * Get the complete configuration model
   */
  getZ88dkConfiguration(): ExtensionConfigurationModel {
    const config = vscode.workspace.getConfiguration(Z88DK_CONFIGURATION_SECTION);

    return {
      useAsmDebug: config.get<boolean>(configKey('useAsmDebug'), false),
    };
  }

  /**
   * Watch for configuration changes
   * @param callback - Function to call when configuration changes
   * @returns Disposable to stop watching
   */
  onConfigurationChanged(callback: (config: ExtensionConfigurationModel) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(Z88DK_CONFIGURATION_SECTION)) {
        callback(this.getZ88dkConfiguration());
      }
    });
  }
}
