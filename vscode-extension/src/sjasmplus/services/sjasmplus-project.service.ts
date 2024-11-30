import { ProjectService } from '@core/abstractions/project.service';
import { injectable } from 'inversify';

@injectable()
export class SjasmPlusProjectService extends ProjectService {
  constructor() {
    super();
  }
}
