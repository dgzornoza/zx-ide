import { Disposable } from '@core/abstractions/disposable';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import * as vscode from 'vscode';

export abstract class ProjectService extends Disposable {
  constructor() {
    super();

    if (!this.isDevContainer()) {
      vscode.commands.executeCommand('remote-containers.reopenInContainer');
    } else {
      void this.tryOpenReadmeFile();
    }
  }

  async tryOpenReadmeFile(): Promise<void> {
    const fileUri = WorkspaceHelpers.getWorkspaceUri('Readme.md');
    if (fileUri) {
      try {
        // Open in editor preview mode
        await vscode.commands.executeCommand('markdown.showPreview', fileUri);
      } catch (error) {
        console.error('can not open readme.md file', error);
      }
    }
  }
  private isDevContainer() {
    const devContainerEnv = process.env['REMOTE_CONTAINERS'];
    return devContainerEnv !== undefined;
  }
}
