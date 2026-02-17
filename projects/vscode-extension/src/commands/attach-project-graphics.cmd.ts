import { Command } from '@core/abstractions/command';
import { FileHelpers } from '@core/helpers/file-helpers';
import { WebviewHelpers } from '@core/helpers/webview-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';
import type {
  CreateGraphicsMapMessage,
  GraphicsMapPayload,
  SpriteDefinition,
  TileDefinition,
} from '../../../shared/attach-project-graphics/graphics-map';

interface GraphicsMapData {
  source: string;
  graphicsData: string;
  tiles?: TileDefinition;
  sprites?: SpriteDefinition[];
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
      const panel = vscode.window.createWebviewPanel(
        'zxide.attachProjectGraphics',
        vscode.l10n.t('Attach project graphics'),
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'media')],
        }
      );

      panel.webview.html = await this.getWebviewHtml(panel.webview);

      panel.webview.onDidReceiveMessage(async (message: CreateGraphicsMapMessage | undefined) => {
        if (!message || message.messageType !== 'create') {
          return;
        }

        try {
          const mapData = await this.validateAndBuildMapData(message.data as GraphicsMapPayload);
          const mapRelativePath = this.buildMapRelativePath(mapData.source);

          await this.writeMapFile(mapRelativePath, mapData);
          console.log(JSON.stringify(mapData, null, 2));

          panel.webview.postMessage({
            type: 'status',
            ok: true,
            text: vscode.l10n.t('Graphics map saved at {0}', mapRelativePath),
          });
        } catch (error) {
          panel.webview.postMessage({
            type: 'status',
            ok: false,
            text: String(error),
          });
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(vscode.l10n.t('Error attaching Asset-Graphics file: {0}', String(error)));
    }
  }

  private async getWebviewHtml(webview: vscode.Webview): Promise<string> {
    const locale = vscode.env.language;
    return WebviewHelpers.buildWebviewHtml({
      webview,
      extensionUri: this.extensionContext.extensionUri,
      htmlPageName: 'attach-project-graphics.html',
      locale,
    });
  }

  private async validateAndBuildMapData(payload: GraphicsMapPayload): Promise<GraphicsMapData> {
    const source = this.normalizeRelativePath(payload.source);
    const graphicsData = this.normalizeRelativePath(payload.graphicsData);

    if (!source) {
      throw new Error(vscode.l10n.t('Asset Graphics File is required'));
    }

    if (!source.toLowerCase().endsWith('.png')) {
      throw new Error(vscode.l10n.t('Asset Graphics File must be a .png image'));
    }

    if (this.isAbsolutePath(source)) {
      throw new Error(vscode.l10n.t('Asset Graphics File must be a workspace-relative path'));
    }

    const sourceExists = await WorkspaceHelpers.workspaceFileExists(source);
    if (!sourceExists) {
      throw new Error(vscode.l10n.t('Asset Graphics File does not exist at the selected path'));
    }

    if (!graphicsData) {
      throw new Error(vscode.l10n.t('Graphics Data folder is required'));
    }

    if (!graphicsData.startsWith('src/') && graphicsData !== 'src') {
      throw new Error(vscode.l10n.t('Graphics Data folder must be inside the src/ directory'));
    }

    if (this.isAbsolutePath(graphicsData)) {
      throw new Error(vscode.l10n.t('Graphics Data folder must be a workspace-relative path'));
    }

    const graphicsDataUri = WorkspaceHelpers.getWorkspaceUri(graphicsData);
    await vscode.workspace.fs.createDirectory(graphicsDataUri);

    // Validate tiles
    if (payload.tileDefinitions) {
      this.validateTileDefinition(payload.tileDefinitions);
    }

    // Validate sprites
    if (payload.spriteDefinitions && payload.spriteDefinitions.length > 0) {
      for (const sprite of payload.spriteDefinitions) {
        this.validateSpriteDefinition(sprite);
      }
    }

    return {
      source,
      graphicsData,
      tiles: payload.tileDefinitions,
      sprites: payload.spriteDefinitions,
    };
  }

  private validateTileDefinition(tiles: TileDefinition): void {
    if (typeof tiles.count !== 'number' || tiles.count < 0) {
      throw new Error(vscode.l10n.t('Tile count must be a non-negative number'));
    }

    if (!Array.isArray(tiles.names) || tiles.names.length !== tiles.count) {
      throw new Error(vscode.l10n.t('Tile names count must match the tile count'));
    }

    for (const name of tiles.names) {
      if (!name || typeof name !== 'string') {
        throw new Error(vscode.l10n.t('All tile names must be non-empty strings'));
      }
    }
  }

  private validateSpriteDefinition(sprite: SpriteDefinition): void {
    if (!sprite.name || typeof sprite.name !== 'string') {
      throw new Error(vscode.l10n.t('Sprite name is required'));
    }

    if (typeof sprite.width !== 'number' || sprite.width <= 0) {
      throw new Error(vscode.l10n.t('Sprite width must be greater than zero'));
    }

    if (typeof sprite.height !== 'number' || sprite.height <= 0) {
      throw new Error(vscode.l10n.t('Sprite height must be greater than zero'));
    }

    if (!Array.isArray(sprite.frames)) {
      throw new Error(vscode.l10n.t('Sprite frames must be an array'));
    }

    for (const frame of sprite.frames) {
      if (typeof frame.column !== 'number' || frame.column < 0) {
        throw new Error(vscode.l10n.t('Frame column must be a non-negative number'));
      }

      if (typeof frame.row !== 'number' || frame.row < 0) {
        throw new Error(vscode.l10n.t('Frame row must be a non-negative number'));
      }
    }
  }

  private buildMapRelativePath(sourcePath: string): string {
    const normalized = this.normalizeRelativePath(sourcePath);
    const parsed = path.posix.parse(normalized);
    return path.posix.join(parsed.dir, `${parsed.name}.map.json`);
  }

  private async writeMapFile(relativePath: string, data: GraphicsMapData): Promise<void> {
    const targetUri = WorkspaceHelpers.getWorkspaceUri(relativePath);
    await FileHelpers.writeFile(JSON.stringify(data, null, 2), targetUri);
  }

  private normalizeRelativePath(value: string): string {
    return value.trim().replace(/\\/g, '/');
  }

  private isAbsolutePath(value: string): boolean {
    return path.isAbsolute(value) || /^[a-zA-Z]:\//.test(value);
  }
}
