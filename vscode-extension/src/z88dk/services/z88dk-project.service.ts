import { ProjectService } from '@core/abstractions/project.service';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { OutputChannelService } from '@core/services/output-channel.service';
import { Types } from '@core/types';
import { BUILD_DIRECTORY, BUILD_FILES_GLOB_PATTERN, BUILD_TASK_NAME } from '@z88dk/infrastructure';
import { Z88dkBreakpointService } from '@z88dk/services/z88dk-breakpoints.service';
import { Z88dkReportService } from '@z88dk/services/z88dk-report.service';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

@injectable()
export class Z88dkProjectService extends ProjectService {
  constructor(
    @inject(Types.OutputChannelService) private outputChannelService: OutputChannelService,
    @inject(Types.Z88dkReportService) private z88dkReportService: Z88dkReportService,
    @inject(Types.Z88dkBreakpointService) private z88dkBreakpointService: Z88dkBreakpointService
  ) {
    super();

    this._subscriptions.push(vscode.tasks.onDidEndTaskProcess(this.onDidEndTaskProcess));
  }

  @BindThis
  private async onDidEndTaskProcess(event: vscode.TaskProcessEndEvent): Promise<void> {
    if (event.execution.task.name === BUILD_TASK_NAME) {
      await this.moveGeneratedFiles();

      const outputChannel = this.outputChannelService.getDefaultOutputChannel();
      outputChannel.appendLine(vscode.l10n.t('Compilation finished'));
      outputChannel.show(true);

      await this.z88dkReportService.showMapFileReport();
    }
  }

  /**
   * move generated build files to build directory
   */
  private async moveGeneratedFiles(): Promise<void> {
    const findFiles = BUILD_FILES_GLOB_PATTERN.map((pattern) => vscode.workspace.findFiles(pattern));
    const files = (await Promise.all(findFiles)).flat();

    for (const file of files) {
      const newFilePath = path.join(WorkspaceHelpers.workspacePath, BUILD_DIRECTORY, path.basename(file.path));
      await vscode.workspace.fs.rename(file, vscode.Uri.file(newFilePath));
    }
  }
}
