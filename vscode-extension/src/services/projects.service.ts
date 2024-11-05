import { Disposable } from '@core/abstractions/disposable';
import { injectable } from 'inversify';
import 'reflect-metadata';

/**
 * Service for manage ZxIde projects
 */
@injectable()
export class ProjectsService extends Disposable {
  constructor() {
    super();
  }

  /**
   * Function for create new zx-ide project
   */
  public async createNewProject(): Promise<void> {}

  // /** Function for obtain normalized controller path from normalized view path
  //  * @param normalizedViewPath normalized viewPath view path for obtain related controller path
  //  * @return normalized controller path related
  //  */
  // public getControllerFromViewPath(normalizedViewPath: string): string {
  //   let controllerPath: string = normalizedViewPath.replace(SeedEnvironmentConfig.ViewBasePath, SeedEnvironmentConfig.ControllersBasePath);
  //   controllerPath = controllerPath.replace('.html', '.controller.ts');
  //   return controllerPath;
  // }

  // /** Function for obtain controller class name from normalized path
  //  * @param normalizedPath normalized controller path
  //  * @return controller name
  //  */
  // public getControllerClassNameFromPath(normalizedPath: string): string {
  //   let result: string = normalizedPath.split('\\').pop().replace('.controller.ts', '');
  //   return result.charAt(0).toUpperCase() + result.slice(1) + 'Controller';
  // }

  // public getControllerRouteAlias(normalizedPath: string): string {
  //   let regex: RegExp = new RegExp(`${SeedEnvironmentConfig.ControllersBasePath.replace(/\\/g, '\\\\')}(.*).controller.ts`);
  //   return SeedEnvironmentConfig.RoutesAlias[regex.exec(normalizedPath)[1]];
  // }

  public dispose(): void {
    // not used
  }
}
