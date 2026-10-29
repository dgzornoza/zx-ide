import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZX_IDE_TEMPLATE_VERSION, ZX_ZXIDE_CLI_VERSION } from '../../infrastructure';
import { createNewProjectModel } from '../new-project.models';
import { GeneratorBuilder } from './generator-builder';

class TestGeneratorBuilder extends GeneratorBuilder {
  copyTemplateBase(): Promise<void> {
    return Promise.resolve();
  }
  copyTemplateSample(): Promise<void> {
    return Promise.resolve();
  }
  configureProject(): Promise<void> {
    return Promise.resolve();
  }
}

describe('GeneratorBuilder.createZxIdeProjectFile', () => {
  let targetPath: string;

  beforeEach(() => {
    targetPath = fs.mkdtempSync(path.join(os.tmpdir(), 'zx-ide-cli-'));
    fs.mkdirSync(path.join(targetPath, 'game'));
  });

  afterEach(() => {
    fs.rmSync(targetPath, { recursive: true, force: true });
  });

  it('writes the cli version, the template version and the default graphics paths to .zxide.json', async () => {
    const builder = new TestGeneratorBuilder(createNewProjectModel('z88dk', targetPath, 'game'));

    await builder.createZxIdeProjectFile();

    const zxideFile = JSON.parse(fs.readFileSync(path.join(targetPath, 'game', '.zxide.json'), 'utf8'));
    expect(zxideFile).toEqual({
      'zx-ide-cli-version': ZX_ZXIDE_CLI_VERSION,
      'template-version': ZX_IDE_TEMPLATE_VERSION,
      project: {
        type: 'z88dk',
        assetsGraphicsPaths: ['assets'],
        graphicsDataFolderPath: 'src/data',
      },
    });
  });
});
