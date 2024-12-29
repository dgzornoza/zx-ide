import { CreateProjectCmd } from '@commands/create-project.cmd';
import { IStatusBar, StatusBar } from '@components/status-bar.component';
import { IDisposable } from '@core/abstractions/disposable';
import { OutputChannelService } from '@core/services/output-channel.service';
import { TerminalService } from '@core/services/terminal.service';
import { Types } from '@core/types';
import { SjasmPlusProjectService } from '@sjasmplus/services/sjasmplus-project.service';
import { Z88dkBreakpointService } from '@z88dk/services/z88dk-breakpoints.service';
import { Z88dkProjectService } from '@z88dk/services/z88dk-project.service';
import { Z88dkReportService } from '@z88dk/services/z88dk-report.service';
import * as inversify from 'inversify';
import * as vsc from 'vscode';

/** Class for configure IOC + DI from inversify library
 * https://github.com/inversify/InversifyJS
 */
export class InversifyConfig {
  private static _extensionContext: vsc.ExtensionContext;
  private static _container: inversify.Container;

  public static get container(): inversify.Container {
    return InversifyConfig._container;
  }

  public static initialize(extensionContext: vsc.ExtensionContext): void {
    InversifyConfig._extensionContext = extensionContext;
    InversifyConfig._container = new inversify.Container();

    // define IOC

    // Extension
    InversifyConfig._container
      .bind<vsc.ExtensionContext>(Types.ExtensionContext)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .toDynamicValue((_context: inversify.interfaces.Context) => {
        return InversifyConfig._extensionContext;
      })
      .inSingletonScope();

    // UI
    InversifyConfig._container.bind<IStatusBar>(Types.IStatusBar).to(StatusBar).inSingletonScope().onActivation(InversifyConfig._subscribe);

    // InversifyConfig._container
    //   .bind<StatusBarChangeViewItem>('StatusBarChangeViewItem')
    //   .to(StatusBarChangeViewItem)
    //   .inSingletonScope()
    //   .onActivation(InversifyConfig._subscribe);

    // Commands
    InversifyConfig._container
      .bind<CreateProjectCmd>(Types.CreateProjectCmd)
      .to(CreateProjectCmd)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    // Providers
    // ...

    // Services
    InversifyConfig._container
      .bind<OutputChannelService>(Types.OutputChannelService)
      .to(OutputChannelService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    InversifyConfig._container
      .bind<TerminalService>(Types.TerminalService)
      .to(TerminalService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    // Z88dk
    InversifyConfig._container
      .bind<Z88dkProjectService>(Types.Z88dkProjectService)
      .to(Z88dkProjectService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    InversifyConfig._container
      .bind<Z88dkReportService>(Types.Z88dkReportService)
      .to(Z88dkReportService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    InversifyConfig._container
      .bind<Z88dkBreakpointService>(Types.Z88dkBreakpointService)
      .to(Z88dkBreakpointService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    // SjasmPlus
    InversifyConfig._container
      .bind<SjasmPlusProjectService>(Types.SjasmPlusProjectService)
      .to(SjasmPlusProjectService)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);
  }

  private static _subscribe<T extends IDisposable>(_: inversify.interfaces.Context, injectable: T): T {
    // Add to a list of disposables which are disposed when this extension is deactivated.
    InversifyConfig._extensionContext.subscriptions.push(injectable);

    return injectable;
  }
}
