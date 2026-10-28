import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { waitForFileCreation } from '../../core/helpers/wait-for-file';

suite('waitForFileCreation', () => {
  let folder: string;

  setup(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'zx-ide-wait-'));
  });

  teardown(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  test('resolves when the file is created', async () => {
    const filePath = path.join(folder, 'output.txt');

    const waiting = waitForFileCreation(filePath, 5000);
    setTimeout(() => fs.writeFileSync(filePath, '{}'), 50);

    await waiting;
    assert.strictEqual(fs.existsSync(filePath), true);
  });

  test('rejects when the file is not created before the timeout', async () => {
    const filePath = path.join(folder, 'never.txt');

    await assert.rejects(waitForFileCreation(filePath, 100), /never\.txt/);
  });
});
