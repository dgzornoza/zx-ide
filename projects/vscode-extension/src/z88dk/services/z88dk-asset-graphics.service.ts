import { ProjectService } from '@core/abstractions/project.service';
import { ConfigurationService } from '@core/services/configuration.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class Z88dkAssetGraphicsService extends ProjectService {
  constructor(
    @inject(Types.ExtensionContext) context: vscode.ExtensionContext,
    @inject(Types.ConfigurationService) private configurationService: ConfigurationService
  ) {
    super(context);
  }
}
