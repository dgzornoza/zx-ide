// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Command } from '@core/abstractions/command';
import '@core/helpers/array-helpers';
import { Logger } from '@core/logger';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { SjasmPlusProjectService } from '@sjasmplus/services/sjasmplus-project.service';
import { Z88dkProjectService } from '@z88dk/services/z88dk-project.service';
import * as vscode from 'vscode';
import { InversifyConfig } from './inversify.config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  InversifyConfig.initialize(context);

  // Resolving a command registers it in VS Code (see Command constructor).
  InversifyConfig.container.getAll<Command<unknown>>(Types.Command);

  FeaturesService.getProjectType()
    .then((projectType) => {
      switch (projectType) {
        case 'z88dk':
          InversifyConfig.container.get<Z88dkProjectService>(Types.Z88dkProjectService);
          break;
        case 'sjasmplus':
          InversifyConfig.container.get<SjasmPlusProjectService>(Types.SjasmPlusProjectService);
          break;
      }
    })
    .catch((error: unknown) => Logger.error(`Error activating project services: ${error instanceof Error ? error.stack : error}`));
}

// This method is called when your extension is deactivated
export function deactivate() {}
