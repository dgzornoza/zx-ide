import { IStatusBar, StatusBar, StatusBarChangeViewItem } from '@components/statusBar.component';
import { IDisposable } from '@core/abstractions/disposable';
import { Types } from '@core/types';
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
      .toDynamicValue((_: inversify.interfaces.Context) => {
        return InversifyConfig._extensionContext;
      })
      .inSingletonScope();

    // UI
    InversifyConfig._container.bind<IStatusBar>('IStatusBar').to(StatusBar).inSingletonScope().onActivation(InversifyConfig._subscribe);

    InversifyConfig._container
      .bind<StatusBarChangeViewItem>('StatusBarChangeViewItem')
      .to(StatusBarChangeViewItem)
      .inSingletonScope()
      .onActivation(InversifyConfig._subscribe);

    // Commands
    // ...

    // Providers
    // ...

    // Services
    // ...
  }

  private static _subscribe<T extends IDisposable>(_: inversify.interfaces.Context, injectable: T): T {
    // Add to a list of disposables which are disposed when this extension is deactivated.
    InversifyConfig._extensionContext.subscriptions.push(injectable);

    return injectable;
  }
}
