import { ProjectService } from '@core/abstractions/project.service';
import { Types } from '@core/types';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class SjasmPlusProjectService extends ProjectService {
  constructor(@inject(Types.ExtensionContext) context: vscode.ExtensionContext) {
    super(context);
  }
}
