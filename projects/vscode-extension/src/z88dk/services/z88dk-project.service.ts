import { ProjectService } from '@core/abstractions/project.service';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { nameof } from '@core/helpers/type-helpers';
import { WorkspaceHelpers } from '@core/helpers/workspace-helpers';
import { DezogConfigurationModel, LaunchConfigFileModel, z88dkv2ConfigurationModel } from '@core/infrastructure';
import { ConfigurationService } from '@core/services/configuration.service';
import { OutputChannelService } from '@core/services/output-channel.service';
import { Types } from '@core/types';
import { BUILD_DIRECTORY, BUILD_FILES_GLOB_PATTERN } from '@z88dk/infrastructure';
import { Z88dkAsmBreakpointService } from '@z88dk/services/z88dk-asm-breakpoints.service';
import { Z88dkReportService } from '@z88dk/services/z88dk-report.service';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

@injectable()
export class Z88dkProjectService extends ProjectService {
  constructor(
    @inject(Types.ExtensionContext) context: vscode.ExtensionContext,
    @inject(Types.ConfigurationService) private configurationService: ConfigurationService,
    @inject(Types.OutputChannelService) private outputChannelService: OutputChannelService,
    @inject(Types.Z88dkReportService) private z88dkReportService: Z88dkReportService,
    @inject(Types.Z88dkBreakpointService) private z88dkBreakpointService: Z88dkAsmBreakpointService
  ) {
    super(context);

    this._subscriptions.push(vscode.tasks.onDidEndTaskProcess(this.onDidEndTaskProcess));

    void this.configureDezogZ88dkLaunchTask();
    this.configurationService.onConfigurationChanged(this.configureDezogZ88dkLaunchTask.bind(this));
  }

  @BindThis
  private async onDidEndTaskProcess(event: vscode.TaskProcessEndEvent): Promise<void> {
    // validate if the finished task is a z88dk make task
    if (
      event.execution.task.definition.id.includes('make') &&
      (event.execution.task.definition.id.includes('COMPILER=sdcc') || event.execution.task.definition.id.includes('COMPILER=sccz80'))
    ) {
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
      await vscode.workspace.fs.rename(file, vscode.Uri.file(newFilePath), { overwrite: true });
    }
  }

  /** Configure launch task for debugging z88dk with dezog */
  private async configureDezogZ88dkLaunchTask(): Promise<void> {
    const launchPath = ['.vscode', 'launch.json'];
    const launchJson = await WorkspaceHelpers.readWorkspaceJsonFile<LaunchConfigFileModel>(...launchPath);

    // write debugger info only for all 'dezog' configurations (maintain outer json structure and comments)
    const useAsmDebug = this.configurationService.getZ88dkConfiguration().useAsmDebug;
    for (const [index, config] of launchJson.configurations.entries()) {
      let z88dkConfig: z88dkv2ConfigurationModel[];
      if (config.type === 'dezog') {
        // using Asm debug configuration
        if (useAsmDebug) {
          z88dkConfig = this.getZ88dkAsmDebugConfiguration();
          this.z88dkBreakpointService.enable();
        } else {
          // using C debug configuration
          z88dkConfig = this.getZ88dkCDebugConfiguration();
          this.z88dkBreakpointService.disable();
        }

        const jsonPath = [nameof<LaunchConfigFileModel>('configurations'), index, nameof<DezogConfigurationModel>('z88dkv2')];
        await WorkspaceHelpers.writeWorkspaceJsonFile(z88dkConfig, launchPath, jsonPath);
      }
    }
  }

  /** Debug configuration for assembler code (only can debug in .source.lis asm code with C comments) */
  private getZ88dkAsmDebugConfiguration(): z88dkv2ConfigurationModel[] {
    const projectName = path.basename(WorkspaceHelpers.workspacePath);

    return [
      {
        path: `./build/${projectName}.source.lis`,
        mapFile: `./build/${projectName}.map`,
        srcDirs: [],
      },
    ];
  }

  /** Debug configuration for C code (only can debug C code) */
  private getZ88dkCDebugConfiguration(): z88dkv2ConfigurationModel[] {
    const projectName = path.basename(WorkspaceHelpers.workspacePath);

    return [
      {
        path: './build/**/*.lis',
        mapFile: `./build/${projectName}.map`,
        srcDirs: [''],
      },
    ];
  }
}
