import { ProjectService } from '@core/abstractions/project.service';
import { BindThis } from '@core/decorators/bind-this.decorator';
import { FileHelpers } from '@core/helpers/file-helpers';
import { OutputChannelService } from '@core/services/output-channel.service';
import { Types } from '@core/types';
import { Z88dkBreakpointService } from '@z88dk/services/z88dk-breakpoints.services';
import { ProjectConfigurationStrategyFactory } from '@z88dk/services/z88dk-project-configuration.strategies';
import { Z88dkReportService } from '@z88dk/services/z88dk-report.service';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

export type ProjectConfigurationOptions = 'sdccClassicLib' | 'sdccNewLib' | 'sccz80ClassicLib' | 'sccz80NewLib';
const MAIN_LIS_FILE_PATH_SEGMENTS = ['build', 'main.c.lis'];
const BUILD_FILES_GLOB_PATTERN = ['src/**/*.lis', 'src/**/*.sym', 'src/**/*.o'];

@injectable()
export class Z88dkProjectService extends ProjectService {
  constructor(
    @inject(Types.Z88dkBreakpointService) private z88dkBreakpointService: Z88dkBreakpointService,
    @inject(Types.OutputChannelService) private outputChannelService: OutputChannelService,
    @inject(Types.Z88dkReportService) private z88dkReportService: Z88dkReportService
  ) {
    super();

    this._subscriptions.push(vscode.tasks.onDidEndTaskProcess(this.onDidEndTaskProcess));
  }

  /**
   * Function to configure the project (compiler, includes, etc. ) with the selected configuration
   * @param _projectConfiguration project configuration to apply
   */
  public async configureProject(_projectConfiguration: ProjectConfigurationOptions): Promise<void> {
    const strategy = ProjectConfigurationStrategyFactory.create(_projectConfiguration);

    await strategy.configureIncludePaths();
    await strategy.configureCompilerArguments();
  }

  @BindThis
  private onDidEndTaskProcess(event: vscode.TaskProcessEndEvent): void {
    if (event.execution.task.name === 'Compile') {
      // concat all .lis files for debug asm
      void this.concatAllLisFiles().then(async () => {
        // remove temporal build files
        const removeFilePromises = BUILD_FILES_GLOB_PATTERN.map((pattern) => this.removeFiles(pattern));
        await Promise.all(removeFilePromises);

        const outputChannel = this.outputChannelService.getDefaultOutputChannel();
        outputChannel.appendLine(vscode.l10n.t('Compilation finished'));
        outputChannel.show(true);

        await this.z88dkReportService.showMapFileReport();
      });
    }
  }

  private async concatAllLisFiles(): Promise<void> {
    // Obtener todos los archivos .lis en la carpeta del espacio de trabajo
    const files = await vscode.workspace.findFiles('src/**/*.lis');

    let concatenatedContent = '';
    for (const file of files) {
      const fileContent = await vscode.workspace.fs.readFile(file);
      concatenatedContent += fileContent.toString() + '\n';
    }

    try {
      await FileHelpers.writeFile(concatenatedContent, ...MAIN_LIS_FILE_PATH_SEGMENTS);
    } catch (error) {
      await vscode.window.showErrorMessage(`${vscode.l10n.t('Failed to concatenate .lis files for debug asm')} - ${error}`);
    }
  }

  private async removeFiles(globPattern: string): Promise<void> {
    const files = await vscode.workspace.findFiles(globPattern);

    for (const file of files) {
      await vscode.workspace.fs.delete(file);
    }
  }
}
