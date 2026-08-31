import { CommandName } from '@core/infrastructure';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { WebviewBaseCommand } from './webview-base.cmd';

@injectable()
export class AttachProjectMapTilesetCmd extends WebviewBaseCommand {
  public getCommandName(): CommandName {
    return CommandName.AttachProjectMapTileset;
  }

  constructor(@inject(Types.ExtensionContext) extensionContext: vscode.ExtensionContext) {
    super(extensionContext);
  }

  protected get viewType(): string {
    return 'zxide.attachProjectMapTileset';
  }
  protected get panelTitle(): string {
    return vscode.l10n.t('Extract Map Tileset');
  }
  protected get htmlPageName(): string {
    return 'extract-map-tileset.html';
  }

  // Explicit `false` gate: this panel uses the legacy SourceSection.vue flow
  // and must never receive an AssetsListMessage.
  protected override requiresAssetsList(): boolean {
    return false;
  }
}
