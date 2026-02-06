import { Command } from '@core/abstractions/command';
import { nameof } from '@core/helpers/type-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { CommandName, ZxideFile } from '@core/infrastructure';
import { FeaturesService } from '@core/services/features.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

interface IQueryCommandData {
  /** Uri to graphics file (created from external app ie: zx paintbrush) */
  assetGraphicsPath: string;
  /** Uri to graphics data source code folder (where source code graphics files are stored in the project) */
  graphicsDataFolderPath: string;
}

@injectable()
export class AttachProjectGraphicsCmd extends Command<unknown> {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectGraphics;
  }

  constructor(@inject(Types.ExtensionContext) private extensionContext: vscode.ExtensionContext) {
    super();
  }

  public async execute(..._params: unknown[]): Promise<void> {
    try {
      const commandData = await this.queryCommandData();
      if (!commandData) {
        return;
      }

      await this.validateQueryData(commandData);

      await this.updateZxideFile(commandData);

      // Show success message
      vscode.window.showInformationMessage(vscode.l10n.t('Asset-Graphics file and destination folder configured successfully'));
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error attaching Asset-Graphics file: {0}', String(error)));
    }
  }

  private async queryCommandData(): Promise<IQueryCommandData | undefined> {
    // 1. Prompt user to select graphics file
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: vscode.l10n.t('Select Asset-Graphics File'),
      defaultUri: WorkspaceHelpers.getWorkspaceUri('assets', 'graphics'),
      filters: { 'ZXP Files': ['zxp'] },
    });

    if (!fileUri || !fileUri[0]) {
      return;
    }

    // 2. Prompt user to select destination folder for generated graphics-data (must be inside src/)
    const destFolderUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: vscode.l10n.t('Select graphics-data Destination Folder'),
      defaultUri: WorkspaceHelpers.getWorkspaceUri('src', 'data'),
    });

    if (!destFolderUri || !destFolderUri[0]) {
      return;
    }

    return {
      assetGraphicsPath: vscode.workspace.asRelativePath(fileUri[0]),
      graphicsDataFolderPath: vscode.workspace.asRelativePath(destFolderUri[0]),
    };
  }

  private async validateQueryData(commandData: IQueryCommandData): Promise<void> {
    // Validate graphics file exists
    const fileExists = await WorkspaceHelpers.workspaceFileExists(commandData.assetGraphicsPath);
    if (!fileExists) {
      vscode.window.showErrorMessage(vscode.l10n.t('Asset-Graphics File does not exist at the selected path'));
      return;
    }

    // Validate destination is inside src/ folder
    if (!commandData.graphicsDataFolderPath.startsWith('src/') && commandData.graphicsDataFolderPath !== 'src') {
      vscode.window.showErrorMessage(vscode.l10n.t('Destination graphics-data folder must be inside the src/ directory'));
      return;
    }

    // create destination folder if it doesn't exist
    const absoluteDestUri = WorkspaceHelpers.getWorkspaceUri(commandData.graphicsDataFolderPath);
    await vscode.workspace.fs.createDirectory(absoluteDestUri);
  }

  private async updateZxideFile(commandData: IQueryCommandData): Promise<void> {
    const projectZxideFilePath = '.zxide.json';

    // Get current zxide project file from FeaturesService
    if (!FeaturesService.zxideFile?.project) {
      vscode.window.showErrorMessage(vscode.l10n.t('Failed to read .zxide.json file'));
      return;
    }

    let assetsGraphics = FeaturesService.zxideFile.project.assetsGraphicsPaths ?? [];

    // Check if path already exists in 'assetsGraphics' array
    if (assetsGraphics.includes(commandData.assetGraphicsPath)) {
      vscode.window.showInformationMessage(vscode.l10n.t('Asset-Graphics file is already attached'));
      return;
    }

    // Add to array and write back
    assetsGraphics.push(commandData.assetGraphicsPath);

    // Write both assetsGraphics array and assetsGraphicsSource path
    await WorkspaceHelpers.writeWorkspaceJsonFile(
      assetsGraphics,
      [projectZxideFilePath],
      [nameof<ZxideFile>('project'), nameof<ZxideFile['project']>('assetsGraphicsPaths')]
    );
    await WorkspaceHelpers.writeWorkspaceJsonFile(
      commandData.graphicsDataFolderPath,
      [projectZxideFilePath],
      [nameof<ZxideFile>('project'), nameof<ZxideFile['project']>('graphicsDataFolderPath')]
    );
  }
}
